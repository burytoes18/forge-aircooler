import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAnthropic, MODELS, webSearchTool } from '@/lib/anthropic';
import { buildSystemPrompt } from '@/lib/prompts/build';
import { AskAnswerSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: 'question required' }, { status: 400 });
    }

    const systemPrompt = await buildSystemPrompt();

    const instruction = `The user asks: "${question.trim()}"

This is a one-off Ask query (no workflow). Respond as 2–6 bullets in the schema below. Use web_search for any factual claim. Apply the same confidence-tag discipline as the workflow runs.

Return ONLY valid JSON (no prose, no markdown fences):

{
  "domain_tags": ["market" | "engineering" | "financial" | "design" | "regulatory" | "manufacturing"],
  "bullets": [
    {
      "text": "the bullet content (1-3 sentences)",
      "claims": [
        {
          "text": "factual claim within the bullet",
          "confidence": "verified" | "unverified" | "estimate" | "assumption" | "needs_expert",
          "citation_url": "https://...",
          "citation_title": "...",
          "rationale": "for non-verified"
        }
      ]
    }
  ]
}`;

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: MODELS.DEFAULT,
      max_tokens: 3000,
      system: systemPrompt,
      tools: [webSearchTool(3)],
      messages: [{ role: 'user', content: instruction }],
    });

    // Citation validation
    const searchedUrls = new Set<string>();
    for (const block of response.content) {
      if ((block as any).type === 'web_search_tool_result') {
        const results = (block as any).content;
        if (Array.isArray(results)) for (const r of results) if (r.url) searchedUrls.add(r.url);
      }
    }

    const textBlocks = response.content.filter(b => b.type === 'text');
    if (!textBlocks.length) return NextResponse.json({ error: 'no text response' }, { status: 500 });
    const finalText = (textBlocks[textBlocks.length - 1] as any).text as string;

    const firstBrace = finalText.indexOf('{');
    const lastBrace = finalText.lastIndexOf('}');
    if (firstBrace < 0) return NextResponse.json({ error: 'no JSON in response', raw: finalText.slice(0, 300) }, { status: 500 });

    let parsed;
    try {
      parsed = AskAnswerSchema.parse(JSON.parse(finalText.slice(firstBrace, lastBrace + 1)));
    } catch (e: any) {
      return NextResponse.json({ error: `schema validation failed: ${e.message}`, raw: finalText.slice(0, 500) }, { status: 500 });
    }

    // Downgrade any unverifiable "verified" claims
    for (const b of parsed.bullets) {
      for (const c of b.claims) {
        if (c.confidence === 'verified' && (!c.citation_url || !searchedUrls.has(c.citation_url))) {
          c.confidence = 'unverified';
          c.rationale = (c.rationale ? c.rationale + ' ' : '') + '[Auto-downgraded: citation not in search results.]';
        }
      }
    }

    // Render markdown
    const tag = (t: string) => `\`[${t.toUpperCase()}]\``;
    const markdown = `${parsed.domain_tags.map(tag).join(' ')}\n\n${parsed.bullets.map(b => {
      const claims = b.claims.length
        ? '\n  ' + b.claims.map(c => {
            const conf = c.confidence === 'verified' && c.citation_url
              ? `[${c.citation_title || 'source'}](${c.citation_url})`
              : `\`[${c.confidence.replace('_', ' ').toUpperCase()}]\``;
            return `- ${c.text} — ${conf}`;
          }).join('\n  ')
        : '';
      return `- ${b.text}${claims}`;
    }).join('\n')}`;

    const supabase = createServerClient();
    const { data: saved } = await supabase
      .from('ask_history')
      .insert({ question: question.trim(), structured_answer: parsed, content_markdown: markdown })
      .select()
      .single();

    return NextResponse.json({ answer: parsed, markdown, id: saved?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
