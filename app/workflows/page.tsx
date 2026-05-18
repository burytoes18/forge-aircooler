import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function WorkflowsPage() {
  const supabase = createServerClient();
  const { data: workflows } = await supabase.from('workflows').select('*').order('name');

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">Surface</div>
        <h1 className="font-display text-4xl">Workflows</h1>
        <p className="text-muted mt-2">Structured research routines, each with its own intake, plan, and output template.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows?.map(w => (
          <Link
            key={w.id}
            href={`/workflows/${w.slug}`}
            className="card p-6 hover:border-ink transition-colors group"
          >
            <div className="font-display text-xl group-hover:text-accent transition-colors">{w.name}</div>
            <div className="text-sm text-muted mt-2 leading-relaxed">{w.description}</div>
            <div className="mt-4 text-[11px] font-mono uppercase tracking-widest text-muted">
              {(w.output_template?.required_sections || []).length} sections
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
