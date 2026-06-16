// Shareable result page — loads snapshot from Supabase, renders server-side.
// URL: /tax-estimator/result/[id]
// Result URLs must remain stable forever — never change the snapshot shape.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ToolResult from "@/components/tool/ToolResult";
import ToolExplainer from "@/components/tool/ToolExplainer";
import ToolShareBlock from "@/components/tool/ToolShareBlock";
import ToolCrossPromo from "@/components/tool/ToolCrossPromo";
import taxEstimator from "@/tools/tax-estimator";
import type { ToolDefinition } from "@/tools/_types";
import type { TaxEstimatorOutput } from "@/lib/tax";

// Cast to generic interface — type safety maintained inside the tool module.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tool = taxEstimator as unknown as ToolDefinition<z.ZodTypeAny, any>;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("tool_results")
    .select("outputs")
    .eq("id", id)
    .eq("tool_slug", "tax-estimator")
    .single();

  if (!data) return { title: "quarterly tax estimate — cfo for creators" };

  const outputs = data.outputs as TaxEstimatorOutput;
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(outputs.amountThisQuarter);

  return {
    title: `quarterly tax estimate: ${amount} due — cfo for creators`,
    description: outputs.verdictReason,
  };
}

export default async function TaxEstimatorResultPage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("tool_results")
    .select("*")
    .eq("id", id)
    .eq("tool_slug", "tax-estimator")
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
        <p className="text-sm text-ink-muted">someone shared their quarterly tax estimate</p>
        <h1 className="text-2xl font-bold text-ink">quarterly tax estimate</h1>
        <a
          href="/tax-estimator"
          className="inline-block text-sm text-brand hover:underline"
        >
          calculate your own →
        </a>
      </header>

      <ToolResult tool={tool} result={result} />

      <ToolExplainer
        slug={taxEstimator.explainerSlug}
        excerpt={taxEstimator.explainerExcerpt}
      />

      <ToolShareBlock tool={tool} result={result} />

      <ToolCrossPromo currentSlug="tax-estimator" related={taxEstimator.relatedTools} />
    </article>
  );
}
