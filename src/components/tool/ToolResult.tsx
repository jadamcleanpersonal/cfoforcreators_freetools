import { cn } from "@/lib/utils";
import type { ResultDisplay, ToolDefinition } from "@/tools/_types";
import type { z } from "zod";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool: ToolDefinition<z.ZodTypeAny, any>;
  result: {
    id: string;
    inputs: unknown;
    outputs: unknown;
  };
}

const VERDICT_STYLES = {
  yes: {
    wrapper: "border-brand/40 bg-brand/5",
    badge: "bg-brand text-white",
    icon: "✓",
  },
  no: {
    wrapper: "border-danger/40 bg-danger/5",
    badge: "bg-danger text-white",
    icon: "✗",
  },
  wait: {
    wrapper: "border-warn/40 bg-warn/5",
    badge: "bg-warn text-ink",
    icon: "→",
  },
} as const;

export default function ToolResult({ tool, result }: Props) {
  if (!tool.renderResult) {
    return null; // AI-driven tools (isAiDriven: true) render via StreamingResult, not ToolResult
  }
  const display: ResultDisplay = tool.renderResult(result.outputs, result.inputs);
  const styles = VERDICT_STYLES[display.verdict];

  return (
    <section className={cn("rounded-2xl border p-6 space-y-6", styles.wrapper)}>
      {/* Verdict — above everything else, per the contract */}
      <div className="space-y-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
            styles.badge,
          )}
        >
          <span aria-hidden="true">{styles.icon}</span>
          {display.verdict.toUpperCase()}
        </span>
        <h2 className="text-xl font-bold text-ink leading-snug">{display.verdictHeadline}</h2>
        <p className="text-base text-ink-muted">{display.verdictReason}</p>
      </div>

      {/* Divider */}
      <hr className="border-border" />

      {/* Headline number */}
      <div className="space-y-1">
        <p className="text-result font-bold text-ink leading-none tracking-tight">
          {display.headlineNumber ?? display.headline}
        </p>
        {display.headlineNumber && <p className="text-base text-ink-muted">{display.headline}</p>}
        {display.subline && <p className="text-sm text-ink-muted">{display.subline}</p>}
      </div>

      {/* Breakdown */}
      {display.breakdown && display.breakdown.length > 0 && (
        <dl className="space-y-2">
          {display.breakdown.map((item) => (
            <div key={item.label} className="flex justify-between items-baseline gap-4">
              <dt className="text-sm text-ink-muted flex-1">{item.label}</dt>
              <dd className="text-sm font-semibold text-ink tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Recommendation */}
      {display.recommendation && (
        <div className="rounded-xl bg-paper-soft border border-border px-4 py-3">
          <p className="text-sm text-ink">{display.recommendation}</p>
        </div>
      )}

      {/* Caveat */}
      {display.caveat && (
        <p className="text-xs text-ink-muted italic border-t border-border pt-3">
          {display.caveat}
        </p>
      )}
    </section>
  );
}
