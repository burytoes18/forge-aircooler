import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { WorkflowIntake } from '@/components/workflow-intake';

export const dynamic = 'force-dynamic';

export default async function WorkflowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: workflow } = await supabase.from('workflows').select('*').eq('slug', slug).single();
  if (!workflow) notFound();

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">Workflow</div>
        <h1 className="font-display text-4xl">{workflow.name}</h1>
        <p className="text-muted mt-2 max-w-2xl">{workflow.description}</p>
      </header>

      <div className="card p-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-4">Intake</div>
        <WorkflowIntake
          workflowId={workflow.id}
          intakeSchema={workflow.intake_schema}
          requiredSections={workflow.output_template?.required_sections || []}
        />
      </div>
    </div>
  );
}
