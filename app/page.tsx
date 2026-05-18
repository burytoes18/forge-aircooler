import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { QuickAsk } from '@/components/quick-ask';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createServerClient();

  const [{ data: workflows }, { data: recent }, { data: stale }] = await Promise.all([
    supabase.from('workflows').select('id, slug, name, description').order('name'),
    supabase.from('deliverables').select('id, title, created_at').order('created_at', { ascending: false }).limit(4),
    supabase.from('benchmarks').select('id, metric, last_verified_at').order('last_verified_at', { ascending: true }).limit(3),
  ]);

  return (
    <div className="space-y-12">
      <header>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">Project</div>
        <h1 className="font-display text-5xl leading-none">Radiator-principle air cooler</h1>
        <p className="mt-4 text-muted max-w-2xl">
          Liquid-coolant heat exchanger as an alternative to compressor-based ACs.
          Multi-domain research workspace — market, engineering, financial, design, regulatory, manufacturing.
        </p>
      </header>

      {/* Quick Ask */}
      <section className="card p-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3">Ask anything</div>
        <QuickAsk />
      </section>

      {/* Workflows */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Run a workflow</h2>
          <Link href="/workflows" className="text-sm text-muted hover:text-ink underline decoration-rule underline-offset-4">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workflows?.map(w => (
            <Link
              key={w.id}
              href={`/workflows/${w.slug}`}
              className="card p-5 hover:border-ink hover:bg-paper transition-colors group"
            >
              <div className="font-display text-lg group-hover:text-accent transition-colors">{w.name}</div>
              <div className="text-sm text-muted mt-1.5 leading-relaxed">{w.description}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent + stale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Recent deliverables</h2>
            <Link href="/deliverables" className="text-sm text-muted hover:text-ink underline decoration-rule underline-offset-4">
              All
            </Link>
          </div>
          {recent?.length ? (
            <ul className="space-y-2">
              {recent.map(d => (
                <li key={d.id}>
                  <Link
                    href={`/deliverables/${d.id}`}
                    className="block py-3 px-4 border border-rule rounded-sm hover:border-ink hover:bg-paper transition-colors"
                  >
                    <div className="font-medium">{d.title}</div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-muted mt-1">
                      {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-sm italic">No deliverables yet. Run your first workflow above.</p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">Stale benchmarks</h2>
          {stale?.length ? (
            <ul className="space-y-2">
              {stale.map(b => (
                <li key={b.id} className="text-sm">
                  <Link href="/benchmarks" className="block py-2 px-3 border border-rule rounded-sm hover:border-ink transition-colors">
                    <div>{b.metric}</div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-muted mt-0.5">
                      {new Date(b.last_verified_at).toLocaleDateString('en-IN')}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-sm italic">Run seed script to populate.</p>
          )}
        </section>
      </div>
    </div>
  );
}
