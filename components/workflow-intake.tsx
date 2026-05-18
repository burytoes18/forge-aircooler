'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Field = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  default?: string;
  required?: boolean;
};

export function WorkflowIntake({
  workflowId,
  intakeSchema,
  requiredSections,
}: {
  workflowId: string;
  intakeSchema: { fields: Field[] };
  requiredSections: string[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of intakeSchema.fields) if (f.default) init[f.name] = f.default;
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(name: string, value: string) {
    setValues(v => ({ ...v, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      // Validate required fields
      for (const f of intakeSchema.fields) {
        if (f.required && !values[f.name]?.trim()) {
          throw new Error(`${f.label} is required`);
        }
      }
      const res = await fetch('/api/workflow-runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflowId, intake_inputs: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create plan');
      // Hand off to the run page
      router.push(`/workflows/${data.workflow.slug}/run/${data.run.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {intakeSchema.fields.map(f => (
        <div key={f.name} className="space-y-1.5">
          <label className="block text-sm font-medium">
            {f.label}
            {f.required && <span className="text-accent ml-1">*</span>}
          </label>
          {f.type === 'textarea' ? (
            <textarea
              className="textarea min-h-20"
              placeholder={f.placeholder}
              value={values[f.name] || ''}
              onChange={e => update(f.name, e.target.value)}
              required={f.required}
            />
          ) : f.type === 'select' ? (
            <select
              className="select"
              value={values[f.name] || f.default || ''}
              onChange={e => update(f.name, e.target.value)}
            >
              {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type="text"
              className="input"
              placeholder={f.placeholder}
              value={values[f.name] || ''}
              onChange={e => update(f.name, e.target.value)}
              required={f.required}
            />
          )}
        </div>
      ))}

      <details className="text-sm">
        <summary className="cursor-pointer text-[11px] font-mono uppercase tracking-widest text-muted hover:text-ink select-none">
          What you'll get — {requiredSections.length} sections
        </summary>
        <ul className="mt-2 space-y-1 text-muted pl-4 list-disc">
          {requiredSections.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </details>

      {error && (
        <div className="text-sm text-expert border-l-2 border-expert pl-3">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Drafting plan…' : 'Draft a plan →'}
        </button>
        <span className="text-sm text-muted self-center">
          The agent will propose a numbered plan first. You approve before it runs.
        </span>
      </div>
    </form>
  );
}
