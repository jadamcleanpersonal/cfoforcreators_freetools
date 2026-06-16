// Dynamic OG image for shared tax estimator results.
// Rendered at /tax-estimator/result/[id]/opengraph-image

import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TaxEstimatorOutput } from "@/lib/tax";

export const runtime = "edge";
export const alt = "quarterly tax estimate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OGImage({ params }: Props) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("tool_results")
    .select("outputs, inputs")
    .eq("id", id)
    .eq("tool_slug", "tax-estimator")
    .single();

  const outputs = (data?.outputs ?? {}) as Partial<TaxEstimatorOutput>;
  const amount = outputs.amountThisQuarter ?? 0;
  const deadline = outputs.deadline ?? "";
  const verdict = outputs.verdict ?? "yes";

  const fmtAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

  const verdictColor =
    verdict === "yes" ? "#16a34a" : verdict === "no" ? "#dc2626" : "#d97706";

  const headline =
    verdict === "no"
      ? "no quarterly payment needed"
      : `${fmtAmount} due by ${deadline}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#fafaf9",
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              backgroundColor: verdictColor,
              color: "white",
              borderRadius: "9999px",
              padding: "6px 16px",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            {verdict.toUpperCase()}
          </div>
          <span style={{ fontSize: "18px", color: "#78716c" }}>quarterly tax estimate</span>
        </div>

        <div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#1c1917",
              lineHeight: 1.1,
              marginBottom: "16px",
            }}
          >
            {headline}
          </div>
          {outputs.stateName && (
            <div style={{ fontSize: "24px", color: "#78716c" }}>
              {outputs.stateName} · {outputs.effectiveRate !== undefined
                ? `${(outputs.effectiveRate * 100).toFixed(1)}% effective rate`
                : ""}
            </div>
          )}
        </div>

        <div style={{ fontSize: "20px", color: "#78716c" }}>
          thecfoforcreators.com — free tools for content creators
        </div>
      </div>
    ),
    { ...size },
  );
}
