// Dynamic OG image for shared contract scan results.
// Headline template: verdict badge + headline + flag count summary.
// Rendered at /contract-scanner/result/[id]/opengraph-image

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ScanResult } from "@/lib/contract/types";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Brand contract scan result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OGImage({ params }: Props) {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("tool_results")
    .select("outputs")
    .eq("id", id)
    .eq("tool_slug", "contract-scanner")
    .single();

  const row = data as { outputs?: unknown } | null;
  const outputs = (row?.outputs ?? {}) as Partial<ScanResult>;
  const verdict = outputs.verdict ?? "wait";
  const verdictHeadline = outputs.verdictHeadline ?? "contract scan result";
  const flaggedClauses = outputs.flaggedClauses ?? [];
  const riskyCount = flaggedClauses.filter((c) => c.category === "risky").length;
  const unusualCount = flaggedClauses.filter((c) => c.category === "unusual").length;
  const fineCount = flaggedClauses.filter((c) => c.category === "fine").length;

  const verdictColor = verdict === "yes" ? "#16a34a" : verdict === "no" ? "#dc2626" : "#d97706";

  const verdictLabel =
    verdict === "yes" ? "LOOKS FINE" : verdict === "no" ? "DON'T SIGN YET" : "NEGOTIATE FIRST";

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
      {/* Header: verdict badge + tool name */}
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
          brand contract scanner · cfo for creators
        </span>
      </div>

      {/* Verdict headline */}
      <div
        style={{
          fontSize: "44px",
          fontWeight: 800,
          color: "#1c1917",
          lineHeight: 1.2,
          maxWidth: "900px",
        }}
      >
        {verdictHeadline}
      </div>

      {/* Flag count row */}
      {flaggedClauses.length > 0 && (
        <div style={{ display: "flex", gap: "16px" }}>
          {riskyCount > 0 && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "2px solid #fca5a5",
                borderRadius: "12px",
                padding: "16px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#dc2626" }}>
                {riskyCount}
              </div>
              <div style={{ fontSize: "14px", color: "#78716c" }}>risky clause{riskyCount !== 1 ? "s" : ""}</div>
            </div>
          )}
          {unusualCount > 0 && (
            <div
              style={{
                backgroundColor: "#fffbeb",
                border: "2px solid #fcd34d",
                borderRadius: "12px",
                padding: "16px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#d97706" }}>
                {unusualCount}
              </div>
              <div style={{ fontSize: "14px", color: "#78716c" }}>unusual</div>
            </div>
          )}
          {fineCount > 0 && (
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "2px solid #86efac",
                borderRadius: "12px",
                padding: "16px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#16a34a" }}>
                {fineCount}
              </div>
              <div style={{ fontSize: "14px", color: "#78716c" }}>fine</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: "18px", color: "#78716c" }}>
        thecfoforcreators.com — free tools for content creators
      </div>
    </div>,
    { ...size },
  );
}
