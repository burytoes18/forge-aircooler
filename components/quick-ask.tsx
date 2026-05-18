'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function QuickAsk() {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    sessionStorage.setItem('forge_pending_ask', q.trim());
    router.push('/ask');
  }

  return (
    <form onSubmit={submit} className="flex gap-3">
      <input
        type="text"
        className="input"
        placeholder="e.g. What's the typical COP range for chilled water cooling vs split AC?"
        value={q}
        onChange={e => setQ(e.target.value)}
        disabled={busy}
      />
      <button className="btn whitespace-nowrap" type="submit" disabled={busy || !q.trim()}>
        Ask →
      </button>
    </form>
  );
}
