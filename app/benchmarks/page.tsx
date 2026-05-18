import { createServerClient } from '@/lib/supabase/server';
import { BenchmarkTable } from '@/components/benchmark-table';

export const dynamic = 'force-dynamic';

export default async function BenchmarksPage() {
  const supabase = createServerClient();
  const { data: benchmarks } = await supabase
    .from('benchmarks')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
          Grounding Reference
        </div>
        <h1 className="font-display text-4xl">Benchmarks</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Every research output is pressure-tested against these figures. Click{' '}
          <span className="font-mono text-sm">Re-verify</span> to search the web for the latest
          value and propose an update — you approve before anything changes.
        </p>
      </header>

      <BenchmarkTable initialBenchmarks={benchmarks ?? []} />
    </div>
  );
}
