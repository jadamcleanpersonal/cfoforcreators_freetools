"use client";

// StreamingResult — progressively renders contract scan results as events arrive.
// Also used (in static mode) on the saved result page.

import type { FlaggedClause, ScanResult } from "@/lib/contract/types";
import FlaggedClauseCard from "./FlaggedClauseCard";

interface VerdictState {
  verdict: ScanResult["verdict"];
  verdictHeadline: string;
  verdictReason: string;
}

interface Props {
  // Progressive mode (streaming): individual state pieces
  verdictState?: VerdictState;
  flaggedClauses?: FlaggedClause[];
  summary?: string;
  isStreaming?: boolean;

  // Static mode (saved result page): full ScanResult
  result?: ScanResult;
}

const VERDICT_STYLES = {
  yes: {
    wrapper: "border-brand/40 bg-brand/5",
    badge: "bg-brand text-white",
    icon: "✓",
    label: "LOOKS FINE",
  },
  no: {
    wrapper: "border-danger/40 bg-danger/5",
    badge: "bg-danger text-white",
    icon: "✗",
    label: "DON'T SIGN YET",
  },
  wait: {
    wrapper: "border-warn/40 bg-warn/5",
    badge: "bg-warn text-ink",
    icon: "→",
    label: "NEGOTIATE FIRST",
  },
} as const;

export default function StreamingResult({
  verdictState,
  flaggedClauses = [],
  summary,
  isStreaming,
  result,
}: Props) {
  // Resolve from either streaming state or static result
  const verdict = result?.verdict ?? verdictState?.verdict;
  const verdictHeadline = result?.verdictHeadline ?? verdictState?.verdictHeadline;
  const verdictReason = result?.verdictReason ?? verdictState?.verdictReason;
  const clauses = result?.flaggedClauses ?? flaggedClauses;
  const summaryText = result?.summary ?? summary;

  if (!verdict) {
    // Scan in progress but verdict not yet received
    return (
      <div className="space-y-4 animate-pulse" aria-live="polite" aria-label="Scanning contract">
        <div className="h-6 bg-paper-soft rounded w-1/3" />
        <div className="h-4 bg-paper-soft rounded w-2/3" />
        <div className="h-4 bg-paper-soft rounded w-1/2" />
      </div>
    );
  }

  const styles = VERDICT_STYLES[verdict];
  const riskyCount = clauses.filter((c) => c.category === "risky").length;
  const unusualCount = clauses.filter((c) => c.category === "unusual").length;
  const fineCount = clauses.filter((c) => c.category === "fine").length;

  return (
    <div className="space-y-8" aria-live="polite">
      {/* Verdict block */}
      <section className={`rounded-2xl border p-6 space-y-4 ${styles.wrapper}`}>
        <div className="space-y-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${styles.badge}`}
          >
            <span aria-hidden="true">{styles.icon}</span>
            {styles.label}
          </span>
          <h2 className="text-xl font-bold text-ink leading-snug">{verdictHeadline}</h2>
          <p className="text-base text-ink-muted">{verdictReason}</p>
        </div>

        {/* Clause count summary */}
        {clauses.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {riskyCount > 0 && (
              <span className="text-xs rounded-full bg-danger/10 text-danger px-2.5 py-1 font-medium">
                {riskyCount} risky
              </span>
            )}
            {unusualCount > 0 && (
              <span className="text-xs rounded-full bg-warn/10 text-warn px-2.5 py-1 font-medium">
                {unusualCount} unusual
              </span>
            )}
            {fineCount > 0 && (
              <span className="text-xs rounded-full bg-brand/10 text-brand px-2.5 py-1 font-medium">
                {fineCount} fine
              </span>
            )}
          </div>
        )}
      </section>

      {/* Flagged clauses */}
      {clauses.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-base font-semibold text-ink">Flagged clauses</h3>
          <div className="space-y-3">
            {clauses.map((clause, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: order matters here
              <FlaggedClauseCard key={i} clause={clause} index={i} />
            ))}
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="inline-block w-2 h-2 rounded-full bg-brand animate-pulse" />
              scanning for more clauses...
            </div>
          )}
        </section>
      )}

      {/* Summary */}
      {summaryText && (
        <section className="rounded-xl border border-border bg-paper-soft px-5 py-4 space-y-1">
          <h3 className="text-sm font-semibold text-ink">Overall assessment</h3>
          <p className="text-sm text-ink-muted leading-relaxed">{summaryText}</p>
        </section>
      )}
    </div>
  );
}
