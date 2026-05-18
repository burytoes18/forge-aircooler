import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { DeliverableView } from '@/components/deliverable-view';
import type { Deliverable } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export default async function DeliverablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data: deliverable } = await supabase
    .from('deliverables').select('*').eq('id', id).single();
  if (!deliverable) notFound();

  return (
    <div className="space-y-8">
      <header className="flex items-baseline justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
            {new Date(deliverable.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <h1 className="font-display text-3xl leading-tight">{deliverable.title}</h1>
        </div>
        <a href={`/api/exports/${deliverable.id}?fmt=md`} className="btn-ghost text-sm shrink-0">
          Export markdown
        </a>
      </header>

      <DeliverableView deliverable={deliverable.structured_content as Deliverable} />
    </div>
  );
}
