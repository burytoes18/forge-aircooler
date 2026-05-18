import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { createServerClient } from '@/lib/supabase/server';

const MODULES = [
  'system-core.md',
  'agent-behavior.md',
  'output-standards.md',
  'guardrails.md',
] as const;

function loadModule(name: string): string {
  const filepath = path.join(process.cwd(), 'lib', 'prompts', name);
  return fs.readFileSync(filepath, 'utf-8');
}

/**
 * Assembles the full system prompt: modular system files + live project brief + benchmarks.
 * Optionally appends a workflow-specific system prompt module.
 */
export async function buildSystemPrompt(workflowModule?: string): Promise<string> {
  const supabase = createServerClient();

  const [{ data: brief }, { data: benchmarks }] = await Promise.all([
    supabase.from('project_brief').select('*').limit(1).maybeSingle(),
    supabase.from('benchmarks').select('metric, value, unit, source_url, source_title, confidence_tag, last_verified_at'),
  ]);

  const core = MODULES.map(loadModule).join('\n\n---\n\n');

  const briefSection = brief
    ? `\n\n---\n\n# Project Brief (current state, editable in app)\n\n## Product Context\n${brief.product_context}\n\n## Known Unknowns\n${brief.unknowns}\n\n## Domain Areas\n${brief.domain_areas}\n\n## Anti-Patterns\n${brief.anti_patterns}`
    : '';

  let benchmarkSection = '';
  if (benchmarks && benchmarks.length) {
    const rows = benchmarks
      .map((b: any) => `- ${b.metric}: ${b.value} ${b.unit} [${b.confidence_tag}]${b.source_title ? ` — ${b.source_title}` : ''}`)
      .join('\n');
    benchmarkSection = `\n\n---\n\n# Grounding Reference (live benchmarks)\n\nPressure-test any new figures against these. Flag inconsistencies.\n\n<benchmark>\n${rows}\n</benchmark>`;
  }

  const workflow = workflowModule ? `\n\n---\n\n# Active Workflow\n\n${workflowModule}` : '';

  return core + briefSection + benchmarkSection + workflow;
}
