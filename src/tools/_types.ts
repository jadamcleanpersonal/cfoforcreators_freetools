// ToolDefinition and ResultDisplay contracts.
// Every tool exports one default object satisfying ToolDefinition.
// See docs/cfoforcreators_buildout_plan.md §4 for the full rationale.

import type { z } from "zod";

// ============================================================
// FieldConfig — drives both form rendering and API validation
// ============================================================
export interface FieldConfig {
  name: string;
  label: string;
  helpText?: string; // plain-language explainer for finance terms
  type: "currency" | "number" | "select" | "state" | "radio" | "textarea" | "percent";
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
}

// ============================================================
// ResultDisplay — the output contract for every tool.
// REQUIRED: every tool must produce a verdict. No exceptions.
// ============================================================
export interface ResultDisplay {
  // VERDICT — rendered prominently ABOVE the headline number.
  // Forces the tool to take a position. This is the brand-defining moment.
  verdict: "yes" | "no" | "wait";
  verdictHeadline: string; // e.g. "Don't switch to S-corp yet"
  verdictReason: string; // 1 plain-language sentence

  // Calculation display — always shown below the verdict
  headline: string; // e.g. "$12,400 to send the IRS by April 15"
  headlineNumber?: string; // e.g. "$12,400" — used by OG image
  subline?: string; // e.g. "Based on $80k profit, single filer, CA"
  breakdown?: { label: string; value: string }[];
  recommendation?: string; // optional plain-language nudge
  caveat?: string; // ONE caveat max, not five
}

// ============================================================
// ToolDefinition — the full contract for a tool
// ============================================================
export interface ToolDefinition<Inputs extends z.ZodTypeAny, Outputs> {
  // routing & metadata
  slug: string; // "tax-estimator"
  title: string; // "Quarterly Tax Estimator"
  oneLiner: string; // hero subhead
  metaTitle: string; // SEO title
  metaDescription: string;
  priority: number; // for cross-promo ordering (lower = higher priority)

  // form schema — validates client AND server (single source of truth)
  inputs: Inputs;
  inputFields: FieldConfig[];

  // pure calculator function — testable in isolation, no React
  compute: (input: z.infer<Inputs>) => Outputs;

  // result rendering — derives ResultDisplay from compute() output
  renderResult: (output: Outputs, input: z.infer<Inputs>) => ResultDisplay;

  // explainer content
  explainerSlug: string; // links to /learn/[slug]
  explainerExcerpt: string; // shown inline under the result

  // share copy
  buildShareText: (output: Outputs) => string; // pre-filled tweet text

  // OG image template
  ogTemplate: "result-headline" | "result-comparison" | "result-recommendation";

  // cross-promo (related tool slugs)
  relatedTools: string[];
}
