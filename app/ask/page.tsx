'use client';

import { useEffect, useState } from 'react';
import { DomainChip, ConfidencePill } from '@/components/chips';
import type { AskAnswer } from '@/lib/schemas';

export default function AskPage() {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pick up a question handed off from the home page
  useEffect(() => {
    const pending = sessionStorage.getItem('forge_pending_ask');
    if (pending) {
      sessionStorage.removeItem('forge_pending_ask');
      setQ(pending);
      submitWithText(pending);
    }
  }, []);

  async function submitWithText(text: string) {
    setBusy(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setAnswer(data.answer);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">Surface</div>
        <h1 className="font-display text-4xl">Ask</h1>
        <p className="text-muted mt-2">Quick questions across any domain. Citation-disciplined.</p>
      </header>

      <form onSubmit={e => { e.preventDefault(); if (q.trim()) submitWithText(q.trim()); }} className="space-y-3">
        <textarea
          className="textarea min-h-24"
          placeholder="What do you want to know?"
          value={q}
          onChange={e => setQ(e.target.value)}
          disabled={busy}
        />
        <div className="flex gap-3">
          <button className="btn" type="submit" disabled={busy || !q.trim()}>
            {busy ? 'Thinking…' : 'Ask'}
          </button>
          {busy && <span className="text-sm text-muted self-center">Searching the web and reasoning — can take 30–90s.</span>}
        </div>
      </form>

      {error && (
        <div className="card p-4 border-l-4 border-l-expert text-sm">
          <div className="font-medium text-expert">Error</div>
          <div className="text-muted mt-1">{error}</div>
        </div>
      )}

      {answer && (
        <div className="card p-6 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {answer.domain_tags.map(t => <DomainChip key={t} tag={t} />)}
          </div>
          <ul className="space-y-4">
            {answer.bullets.map((b, i) => (
              <li key={i} className="border-l-2 border-rule pl-4">
                <div className="leading-relaxed">{b.text}</div>
                {b.claims.length > 0 && (
                  <ul className="mt-2 space-y-1.5 text-sm text-muted">
                    {b.claims.map((c, j) => (
                      <li key={j} className="flex flex-wrap items-start gap-2">
                        <ConfidencePill tag={c.confidence} citationUrl={c.citation_url} citationTitle={c.citation_title} rationale={c.rationale} />
                        <span className="flex-1 min-w-0">{c.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
