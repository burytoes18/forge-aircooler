'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

type Brief = {
  id: string;
  product_context: string;
  unknowns: string;
  domain_areas: string;
  anti_patterns: string;
  updated_at: string;
};

const SECTIONS = [
  {
    key: 'product_context' as const,
    label: 'Product Context',
    description: 'What are you building, how it works, who it's for. The agent reads this to stay on-topic.',
  },
  {
    key: 'unknowns' as const,
    label: 'Known Unknowns',
    description: 'Open questions you still need to answer. The agent treats these as priority research areas.',
  },
  {
    key: 'domain_areas' as const,
    label: 'Domain Areas & Owner Profile',
    description: 'Which domains are in scope, and your technical background. Sets the agent\'s tone and depth.',
  },
  {
    key: 'anti_patterns' as const,
    label: 'Anti-Patterns',
    description: 'Things the agent must never do. Informs every single response.',
  },
] as const;

export function BriefEditor({ brief }: { brief: Brief }) {
  const [values, setValues] = useState({
    product_context: brief.product_context,
    unknowns: brief.unknowns,
    domain_areas: brief.domain_areas,
    anti_patterns: brief.anti_patterns,
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(key: keyof typeof values) {
    setSaving(key);
    setError(null);
    setSaved(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('project_brief')
        .update({ [key]: values[key], updated_at: new Date().toISOString() })
        .eq('id', brief.id);
      if (error) throw error;
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="text-sm text-expert border-l-2 border-expert pl-3 py-1">{error}</div>
      )}

      <p className="text-xs font-mono uppercase tracking-widest text-muted">
        Last updated: {new Date(brief.updated_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })}
      </p>

      {SECTIONS.map(section => (
        <div key={section.key} className="card p-6 space-y-3">
          <div>
            <h2 className="font-display text-xl">{section.label}</h2>
            <p className="text-sm text-muted mt-1">{section.description}</p>
          </div>
          <textarea
            className="textarea min-h-36 font-mono text-sm leading-relaxed"
            value={values[section.key]}
            onChange={e => setValues(v => ({ ...v, [section.key]: e.target.value }))}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => save(section.key)}
              disabled={saving === section.key}
              className="btn text-sm"
            >
              {saving === section.key ? 'Saving…' : 'Save'}
            </button>
            {saved === section.key && (
              <span className="text-sm text-verified font-mono">Saved ✓</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
