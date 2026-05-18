import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAnthropic, MODELS, webSearchTool } from '@/lib/anthropic';
import { buildSystemPrompt } from '@/lib/prompts/build';
import { DeliverableSchema, type Deliverable } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 300; // up to 5 min for deep workflows

/**
 * Streams Server-Sent Events:
 *   event: status      data: {phase: "searching" | "writing" | "validating" | "saving"}
 *   event: deliverable data: <Deliverable JSON>
 *   event: error       data: {message}
 *   event: done        data: {deliverable_id}
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: run_id } = await params;
  const supabase = createServerClient();

  const { data: run } = await supabase.from('workflow_runs').select('*').eq('id', run_id).single();
  if (!run) return new Response('run not found', { status: 404 });

  const { data: workflow } = await supabase.from('workflows').select('*').eq('id', run.workflow_id).single();
  if (!workflow) return new Response('workflow not found', { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        await supabase.from('workflow_runs').update({ status: 'running' }).eq('id', run_id);

        const systemPrompt = await buildSystemPrompt(workflow.system_prompt_module);

        const depth = run.intake_inputs?.depth || 'standard';
        const maxSearches = depth === 'deep' ? 10 : depth === 'quick' ? 3 : 6;

        const executeInstruction = `Execute the approved plan below for the "${workflow.name}" workflow.

<intake>
${JSON.stringify(run.intake_inputs, null, 2)}
</intake>

<approved_plan>
${JSON.stringify(run.plan, null, 2)}
</approved_plan>

Required deliverable sections:
${(workflow.output_template?.required_sections || []).map((s: string) => `- ${s}`).join('\n')}

USE the web_search tool aggressively for any factual claim. The "verified" confidence tag REQUIRES that the citation_url was returned by web_search in this conversation.

After completing your research, return the final deliverable as a SINGLE JSON object matching this schema (no prose, no markdown fences around it):

{
  "verdict": "one-paragraph headline finding",
  "sections": [
    {
      "heading": "section title",
      "domain_tags": ["market" | "engineering" | "financial" | "design" | "regulatory" | "manufacturing"],
      "body": "prose or bullet points in markdown",
      "claims": [
        {
          "text": "the factual claim being made",
          "confidence": "verified" | "unverified" | "estimate" | "assumption" | "needs_expert",
          "citation_url": "https://... (required if verified, optional otherwise)",
          "citation_title": "publication/page title (required if verified)",
          "rationale": "for non-verified: explain estimate basis or which expert is needed"
        }
      ]
    }
  ],
  "open_questions": ["..."],
  "risks": ["..."]
}

Domain tags must use the lowercase tokens above. Every section needs at least one domain_tag.`;

        send('status', { phase: 'searching' });

        const anthropic = getAnthropic();
        const response = await anthropic.messages.create({
          model: MODELS.DEFAULT,
          max_tokens: 8000,
          system: systemPrompt,
          tools: [webSearchTool(maxSearches)],
          messages: [{ role: 'user', content: executeInstruction }],
        });

        send('status', { phase: 'validating' });

        // Collect all URLs from web_search_tool_result blocks
        const searchedUrls = new Set<string>();
        for (const block of response.content) {
          if ((block as any).type === 'web_search_tool_result') {
            const results = (block as any).content;
            if (Array.isArray(results)) {
              for (const r of results) {
                if (r.url) searchedUrls.add(r.url);
              }
            }
          }
        }

        // Find the text block with the final JSON
        const textBlocks = response.content.filter(b => b.type === 'text');
        if (!textBlocks.length) throw new Error('No text output from model');
        const finalText = (textBlocks[textBlocks.length - 1] as any).text as string;

        // Extract JSON: take everything between the first { and the last }
        const firstBrace = finalText.indexOf('{');
        const lastBrace = finalText.lastIndexOf('}');
        if (firstBrace < 0 || lastBrace < 0) throw new Error('No JSON object found in final output');
        const jsonStr = finalText.slice(firstBrace, lastBrace + 1);

        let parsed: Deliverable;
        try {
          parsed = DeliverableSchema.parse(JSON.parse(jsonStr));
        } catch (e: any) {
          send('error', { message: `Schema validation failed: ${e.message}`, raw: finalText.slice(0, 500) });
          await supabase.from('workflow_runs').update({ status: 'failed', error_message: e.message }).eq('id', run_id);
          controller.close();
          return;
        }

        // Citation validator: if a claim is "verified", its URL must have been returned by web_search.
        // Otherwise we downgrade it to "unverified" with a note.
        let downgraded = 0;
        for (const section of parsed.sections) {
          for (const claim of section.claims) {
            if (claim.confidence === 'verified') {
              if (!claim.citation_url || !searchedUrls.has(claim.citation_url)) {
                claim.confidence = 'unverified';
                claim.rationale = (claim.rationale ? claim.rationale + ' ' : '') +
                  '[Auto-downgraded: citation URL did not appear in web_search results for this run.]';
                downgraded++;
              }
            }
          }
        }
        if (downgraded > 0) {
          send('status', { phase: 'validating', downgraded });
        }

        send('status', { phase: 'saving' });

        const markdown = renderMarkdown(parsed, workflow.name, run.intake_inputs?.topic);

        const title = run.intake_inputs?.topic
          ? `${workflow.name}: ${run.intake_inputs.topic.slice(0, 80)}`
          : workflow.name;

        const { data: deliverable, error: delError } = await supabase
          .from('deliverables')
          .insert({
            workflow_run_id: run_id,
            title,
            structured_content: parsed,
            content_markdown: markdown,
          })
          .select()
          .single();
        if (delError) throw delError;

        await supabase.from('workflow_runs')
          .update({ status: 'complete', completed_at: new Date().toISOString() })
          .eq('id', run_id);

        send('deliverable', parsed);
        send('done', { deliverable_id: deliverable.id });
        controller.close();
      } catch (e: any) {
        send('error', { message: e.message });
        await supabase.from('workflow_runs')
          .update({ status: 'failed', error_message: e.message })
          .eq('id', run_id);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

function renderMarkdown(d: Deliverable, workflowName: string, topic?: string): string {
  const tag = (t: string) => `\`[${t.toUpperCase()}]\``;
  const claimMd = (c: any): string => {
    const conf = c.confidence === 'verified' && c.citation_url
      ? `[${c.citation_title || 'source'}](${c.citation_url})`
      : `\`[${c.confidence.replace('_', ' ').toUpperCase()}]\`${c.rationale ? ` — ${c.rationale}` : ''}`;
    return `- ${c.text} — ${conf}`;
  };
  const sections = d.sections.map(s => {
    const tags = s.domain_tags.map(tag).join(' ');
    const claimsMd = s.claims.length ? `\n\n**Claims & sources:**\n${s.claims.map(claimMd).join('\n')}` : '';
    return `## ${s.heading} ${tags}\n\n${s.body}${claimsMd}`;
  }).join('\n\n');
  const risks = d.risks?.length ? `\n\n## Risks\n${d.risks.map(r => `- ${r}`).join('\n')}` : '';
  const open = d.open_questions?.length ? `\n\n## Open Questions\n${d.open_questions.map(q => `- ${q}`).join('\n')}` : '';
  const header = topic ? `# ${workflowName}: ${topic}\n` : `# ${workflowName}\n`;
  return `${header}\n> **Verdict.** ${d.verdict}\n\n${sections}${risks}${open}`;
}
