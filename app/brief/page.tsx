import { createServerClient } from '@/lib/supabase/server';
import { BriefEditor } from '@/components/brief-editor';

export const dynamic = 'force-dynamic';

export default async function BriefPage() {
  const supabase = createServerClient();
  const { data: brief } = await supabase
    .from('project_brief')
    .select('*')
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
          Source of truth
        </div>
        <h1 className="font-display text-4xl">Project Brief</h1>
        <p className="text-muted mt-2 max-w-2xl">
          The agent reads this before every workflow and Ask query. Edit any section and save —
          changes take effect on the next run.
        </p>
      </header>

      {brief ? (
        <BriefEditor brief={brief} />
      ) : (
        <div className="card p-6 text-muted text-sm">
          Brief not found. Run <code className="font-mono bg-ink/5 px-1 rounded">npm run seed</code> to populate.
        </div>
      )}
    </div>
  );
}
