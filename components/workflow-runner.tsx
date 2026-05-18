'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeliverableView } from '@/components/deliverable-view';
import type { Deliverable } from '@/lib/schemas';

type Plan = {
  summary: string;
  steps: { number: number; description: string; expected_output: string }[];
  clarifying_question?: string | null;
};

type Run = {
  id: string;
  workflow_id: string;
  intake_inputs: Record<string, any>;
  plan: Plan | null;
  status: 'planning' | 'approved' | 'running' | 'complete' | 'failed';
  error_message?: string | null;
};

export function WorkflowRunner({
  run: initialRun,
  workflowName,
  existingDeliverableId,
}: {
  run: Run;
  workflowName: string;
  existingDeliverableId: string | null;
}) {
  const router = useRouter();
  const [run, setRun] = useState(initialRun);
  const [phase, setPhase] = useState<string>('');
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [savedId, setSavedId] = useState<string | null>(existingDeliverableId);
  const [error, setError] = useState<string | null>(initialRun.error_message || null);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef<AbortController | null>(null);

  async function approve() {
    setRunning(true);
    setError(null);
    setPhase('starting');
    cancelRef.current = new AbortController();

    try {
      const res = await fetch(`/api/workflow-runs/${run.id}/execute`, {
        method: 'POST',
        signal: cancelRef.current.signal,
      });
      if (!res.ok || !res.body) throw new Error('Failed to start execution');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const block of events) {
          if (!block.trim()) continue;
          const lines = block.split('\n');
          const eventLine = lines.find(l => l.startsWith('event: '));
          const dataLine = lines.find(l => l.startsWith('data: '));
          if (!eventLine || !dataLine) continue;
          const event = eventLine.slice(7).trim();
          const data = JSON.parse(dataLine.slice(6));

          if (event === 'status') setPhase(data.phase + (data.downgraded ? ` (${data.downgraded} citations downgraded)` : ''));
          else if (event === 'deliverable') setDeliverable(data);
          else if (event === 'done') {
            setSavedId(data.deliverable_id);
            setRun(r => ({ ...r, status: 'complete' }));
            setPhase('complete');
          }
          else if (event === 'error') {
            setError(data.message);
            setRun(r => ({ ...r, status: 'failed' }));
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  // If already complete, fetch the deliverable
  useEffect(() => {
    if (existingDeliverableId && !deliverable) {
      fetch(`/api/deliverables/${existingDeliverableId}`).then(r => r.json()).then(d => {
        if (d?.structured_content) setDeliverable(d.structured_content);
      }).catch(() => {});
    }
  }, [existingDeliverableId, deliverable]);

  const topic = run.intake_inputs?.topic || '';

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">{workflowName}</div>
        <h1 className="font-display text-3xl leading-tight">{topic}</h1>
      </header>

      {/* Intake summary */}
      <details className="text-sm">
        <summary className="cursor-pointer text-[11px] font-mono uppercase tracking-widest text-muted hover:text-ink select-none">
          Intake inputs
        </summary>
        <dl className="mt-2 space-y-1 pl-4 text-muted">
          {Object.entries(run.intake_inputs).map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="font-mono uppercase text-[10px] tracking-widest pt-0.5 w-32 shrink-0">{k}</dt>
              <dd className="flex-1">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </details>

      {/* Plan review */}
      {run.plan && (
        <section className="card p-6 space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-1">Proposed plan</div>
              <h2 className="font-display text-2xl">{run.plan.summary}</h2>
            </div>
            {run.status === 'complete' && (
              <span className="pill pill-verified">Complete</span>
            )}
          </div>

          {run.plan.clarifying_question && (
            <div className="border-l-4 border-l-accent pl-4 py-2 bg-accent/5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-accent mb-1">Clarifying question</div>
              <div>{run.plan.clarifying_question}</div>
              <div className="text-sm text-muted mt-2 italic">Approve anyway and the agent will proceed with reasonable assumptions, or go back and refine the intake.</div>
            </div>
          )}

          <ol className="space-y-2">
            {run.plan.steps.map(step => (
              <li key={step.number} className="flex gap-3 py-2 border-b border-rule last:border-0">
                <div className="font-mono text-sm text-muted shrink-0 w-6">{step.number.toString().padStart(2, '0')}</div>
                <div className="flex-1">
                  <div className="font-medium">{step.description}</div>
                  <div className="text-sm text-muted mt-0.5">→ {step.expected_output}</div>
                </div>
              </li>
            ))}
          </ol>

          {run.status !== 'complete' && (
            <div className="flex gap-3 pt-2">
              <button className="btn" onClick={approve} disabled={running}>
                {running ? 'Running…' : 'Approve & run'}
              </button>
              <button className="btn-ghost" onClick={() => router.back()} disabled={running}>
                Change inputs
              </button>
              {running && phase && (
                <span className="text-sm text-muted self-center font-mono uppercase tracking-widest">
                  {phase}…
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {error && (
        <div className="card p-4 border-l-4 border-l-expert text-sm">
          <div className="font-medium text-expert">Run failed</div>
          <div className="text-muted mt-1">{error}</div>
        </div>
      )}

      {/* Deliverable */}
      {deliverable && (
        <div className="space-y-4 pt-4 border-t border-rule">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl">Deliverable</h2>
            {savedId && (
              <a href={`/api/exports/${savedId}?fmt=md`} className="btn-ghost text-sm">
                Export markdown
              </a>
            )}
          </div>
          <DeliverableView deliverable={deliverable} />
        </div>
      )}
    </div>
  );
}
