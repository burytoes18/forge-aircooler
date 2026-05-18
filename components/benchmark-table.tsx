'use client';

import { useState } from 'react';
import { ConfidencePill } from './chips';
import type { ConfidenceTag } from '@/lib/schemas';

type Benchmark = {
  id: string;
  metric: string;
  value: string;
  unit: string;
  source_url: string | null;
  source_title: string | null;
  confidence_tag: ConfidenceTag;
  notes: string | null;
  last_verified_at: string;
};

type Proposal = {
  proposed_value: string;
  unit: string;
  confidence_tag: ConfidenceTag;
  source_url: string | null;
  source_title: string | null;
  rationale: string;
};

export function BenchmarkTable({ initialBenchmarks }: { initialBenchmarks: Benchmark[] }) {
  const [rows, setRows] = useState<Benchmark[]>(initialBenchmarks);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Record<string, Proposal>>({});
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reverify(id: string) {
    setVerifying(id);
    setError(null);
    try {
      const res = await fetch(`/api/benchmarks/${id}/reverify`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reverify failed');
      setProposals(p => ({ ...p, [id]: data.proposal }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setVerifying(null);
    }
  }

  async function applyProposal(id: string) {
    const proposal = proposals[id];
    if (!proposal) return;
    setApplying(id);
    setError(null);
    try {
      const res = await fetch(`/api/benchmarks/${id}/reverify`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(proposal),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Apply failed');
      setRows(r => r.map(row => row.id === id ? data.benchmark : row));
      setProposals(p => { const n = { ...p }; delete n[id]; return n; });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApplying(null);
    }
  }

  function dismissProposal(id: string) {
    setProposals(p => { const n = { ...p }; delete n[id]; return n; });
  }

  const staleDays = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    return Math.floor(ms / 86400000);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-expert border-l-2 border-expert pl-3 py-1">{error}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="text-left py-3 pr-4 font-medium text-[11px] font-mono uppercase tracking-widest">Metric</th>
              <th className="text-left py-3 pr-4 font-medium text-[11px] font-mono uppercase tracking-widest">Value</th>
              <th className="text-left py-3 pr-4 font-medium text-[11px] font-mono uppercase tracking-widest">Confidence</th>
              <th className="text-left py-3 pr-4 font-medium text-[11px] font-mono uppercase tracking-widest">Last verified</th>
              <th className="text-left py-3 font-medium text-[11px] font-mono uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(b => {
              const days = staleDays(b.last_verified_at);
              const isStale = days > 30;
              const proposal = proposals[b.id];

              return (
                <>
                  <tr key={b.id} className="border-b border-rule hover:bg-ink/3 transition-colors">
                    <td className="py-3 pr-4 align-top">
                      <div className="font-medium">{b.metric}</div>
                      {b.notes && (
                        <div className="text-muted text-xs mt-0.5">{b.notes}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <div className="font-mono">
                        {b.source_url ? (
                          <a
                            href={b.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-rule underline-offset-2 hover:text-accent"
                          >
                            {b.value}
                          </a>
                        ) : b.value}
                      </div>
                      <div className="text-muted text-xs mt-0.5">{b.unit}</div>
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <ConfidencePill
                        tag={b.confidence_tag}
                        citationUrl={b.source_url}
                        citationTitle={b.source_title}
                      />
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <div className={`font-mono text-xs ${isStale ? 'text-expert font-semibold' : 'text-muted'}`}>
                        {days === 0 ? 'today' : `${days}d ago`}
                        {isStale && ' ⚠'}
                      </div>
                    </td>
                    <td className="py-3 align-top">
                      <button
                        onClick={() => reverify(b.id)}
                        disabled={verifying === b.id || applying === b.id}
                        className="btn-ghost text-xs px-3 py-1"
                      >
                        {verifying === b.id ? 'Searching…' : 'Re-verify'}
                      </button>
                    </td>
                  </tr>

                  {/* Proposal row — appears inline below the benchmark */}
                  {proposal && (
                    <tr key={`${b.id}-proposal`} className="border-b border-rule bg-verified/5">
                      <td colSpan={5} className="py-3 px-4">
                        <div className="flex flex-wrap items-start gap-4">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="text-[11px] font-mono uppercase tracking-widest text-verified mb-1">
                              Proposed update
                            </div>
                            <div className="font-mono font-medium">
                              {proposal.proposed_value} {proposal.unit}
                            </div>
                            <div className="text-sm text-muted">{proposal.rationale}</div>
                            {proposal.source_url && (
                              <a
                                href={proposal.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline decoration-rule underline-offset-2 hover:text-accent"
                              >
                                {proposal.source_title || proposal.source_url}
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0 mt-1">
                            <button
                              onClick={() => applyProposal(b.id)}
                              disabled={applying === b.id}
                              className="btn text-xs px-3 py-1"
                            >
                              {applying === b.id ? 'Saving…' : 'Accept'}
                            </button>
                            <button
                              onClick={() => dismissProposal(b.id)}
                              disabled={applying === b.id}
                              className="btn-ghost text-xs px-3 py-1"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted font-mono">
        {rows.length} benchmarks · Re-verify searches the web and proposes an update — you confirm before it saves.
      </p>
    </div>
  );
}
