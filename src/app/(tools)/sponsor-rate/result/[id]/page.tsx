// Shareable result page — loads snapshot from Supabase, renders server-side.
// URL: /sponsor-rate/result/[id]
// Result URLs must remain stable forever — never change the snapshot shape.

import ToolCrossPromo from "@/components/tool/ToolCrossPromo";
import ToolExplainer from "@/components/tool/ToolExplainer";
import ToolResult from "@/components/tool/ToolResult";
import ToolShareBlock from "@/components/tool/ToolShareBlock";
import type { SponsorRateResult } from "@/lib/sponsor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ToolDefinition } from "@/tools/_types";
import sponsorRate from "@/tools/sponsor-rate";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { z } from "zod";

// Cast to generic interface — type safety maintained inside the tool module.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tool = sponsorRate as unknown as ToolDefinition<z.ZodTypeAny, any>;

interface Props {
  params: Promise<{ id: string }>;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("tool_results")
    .select("outputs")
    .eq("id", id)
    .eq("tool_slug", "sponsor-rate")
    .single();

  if (!data) return { title: "Sponsor rate calculator result — cfo for creators" };

  const outputs = data.outputs as SponsorRateResult;
  const verdict = outputs.verdict;
  const titleVerdict =
    verdict === "yes"
      ? `${fmt(outputs.your_asking_rate)} is in range`
      : verdict === "no" && outputs.deltaDirection === "too_low"
        ? `undercharging — market median is ${fmt(outputs.marketMid)}`
        : verdict === "no"
          ? `overcharging — market ceiling is ${fmt(outputs.marketHigh)}`
          : "not enough data";

  return {
    title: `Sponsor rate: ${titleVerdict} — cfo for creators`,
    description: outputs.verdictReason,
  };
}

export default async function SponsorRateResultPage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("tool_results")
    .select("*")
    .eq("id", id)
    .eq("tool_slug", "sponsor-rate")
    .single();

  if (error || !data) {
    notFound();
  }

  // Increment view count (fire and forget)
  supabaseAdmin
    .from("tool_results")
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq("id", id)
    .then(() => {});

  const result = {
    id: data.id as string,
    inputs: data.inputs,
    outputs: data.outputs,
  };

  return (
    <article className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-12">
      <header className="space-y-2">
        <p className="text-sm text-ink-muted">someone shared their sponsor rate calculation</p>
        <h1 className="text-2xl font-bold text-ink">sponsor rate calculator result</h1>
        <a href="/sponsor-rate" className="inline-block text-sm text-brand hover:underline">
          calculate your own →
        </a>
      </header>

      <ToolResult tool={tool} result={result} />

      <ToolExplainer slug={sponsorRate.explainerSlug} excerpt={sponsorRate.explainerExcerpt} />

      <ToolShareBlock tool={tool} result={result} />

      <ToolCrossPromo currentSlug="sponsor-rate" related={sponsorRate.relatedTools} />
    </article>
  );
}
