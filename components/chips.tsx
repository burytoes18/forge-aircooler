import { cn } from '@/lib/utils';
import type { DomainTag, ConfidenceTag } from '@/lib/schemas';

export function DomainChip({ tag }: { tag: DomainTag }) {
  return <span className={cn('chip', `chip-domain-${tag}`)}>{tag}</span>;
}

const CONFIDENCE_LABEL: Record<ConfidenceTag, string> = {
  verified: 'Verified',
  unverified: 'Unverified',
  estimate: 'Estimate',
  assumption: 'Assumption',
  needs_expert: 'Needs expert',
};

export function ConfidencePill({
  tag,
  citationUrl,
  citationTitle,
  rationale,
}: {
  tag: ConfidenceTag;
  citationUrl?: string | null;
  citationTitle?: string | null;
  rationale?: string | null;
}) {
  const cls = `pill pill-${tag.replace('_', '-')}`;
  const label = CONFIDENCE_LABEL[tag];

  if (tag === 'verified' && citationUrl) {
    return (
      <a
        href={citationUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cls + ' hover:opacity-80'}
        title={citationTitle || citationUrl}
      >
        ✓ {citationTitle ? citationTitle.slice(0, 40) : 'source'}
      </a>
    );
  }
  return (
    <span className={cls} title={rationale || undefined}>
      {label}
    </span>
  );
}
