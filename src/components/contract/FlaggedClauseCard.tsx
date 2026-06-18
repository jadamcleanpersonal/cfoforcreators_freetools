// FlaggedClauseCard — renders a single flagged clause from the contract scan.
// Color-coded by category: risky (red), unusual (yellow), fine (green).

import type { FlaggedClause } from "@/lib/contract/types";

interface Props {
  clause: FlaggedClause;
  index: number;
}

const CATEGORY_STYLES = {
  risky: {
    wrapper: "border-danger/40 bg-danger/5",
    badge: "bg-danger text-white",
    label: "risky",
    icon: "⚠",
  },
  unusual: {
    wrapper: "border-warn/40 bg-warn/5",
    badge: "bg-warn text-ink",
    label: "unusual",
    icon: "→",
  },
  fine: {
    wrapper: "border-brand/20 bg-brand/5",
    badge: "bg-brand/20 text-brand",
    label: "fine",
    icon: "✓",
  },
} as const;

export default function FlaggedClauseCard({ clause, index }: Props) {
  const styles = CATEGORY_STYLES[clause.category];

  return (
    <article
      className={`rounded-xl border p-4 space-y-3 ${styles.wrapper}`}
      aria-label={`Flagged clause ${index + 1}: ${clause.category}`}
    >
      {/* Category badge */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}
        >
          <span aria-hidden="true">{styles.icon}</span>
          {styles.label}
        </span>
      </div>

      {/* Quoted clause */}
      <blockquote className="text-sm text-ink-muted italic border-l-2 border-current pl-3 leading-relaxed">
        &ldquo;{clause.quote}&rdquo;
      </blockquote>

      {/* Explanation */}
      <p className="text-sm text-ink leading-relaxed">{clause.explanation}</p>

      {/* Suggested negotiation move */}
      {clause.suggestedAction && (
        <div className="rounded-lg bg-paper-soft border border-border px-3 py-2.5">
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
            negotiation move
          </p>
          <p className="text-sm text-ink">{clause.suggestedAction}</p>
        </div>
      )}
    </article>
  );
}
