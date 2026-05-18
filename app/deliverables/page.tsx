import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DeliverablesPage() {
  const supabase = createServerClient();
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, title, created_at, structured_content, workflow_run_id')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">Library</div>
        <h1 className="font-display text-4xl">Deliverables</h1>
        <p className="text-muted mt-2">All research outputs, newest first.</p>
      </header>

      {deliverables?.length ? (
        <ul className="space-y-3">
          {deliverables.map(d => {
            const sections = (d.structured_content as any)?.sections || [];
            const domains = new Set<string>();
            for (const s of sections) for (const t of s.domain_tags || []) domains.add(t);
            const claimCount = sections.reduce((acc: number, s: any) => acc + (s.claims?.length || 0), 0);
            const verifiedCount = sections.reduce((acc: number, s: any) =>
              acc + (s.claims?.filter((c: any) => c.confidence === 'verified').length || 0), 0);

            return (
              <li key={d.id}>
                <Link
                  href={`/deliverables/${d.id}`}
                  className="block card p-5 hover:border-ink transition-colors group"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="font-display text-lg group-hover:text-accent transition-colors flex-1 min-w-0">{d.title}</div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-muted shrink-0">
                      {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                    {[...domains].map(t => <span key={t} className={`chip chip-domain-${t}`}>{t}</span>)}
                    <span className="ml-2 font-mono text-[11px] uppercase tracking-widest">
                      {claimCount} claim{claimCount === 1 ? '' : 's'} · {verifiedCount} verified
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted italic">No deliverables yet. Run a workflow to create one.</p>
      )}
    </div>
  );
}
