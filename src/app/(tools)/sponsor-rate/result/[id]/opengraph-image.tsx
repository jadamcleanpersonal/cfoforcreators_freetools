// Dynamic OG image for shared sponsor rate calculator results.
// Headline layout: verdict badge + asking rate + market range comparison.
// Rendered at /sponsor-rate/result/[id]/opengraph-image

import type { SponsorRateResult } from "@/lib/sponsor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sponsor rate calculator result";
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
    .eq("tool_slug", "sponsor-rate")
    .single();

  const outputs = (data?.outputs ?? {}) as Partial<SponsorRateResult>;
  const verdict = outputs.verdict ?? "wait";
  const askingRate = outputs.your_asking_rate ?? 0;
  const marketLow = outputs.marketLow ?? 0;
  const marketMid = outputs.marketMid ?? 0;
  const marketHigh = outputs.marketHigh ?? 0;
  const deltaDirection = outputs.deltaDirection ?? "in_range";

  const verdictColor = verdict === "yes" ? "#16a34a" : verdict === "no" ? "#dc2626" : "#d97706";

  const verdictLabel =
    verdict === "yes"
      ? "IN RANGE"
      : verdict === "no" && deltaDirection === "too_low"
        ? "UNDERCHARGING"
        : verdict === "no"
          ? "OVERCHARGING"
          : "THIN DATA";

  const verdictHeadline =
    verdict === "yes"
      ? `${fmt(askingRate)} is in market range.`
      : verdict === "no" && deltaDirection === "too_low"
        ? `${fmt(askingRate)} is under market — median is ${fmt(marketMid)}.`
        : verdict === "no"
          ? `${fmt(askingRate)} is above market — ceiling is ${fmt(marketHigh)}.`
          : "Not enough data to validate this rate.";

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
          {verdictLabel}
        </div>
        <span style={{ fontSize: "18px", color: "#78716c" }}>
          sponsor rate calculator · cfo for creators
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

      {/* Three-column market range */}
      <div style={{ display: "flex", gap: "24px" }}>
        {/* Market low */}
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
            style={{
              fontSize: "14px",
              color: "#78716c",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            MARKET FLOOR
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#16a34a" }}>
            {fmt(marketLow)}
          </div>
          <div style={{ fontSize: "13px", color: "#78716c" }}>walk-away floor</div>
        </div>

        {/* Market mid */}
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
            style={{
              fontSize: "14px",
              color: "#78716c",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            MARKET MEDIAN
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: verdictColor }}>
            {fmt(marketMid)}
          </div>
          <div style={{ fontSize: "13px", color: "#78716c" }}>typical ask</div>
        </div>

        {/* Market high */}
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
            style={{
              fontSize: "14px",
              color: "#78716c",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            MARKET CEILING
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#dc2626" }}>
            {fmt(marketHigh)}
          </div>
          <div style={{ fontSize: "13px", color: "#78716c" }}>max defensible rate</div>
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
