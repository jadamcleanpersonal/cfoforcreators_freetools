// Shareable result page — loads saved scan from Supabase, renders server-side.
// URL: /contract-scanner/result/[id]
// Result URLs must remain stable forever — never change the snapshot shape.
// Scans auto-delete after 7 days per disclosed retention policy.

import StreamingResult from "@/components/contract/StreamingResult";
import ToolCrossPromo from "@/components/tool/ToolCrossPromo";
import ToolExplainer from "@/components/tool/ToolExplainer";
import ToolFollowupChat from "@/components/tool/ToolFollowupChat";
import ToolShareBlock from "@/components/tool/ToolShareBlock";
import type { ScanResult } from "@/lib/contract/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ToolDefinition } from "@/tools/_types";
import contractScanner from "@/tools/contract-scanner";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tool = contractScanner as unknown as ToolDefinition<z.ZodTypeAny, any>;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("tool_results")
    .select("outputs")
    .eq("id", id)
    .eq("tool_slug", "contract-scanner")
    .single();

  if (!data) return { title: "Brand contract scan — cfo for creators" };

  const row = data as unknown as { outputs: ScanResult };
  const outputs = row.outputs;
  const verdictWord =
    outputs.verdict === "yes"
      ? "looks fine"
      : outputs.verdict === "no"
        ? "don't sign as-is"
        : "negotiate first";

  return {
    title: `contract scan: ${verdictWord} — cfo for creators`,
    description: outputs.verdictReason,
  };
}

export default async function ContractScannerResultPage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("tool_results")
    .select("*")
    .eq("id", id)
    .eq("tool_slug", "contract-scanner")
    .single();

  if (error || !data) {
    notFound();
  }

  // Cast untyped Supabase row to our known shape
  const row = data as unknown as {
    id: string;
    inputs: unknown;
    outputs: ScanResult;
    view_count: number | null;
    delete_after: string | null;
  };

  // Increment view count (fire and forget)
  supabaseAdmin
    .from("tool_results")
    .update({ view_count: (row.view_count ?? 0) + 1 })
    .eq("id", id)
    .then(() => {});

  const outputs = row.outputs;

  const result = {
    id: row.id,
    inputs: row.inputs,
    outputs,
  };

  const deleteAfter = row.delete_after;
  const deleteDate = deleteAfter
    ? new Date(deleteAfter).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-12">
      <header className="space-y-2">
        <p className="text-sm text-ink-muted">someone shared their brand contract scan</p>
        <h1 className="text-2xl font-bold text-ink">Brand contract scan result</h1>
        <a href="/contract-scanner" className="inline-block text-sm text-brand hover:underline">
          scan your own contract →
        </a>
      </header>

      {/* Legal disclaimer on saved result page */}
      <aside className="rounded-xl border border-border bg-paper-soft px-4 py-3 text-sm text-ink-muted">
        <p>
          this scan flags clauses and explains them in plain English. it does NOT provide legal
          advice. for serious concerns, talk to a lawyer who knows entertainment and IP law.
        </p>
        {deleteDate && (
          <p className="mt-1.5">
            this scan auto-deletes on <strong className="text-ink">{deleteDate}</strong>.
          </p>
        )}
      </aside>

      <StreamingResult result={outputs} />

      <ToolExplainer
        slug={contractScanner.explainerSlug}
        excerpt={contractScanner.explainerExcerpt}
      />

      <ToolFollowupChat tool={tool} result={result} />

      <ToolShareBlock tool={tool} result={result} />

      <ToolCrossPromo currentSlug="contract-scanner" related={contractScanner.relatedTools} />
    </article>
  );
}
