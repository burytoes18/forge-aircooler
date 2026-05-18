'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DomainChip, ConfidencePill } from './chips';
import type { Deliverable } from '@/lib/schemas';

export function DeliverableView({ deliverable }: { deliverable: Deliverable }) {
  return (
    <div className="space-y-8">
      {/* Verdict callout */}
      <div className="card p-6 border-l-4 border-l-accent">
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">Verdict</div>
        <div className="font-display text-2xl leading-snug">{deliverable.verdict}</div>
      </div>

      {/* Sections */}
      {deliverable.sections.map((section, i) => (
        <section key={i} className="space-y-3">
          <header className="flex flex-wrap items-baseline gap-3 pb-2 border-b border-rule">
            <h2 className="font-display text-xl">{section.heading}</h2>
            <div className="flex gap-1.5">
              {section.domain_tags.map(t => <DomainChip key={t} tag={t} />)}
            </div>
          </header>
          <div className="prose-forge">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body}</ReactMarkdown>
          </div>
          {section.claims.length > 0 && (
            <details className="mt-3 group">
              <summary className="cursor-pointer text-[11px] font-mono uppercase tracking-widest text-muted hover:text-ink select-none">
                {section.claims.length} claim{section.claims.length === 1 ? '' : 's'} · sources
              </summary>
              <ul className="mt-3 space-y-2 text-sm">
                {section.claims.map((c, j) => (
                  <li key={j} className="flex flex-wrap items-start gap-2 pl-3 border-l border-rule">
                    <ConfidencePill
                      tag={c.confidence}
                      citationUrl={c.citation_url}
                      citationTitle={c.citation_title}
                      rationale={c.rationale}
                    />
                    <span className="flex-1 min-w-0">{c.text}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      ))}

      {/* Risks */}
      {deliverable.risks?.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl pb-2 border-b border-rule">Risks</h2>
          <ul className="space-y-1.5 list-disc list-inside marker:text-muted">
            {deliverable.risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </section>
      )}

      {/* Open questions */}
      {deliverable.open_questions?.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl pb-2 border-b border-rule">Open Questions</h2>
          <ul className="space-y-1.5 list-disc list-inside marker:text-muted">
            {deliverable.open_questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
