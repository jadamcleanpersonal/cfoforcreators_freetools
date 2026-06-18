// Shareable result page — loads snapshot from Supabase, renders server-side.
// URL: /scorp-calculator/result/[id]
// Result URLs must remain stable forever — never change the snapshot shape.

import ToolCrossPromo from "@/components/tool/ToolCrossPromo";
import ToolExplainer from "@/components/tool/ToolExplainer";
import ToolResult from "@/components/tool/ToolResult";
import ToolShareBlock from "@/components/tool/ToolShareBlock";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ScorpResult } from "@/lib/tax/scorp";
import type { ToolDefinition } from "@/tools/_types";
import scorpCalculator from "@/tools/scorp-calculator";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { z } from "zod";

// Cast to generic interface — type safety maintained inside the tool module.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tool = scorpCalculator as unknown as ToolDefinition<z.ZodTypeAny, any>;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("tool_results")
    .select("outputs")
    .eq("id", id)
    .eq("tool_slug", "scorp-calculator")
    .single();

  if (!data) return { title: "S-corp calculator result — cfo for creators" };

  const outputs = data.outputs as ScorpResult;
  const verdict = outputs.verdict;
  const titleVerdict =
    verdict === "yes"
      ? `save ~$${outputs.netSavings.toLocaleString()}/yr`
      : verdict === "no"
        ? "not worth it yet"
        : "wait — borderline";

  return {
    title: `S-corp for creators: ${titleVerdict} — cfo for creators`,
    description: outputs.verdictReason,
  };
}

export default async function ScorpCalculatorResultPage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("tool_results")
    .select("*")
    .eq("id", id)
    .eq("tool_slug", "scorp-calculator")
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
        <p className="text-sm text-ink-muted">someone shared their S-corp calculation</p>
        <h1 className="text-2xl font-bold text-ink">S-corp calculator result</h1>
        <a href="/scorp-calculator" className="inline-block text-sm text-brand hover:underline">
          calculate your own →
        </a>
      </header>

      <ToolResult tool={tool} result={result} />

      <ToolExplainer
        slug={scorpCalculator.explainerSlug}
        excerpt={scorpCalculator.explainerExcerpt}
      />

      <ToolShareBlock tool={tool} result={result} />

      <ToolCrossPromo currentSlug="scorp-calculator" related={scorpCalculator.relatedTools} />
    </article>
  );
}
