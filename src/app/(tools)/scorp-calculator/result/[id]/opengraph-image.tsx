// Dynamic OG image for shared S-corp calculator results.
// Three-column comparison layout:
//   Left:   Without S-corp (SE tax as sole prop)
//   Middle: With S-corp (SE tax on salary + running costs)
//   Right:  Net savings (the delta)
// Rendered at /scorp-calculator/result/[id]/opengraph-image

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ScorpResult } from "@/lib/tax/scorp";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "S-corp calculator result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export default async function OGImage({ params }: Props) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("tool_results")
    .select("outputs")
    .eq("id", id)
    .eq("tool_slug", "scorp-calculator")
    .single();

  const outputs = (data?.outputs ?? {}) as Partial<ScorpResult>;
  const verdict = outputs.verdict ?? "wait";
  const withoutScorp = outputs.withoutScorpAnnualTax ?? 0;
  const withScorp = outputs.withScorpAnnualTax ?? 0;
  const netSavings = outputs.netSavings ?? 0;

  const verdictColor = verdict === "yes" ? "#16a34a" : verdict === "no" ? "#dc2626" : "#d97706";

  const verdictHeadline =
    verdict === "yes"
      ? `Yes, switch. Save ~${fmt(netSavings)}/year.`
      : verdict === "no"
        ? "Don't switch to an S-corp yet."
        : "Wait one more quarter.";

  const netSavingsLabel =
    verdict === "yes"
      ? `save ${fmt(netSavings)}/yr`
      : verdict === "no"
        ? "don't switch"
        : `~${fmt(Math.abs(netSavings))} borderline`;

  const netSavingsColor = netSavings > 0 ? "#16a34a" : "#dc2626";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#fafaf9",
        padding: "56px 64px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header: verdict badge + label */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            backgroundColor: verdictColor,
            color: "white",
            borderRadius: "9999px",
            padding: "6px 18px",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          {verdict.toUpperCase()}
        </div>
        <span style={{ fontSize: "18px", color: "#78716c" }}>
          S-corp calculator · cfo for creators
        </span>
      </div>

      {/* Verdict headline */}
      <div
        style={{
          fontSize: "48px",
          fontWeight: 800,
          color: "#1c1917",
          lineHeight: 1.15,
        }}
      >
        {verdictHeadline}
      </div>

      {/* Three-column comparison */}
      <div
        style={{
          display: "flex",
          gap: "24px",
        }}
      >
        {/* Without S-corp */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#fef2f2",
            border: "2px solid #fca5a5",
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{ fontSize: "14px", color: "#78716c", fontWeight: 600, letterSpacing: "0.05em" }}
          >
            WITHOUT S-CORP
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#dc2626" }}>
            {fmt(withoutScorp)}
          </div>
          <div style={{ fontSize: "13px", color: "#78716c" }}>SE tax / year</div>
        </div>

        {/* With S-corp */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#f0fdf4",
            border: "2px solid #86efac",
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{ fontSize: "14px", color: "#78716c", fontWeight: 600, letterSpacing: "0.05em" }}
          >
            WITH S-CORP
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#16a34a" }}>
            {fmt(withScorp)}
          </div>
          <div style={{ fontSize: "13px", color: "#78716c" }}>SE tax + running costs</div>
        </div>

        {/* Net savings */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#fffbeb",
            border: `2px solid ${verdictColor}`,
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{ fontSize: "14px", color: "#78716c", fontWeight: 600, letterSpacing: "0.05em" }}
          >
            NET SAVINGS
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: netSavingsColor,
            }}
          >
            {netSavingsLabel}
          </div>
          <div style={{ fontSize: "13px", color: "#78716c" }}>after running costs</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ fontSize: "18px", color: "#78716c" }}>
        thecfoforcreators.com — free tools for content creators
      </div>
    </div>,
    { ...size },
  );
}
