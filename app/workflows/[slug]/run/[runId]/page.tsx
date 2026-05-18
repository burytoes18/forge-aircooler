import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { WorkflowRunner } from '@/components/workflow-runner';

export const dynamic = 'force-dynamic';

export default async function RunPage({ params }: { params: Promise<{ slug: string; runId: string }> }) {
  const { slug, runId } = await params;
  const supabase = createServerClient();
  const { data: run } = await supabase.from('workflow_runs').select('*').eq('id', runId).single();
  if (!run) notFound();
  const { data: workflow } = await supabase.from('workflows').select('*').eq('id', run.workflow_id).single();
  if (!workflow || workflow.slug !== slug) notFound();

  // Look up any deliverable already produced from this run
  const { data: deliverable } = await supabase
    .from('deliverables').select('id').eq('workflow_run_id', runId).maybeSingle();

  return (
    <WorkflowRunner
      run={run}
      workflowName={workflow.name}
      existingDeliverableId={deliverable?.id || null}
    />
  );
}
