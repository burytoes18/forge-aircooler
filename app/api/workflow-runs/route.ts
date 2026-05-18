import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAnthropic, MODELS } from '@/lib/anthropic';
import { buildSystemPrompt } from '@/lib/prompts/build';
import { PlanSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { workflow_id, intake_inputs } = await req.json();
    if (!workflow_id || !intake_inputs) {
      return NextResponse.json({ error: 'workflow_id and intake_inputs required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data: workflow, error: wfError } = await supabase
      .from('workflows').select('*').eq('id', workflow_id).single();
    if (wfError || !workflow) {
      return NextResponse.json({ error: 'workflow not found' }, { status: 404 });
    }

    const systemPrompt = await buildSystemPrompt(workflow.system_prompt_module);

    const planInstruction = `The user has invoked the "${workflow.name}" workflow with these intake inputs:

<intake>
${JSON.stringify(intake_inputs, null, 2)}
</intake>

Produce a concise execution plan as JSON matching this exact schema:
{
  "summary": "one-sentence framing of what you'll research",
  "steps": [{"number": 1, "description": "...", "expected_output": "..."}],
  "clarifying_question": null OR a single targeted question if the intake is too ambiguous to proceed
}

Aim for 4–7 steps. Each step should map to a section of the final deliverable per the workflow's output_template. Do not actually do the research yet — only produce the plan.

Required deliverable sections for this workflow:
${(workflow.output_template?.required_sections || []).map((s: string) => `- ${s}`).join('\n')}

Return ONLY valid JSON, no prose, no markdown fences.`;

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: MODELS.DEFAULT,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: planInstruction }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'no text in response' }, { status: 500 });
    }

    // Strip any accidental fences
    const cleaned = textBlock.text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    let plan;
    try {
      plan = PlanSchema.parse(JSON.parse(cleaned));
    } catch (e) {
      return NextResponse.json({ error: 'plan failed schema validation', raw: textBlock.text }, { status: 500 });
    }

    const { data: run, error: runError } = await supabase
      .from('workflow_runs')
      .insert({ workflow_id, intake_inputs, plan, status: 'planning' })
      .select()
      .single();
    if (runError) return NextResponse.json({ error: runError.message }, { status: 500 });

    return NextResponse.json({ run, workflow });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
