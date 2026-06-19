"use client";

// Full client component for the brand contract scanner.
// Handles the streaming API, progressive result reveal, and post-scan sections.
// Does NOT use ToolPage/ToolForm — the streaming UX requires a custom flow.

import ToolCrossPromo from "@/components/tool/ToolCrossPromo";
import ToolExplainer from "@/components/tool/ToolExplainer";
import ToolFollowupChat from "@/components/tool/ToolFollowupChat";
import ToolShareBlock from "@/components/tool/ToolShareBlock";
import type { FlaggedClause, ScanResult } from "@/lib/contract/types";
import type { ToolDefinition } from "@/tools/_types";
import contractScanner from "@/tools/contract-scanner";
import { useState } from "react";
import type { z } from "zod";
import ContractTextarea from "./ContractTextarea";
import StreamingResult from "./StreamingResult";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tool = contractScanner as unknown as ToolDefinition<z.ZodTypeAny, any>;

type ScanState =
  | { phase: "idle" }
  | { phase: "scanning" }
  | { phase: "done"; result: { id: string; inputs: unknown; outputs: ScanResult } }
  | { phase: "error"; message: string };

interface VerdictState {
  verdict: ScanResult["verdict"];
  verdictHeadline: string;
  verdictReason: string;
}

export default function ContractScannerClient() {
  const [scanState, setScanState] = useState<ScanState>({ phase: "idle" });

  // Streaming partial state
  const [verdictState, setVerdictState] = useState<VerdictState | null>(null);
  const [flaggedClauses, setFlaggedClauses] = useState<FlaggedClause[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  // Form state
  const [contractText, setContractText] = useState("");
  const [creatorContext, setCreatorContext] = useState("");
  const [niche, setNiche] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const isScanning = scanState.phase === "scanning";

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!contractText.trim() || contractText.length < 10) {
      setFormError("paste your contract text to scan it");
      return;
    }
    if (contractText.length > 50_000) {
      setFormError("contract text exceeds 50,000 characters. try pasting the key sections only");
      return;
    }

    setScanState({ phase: "scanning" });
    setVerdictState(null);
    setFlaggedClauses([]);
    setSummary(null);

    try {
      const res = await fetch("/api/tools/contract-scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_text: contractText,
          creator_context: creatorContext || undefined,
          niche: niche || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = (json as Record<string, string>).message ?? "something went wrong. try again";
        setScanState({ phase: "error", message: msg });
        return;
      }

      if (!res.body) {
        setScanState({ phase: "error", message: "no response from server" });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedVerdict: VerdictState | null = null;
      const accumulatedClauses: FlaggedClause[] = [];
      let accumulatedSummary = "";
      let resultId = "local";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const block of lines) {
          const dataLine = block.replace(/^data: /, "").trim();
          if (!dataLine) continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(dataLine);
          } catch {
            continue;
          }

          if (event.type === "verdict") {
            accumulatedVerdict = {
              verdict: event.verdict as ScanResult["verdict"],
              verdictHeadline: event.verdictHeadline as string,
              verdictReason: event.verdictReason as string,
            };
            setVerdictState(accumulatedVerdict);

            // Scroll to results
            setTimeout(() => {
              document
                .getElementById("scan-results")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
          } else if (event.type === "flag") {
            const clause: FlaggedClause = {
              category: event.category as FlaggedClause["category"],
              quote: event.quote as string,
              explanation: event.explanation as string,
              suggestedAction: event.suggestedAction as string | undefined,
            };
            accumulatedClauses.push(clause);
            setFlaggedClauses([...accumulatedClauses]);
          } else if (event.type === "summary") {
            accumulatedSummary = event.text as string;
            setSummary(accumulatedSummary);
          } else if (event.type === "done") {
            resultId = event.id as string;
          } else if (event.type === "error") {
            setScanState({ phase: "error", message: event.message as string });
            return;
          }
        }
      }

      // Stream complete — transition to done state
      if (accumulatedVerdict) {
        const outputs: ScanResult = {
          verdict: accumulatedVerdict.verdict,
          verdictHeadline: accumulatedVerdict.verdictHeadline,
          verdictReason: accumulatedVerdict.verdictReason,
          flaggedClauses: accumulatedClauses,
          summary: accumulatedSummary,
        };
        setScanState({
          phase: "done",
          result: {
            id: resultId,
            inputs: {
              contract_length: contractText.length,
              creator_context: creatorContext,
              niche,
            },
            outputs,
          },
        });
      } else {
        setScanState({ phase: "error", message: "scan didn't complete. try again" });
      }
    } catch (err) {
      setScanState({
        phase: "error",
        message: err instanceof Error ? err.message : "something went wrong. try again",
      });
    }
  }

  const deleteDate =
    scanState.phase === "done"
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

  return (
    <article className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-12">
      {/* Hero */}
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{tool.title}</h1>
        <p className="text-lg text-ink-muted leading-relaxed">{tool.oneLiner}</p>
        <p className="text-sm text-ink-muted">free tool. no signup required to see your result.</p>
      </header>

      {/* Legal disclaimer — required, non-negotiable */}
      <aside className="rounded-xl border border-border bg-paper-soft px-4 py-4 space-y-1.5 text-sm text-ink-muted">
        <p>
          <strong className="text-ink font-medium">
            this tool flags clauses and explains them in plain English. it does NOT provide legal
            advice.
          </strong>
        </p>
        <p>
          for serious concerns about a contract, talk to a lawyer who knows entertainment and IP
          law.
        </p>
        <p>
          we never store your contract text long-term. scans are kept for 7 days for your shareable
          result URL, then permanently deleted.
        </p>
      </aside>

      {/* Form — shown while idle or scanning */}
      {(scanState.phase === "idle" ||
        scanState.phase === "scanning" ||
        scanState.phase === "error") && (
        <form onSubmit={handleScan} className="space-y-6" noValidate>
          {/* Contract text */}
          <div className="space-y-2">
            <label htmlFor="contract_text" className="block text-sm font-medium text-ink">
              contract text
              <span className="text-danger ml-1" aria-hidden="true">
                *
              </span>
            </label>
            <p id="contract-text-help" className="text-sm text-ink-muted">
              paste the full contract text. email addresses, phone numbers, and tax IDs are
              automatically stripped before the AI sees it.
            </p>
            <ContractTextarea
              value={contractText}
              onChange={setContractText}
              error={formError ?? undefined}
              disabled={isScanning}
            />
          </div>

          {/* Creator context */}
          <div className="space-y-2">
            <label htmlFor="creator_context" className="block text-sm font-medium text-ink">
              context about this deal <span className="text-ink-muted font-normal">(optional)</span>
            </label>
            <p className="text-sm text-ink-muted">
              what&apos;s the deal about? anything discussed verbally that&apos;s not in the
              contract? this helps the scan weigh clauses against your situation.
            </p>
            <textarea
              id="creator_context"
              value={creatorContext}
              onChange={(e) => setCreatorContext(e.target.value)}
              disabled={isScanning}
              rows={3}
              maxLength={2000}
              placeholder="e.g. 'YouTube integration for a skincare brand, $5k, they mentioned verbally I keep the product but that's not in the contract...'"
              className="w-full text-base rounded-lg border border-border px-3 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Niche */}
          <div className="space-y-2">
            <fieldset>
              <legend className="block text-sm font-medium text-ink mb-2">
                your content niche <span className="text-ink-muted font-normal">(optional)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "gaming", label: "gaming" },
                  { value: "beauty", label: "beauty / fashion" },
                  { value: "finance", label: "finance / business" },
                  { value: "lifestyle", label: "lifestyle / travel" },
                  { value: "education", label: "education" },
                  { value: "tech", label: "tech" },
                  { value: "other", label: "other" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`min-h-tap flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                      niche === opt.value
                        ? "border-brand bg-brand/10 text-brand font-medium"
                        : "border-border text-ink hover:bg-paper-soft"
                    } ${isScanning ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <input
                      type="radio"
                      name="niche"
                      value={opt.value}
                      checked={niche === opt.value}
                      onChange={() => setNiche(niche === opt.value ? "" : opt.value)}
                      className="sr-only"
                      disabled={isScanning}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Error state */}
          {scanState.phase === "error" && (
            <div
              className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {scanState.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isScanning}
            className="w-full min-h-tap bg-brand text-white font-semibold rounded-lg px-6 py-3 text-base hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isScanning ? "Scanning contract..." : "Scan contract"}
          </button>
        </form>
      )}

      {/* Streaming / done results */}
      {(scanState.phase === "scanning" || scanState.phase === "done") && (
        <div id="scan-results" className="space-y-12" aria-live="polite">
          <StreamingResult
            verdictState={verdictState ?? undefined}
            flaggedClauses={flaggedClauses}
            summary={summary ?? undefined}
            isStreaming={scanState.phase === "scanning"}
          />

          {/* Post-scan sections (shown after stream completes) */}
          {scanState.phase === "done" && (
            <>
              <ToolExplainer
                slug={contractScanner.explainerSlug}
                excerpt={contractScanner.explainerExcerpt}
              />

              <ToolFollowupChat tool={tool} result={scanState.result} />

              {/* 7-day retention notice + share block */}
              {scanState.result.id !== "local" && (
                <aside className="space-y-3">
                  <p className="text-xs text-ink-muted">
                    your shareable result link is active until{" "}
                    <strong className="text-ink">{deleteDate}</strong>. after that it&apos;s
                    permanently deleted per our 7-day retention policy.
                  </p>
                  <ToolShareBlock tool={tool} result={scanState.result} />
                </aside>
              )}

              <ToolCrossPromo
                currentSlug="contract-scanner"
                related={contractScanner.relatedTools}
              />

              {/* Scan another */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setScanState({ phase: "idle" })}
                  className="text-sm text-brand hover:text-brand-dark underline transition-colors"
                >
                  scan another contract →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}
