import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getAnthropic, MODELS, webSearchTool } from '@/lib/anthropic';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: benchmark, error } = await supabase
    .from('benchmarks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !benchmark) {
    return NextResponse.json({ error: 'benchmark not found' }, { status: 404 });
  }

  const instruction = `You are verifying a benchmark figure for a hardware product research workspace.
The product is a residential/commercial air cooling device operating on the radiator/heat-exchanger principle (NOT a compressor AC, NOT an evaporative cooler).

Benchmark to verify:
- Metric: ${benchmark.metric}
- Current value: ${benchmark.value} ${benchmark.unit}
- Current source: ${benchmark.source_title || 'none recorded'}
- Notes: ${benchmark.notes || 'none'}

Use web_search to find the most authoritative, current source for this figure. Then return ONLY a JSON object:
{
  "proposed_value": "the verified figure (as a string, may be a range)",
  "unit": "unit unchanged unless corrected",
  "confidence_tag": "verified" | "estimate" | "unverified" | "needs_expert",
  "source_url": "real URL from search or null",
  "source_title": "publication/page name or null",
  "rationale": "one sentence: what you found and why you propose this value"
}

No prose. No markdown fences. JSON only.`;

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: MODELS.DEFAULT,
      max_tokens: 800,
      tools: [webSearchTool(3)],
      messages: [{ role: 'user', content: instruction }],
    });

    // Collect searched URLs for citation validation
    const searchedUrls = new Set<string>();
    for (const block of response.content) {
      if ((block as any).type === 'web_search_tool_result') {
        const results = (block as any).content;
        if (Array.isArray(results)) {
          for (const r of results) if (r.url) searchedUrls.add(r.url);
        }
      }
    }

    const textBlocks = response.content.filter(b => b.type === 'text');
    if (!textBlocks.length) {
      return NextResponse.json({ error: 'no text response from model' }, { status: 500 });
    }
    const raw = (textBlocks[textBlocks.length - 1] as any).text as string;
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first < 0) return NextResponse.json({ error: 'no JSON in response' }, { status: 500 });

    const proposal = JSON.parse(raw.slice(first, last + 1));

    // Downgrade to unverified if the URL wasn't actually in search results
    if (proposal.confidence_tag === 'verified' && proposal.source_url && !searchedUrls.has(proposal.source_url)) {
      proposal.confidence_tag = 'unverified';
      proposal.rationale += ' [Citation not confirmed in search results — treat as unverified.]';
    }

    return NextResponse.json({ proposal, benchmark_id: id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH — actually apply an approved proposal to the DB
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { proposed_value, unit, confidence_tag, source_url, source_title, rationale } = body;

  if (!proposed_value) {
    return NextResponse.json({ error: 'proposed_value required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('benchmarks')
    .update({
      value: proposed_value,
      unit: unit || undefined,
      confidence_tag,
      source_url: source_url || null,
      source_title: source_title || null,
      notes: rationale || undefined,
      last_verified_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ benchmark: data });
}
