// Tax Estimator — ToolDefinition
// Zod schema validates client + server (single source of truth).
// computeTaxEstimate is imported from src/lib/tax/index.ts — no math in this file.

import { STATE_CODES } from "@/data/states";
import { type TaxEstimatorOutput, computeTaxEstimate } from "@/lib/tax";
import { z } from "zod";
import type { ResultDisplay, ToolDefinition } from "./_types";

// ── Input schema ─────────────────────────────────────────────────────────────
export const taxEstimatorInputSchema = z.object({
  primary_platform: z.enum(["youtube", "tiktok", "twitch", "instagram", "multi", "podcast"]),
  niche: z.enum(["gaming", "beauty", "finance", "lifestyle", "education", "tech", "other"]),
  tax_year: z.number().int().min(2024).max(2027),
  current_quarter: z.enum(["q1", "q2", "q3", "q4"]),
  total_creator_income_ytd: z.number().int().min(0),
  income_breakdown: z
    .object({
      adsense: z.number().int().min(0).optional(),
      sponsors: z.number().int().min(0).optional(),
      patreon: z.number().int().min(0).optional(),
      affiliate: z.number().int().min(0).optional(),
      merch: z.number().int().min(0).optional(),
      courses: z.number().int().min(0).optional(),
    })
    .optional(),
  business_expenses_ytd: z.number().int().min(0),
  state: z.enum(STATE_CODES),
  filing_status: z.enum(["single", "married_joint", "married_separate", "head_of_household"]),
  other_w2_income: z.number().int().min(0).default(0),
  already_paid_estimated_taxes: z.number().int().min(0).default(0),
  withholding_from_w2: z.number().int().min(0).default(0),
});

export type TaxEstimatorInput = z.infer<typeof taxEstimatorInputSchema>;

// ── Output schema ────────────────────────────────────────────────────────────
export const taxEstimatorOutputSchema = z.object({
  verdict: z.enum(["yes", "no", "wait"]),
  verdictHeadline: z.string(),
  verdictReason: z.string(),
  amountThisQuarter: z.number().int(),
  deadline: z.string(),
  projectedAnnualIncome: z.number().int(),
  projectedAnnualExpenses: z.number().int(),
  federalBreakdown: z.object({
    incomeTax: z.number().int(),
    seTax: z.number().int(),
    qbiDeduction: z.number().int(),
    standardDeduction: z.number().int(),
  }),
  stateTax: z.number().int(),
  stateName: z.string(),
  safeHarborThreshold: z.number().int(),
  safeHarborNote: z.string(),
  catchUpPenaltyEstimate: z.number().int().optional(),
  totalProjectedTax: z.number().int(),
  effectiveRate: z.number(),
});

export type TaxEstimatorOutput_ = z.infer<typeof taxEstimatorOutputSchema>;

// ── renderResult: converts TaxEstimatorOutput → ResultDisplay ────────────────
function renderResult(output: TaxEstimatorOutput, input: TaxEstimatorInput): ResultDisplay {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

  const breakdown: { label: string; value: string }[] = [
    { label: "projected annual creator income", value: fmt(output.projectedAnnualIncome) },
    { label: "projected annual expenses", value: `−${fmt(output.projectedAnnualExpenses)}` },
    { label: "federal income tax (annual)", value: fmt(output.federalBreakdown.incomeTax) },
    { label: "self-employment tax (annual)", value: fmt(output.federalBreakdown.seTax) },
  ];

  if (output.federalBreakdown.qbiDeduction > 0) {
    breakdown.push({
      label: "QBI deduction (20% pass-through)",
      value: `−${fmt(output.federalBreakdown.qbiDeduction)}`,
    });
  }

  if (output.stateTax > 0) {
    breakdown.push({
      label: `${output.stateName} state tax (annual)`,
      value: fmt(output.stateTax),
    });
  } else {
    breakdown.push({ label: `${output.stateName} state tax`, value: "$0 (no income tax)" });
  }

  breakdown.push({ label: "total projected tax (annual)", value: fmt(output.totalProjectedTax) });
  breakdown.push({ label: "safe harbor threshold", value: fmt(output.safeHarborThreshold) });
  breakdown.push({ label: "effective tax rate", value: pct(output.effectiveRate) });

  if (output.catchUpPenaltyEstimate !== undefined && output.catchUpPenaltyEstimate > 0) {
    breakdown.push({
      label: "estimated underpayment penalty",
      value: `~${fmt(output.catchUpPenaltyEstimate)}`,
    });
  }

  const headlineNumber = output.verdict === "no" ? "$0 due" : fmt(output.amountThisQuarter);

  const headline =
    output.verdict === "no"
      ? "no quarterly payment needed this period"
      : `${headlineNumber} due by ${output.deadline}`;

  const subline = `${input.state} · ${input.filing_status.replace("_", " ")} · ${input.tax_year}`;

  const recommendation =
    output.verdict === "wait"
      ? `send ${fmt(output.amountThisQuarter)} to irs direct pay (directpay.irs.gov) to stop the underpayment clock.`
      : output.verdict === "yes"
        ? `send ${fmt(output.amountThisQuarter)} to irs direct pay by ${output.deadline}. takes about 3 minutes.`
        : undefined;

  const caveat =
    `estimate based on ${pct(0.9)}-of-projected-tax safe harbor. ` +
    (output.stateTax > 0
      ? `${output.stateName} state estimate is approximate. verify with an accountant at filing. `
      : "") +
    `2026 federal brackets use 2025 IRS numbers pending official 2026 release.`;

  return {
    verdict: output.verdict,
    verdictHeadline: output.verdictHeadline,
    verdictReason: output.verdictReason,
    headline,
    headlineNumber,
    subline,
    breakdown,
    recommendation,
    caveat,
  };
}

// ── ToolDefinition ────────────────────────────────────────────────────────────
const tool: ToolDefinition<typeof taxEstimatorInputSchema, TaxEstimatorOutput> = {
  slug: "tax-estimator",
  title: "free quarterly tax calculator for creators",
  oneLiner:
    "plug in your creator income. get the exact dollar amount to send the IRS this quarter.",
  metaTitle: "quarterly tax calculator for content creators. free, no signup.",
  metaDescription:
    "free tool. plug in your creator income and expenses. get the exact amount to send the IRS this quarter, including state tax. no signup needed.",
  priority: 1,
  inputs: taxEstimatorInputSchema,
  inputFields: [
    {
      name: "primary_platform",
      label: "main platform",
      helpText: "where most of your creator income comes from",
      type: "radio",
      options: [
        { value: "youtube", label: "YouTube" },
        { value: "tiktok", label: "TikTok" },
        { value: "twitch", label: "Twitch" },
        { value: "instagram", label: "Instagram" },
        { value: "multi", label: "multi-platform" },
        { value: "podcast", label: "podcast" },
      ],
      required: true,
    },
    {
      name: "niche",
      label: "niche",
      type: "radio",
      options: [
        { value: "gaming", label: "gaming" },
        { value: "beauty", label: "beauty / fashion" },
        { value: "finance", label: "finance / business" },
        { value: "lifestyle", label: "lifestyle / travel" },
        { value: "education", label: "education / how-to" },
        { value: "tech", label: "tech" },
        { value: "other", label: "other" },
      ],
      required: true,
    },
    {
      name: "tax_year",
      label: "tax year",
      type: "number",
      defaultValue: new Date().getFullYear(),
      placeholder: "2025",
      required: true,
    },
    {
      name: "current_quarter",
      label: "which quarter are you filing for?",
      helpText:
        "Q1 = Jan–Mar (due Apr 15) · Q2 = Apr–May (due Jun 15) · Q3 = Jun–Aug (due Sep 15) · Q4 = Sep–Dec (due Jan 15)",
      type: "radio",
      options: [
        { value: "q1", label: "Q1 (due Apr 15)" },
        { value: "q2", label: "Q2 (due Jun 15)" },
        { value: "q3", label: "Q3 (due Sep 15)" },
        { value: "q4", label: "Q4 (due Jan 15)" },
      ],
      required: true,
    },
    {
      name: "total_creator_income_ytd",
      label: "total creator income so far this year",
      helpText:
        "everything from your creator work: AdSense, brand deals, Patreon, affiliate, merch, courses. before expenses. year-to-date total.",
      type: "currency",
      placeholder: "0",
      required: true,
    },
    {
      name: "business_expenses_ytd",
      label: "business expenses so far this year",
      helpText:
        "camera gear, software subscriptions, home office, editing, travel for content. anything you bought specifically for your creator business. year-to-date total.",
      type: "currency",
      placeholder: "0",
      required: true,
    },
    {
      name: "state",
      label: "state you file taxes in",
      type: "state",
      required: true,
    },
    {
      name: "filing_status",
      label: "filing status",
      type: "radio",
      options: [
        { value: "single", label: "single" },
        { value: "married_joint", label: "married filing jointly" },
        { value: "married_separate", label: "married filing separately" },
        { value: "head_of_household", label: "head of household" },
      ],
      required: true,
    },
    {
      name: "other_w2_income",
      label: "W-2 income from a day job (annual, if any)",
      helpText:
        "if you also have a regular job, enter your annual gross salary. if creator is your only income, leave this as 0.",
      type: "currency",
      placeholder: "0",
      defaultValue: 0,
      required: false,
    },
    {
      name: "already_paid_estimated_taxes",
      label: "estimated taxes already paid this year",
      helpText:
        "total of any quarterly payments you've already sent to the IRS this year. leave 0 if this is your first payment.",
      type: "currency",
      placeholder: "0",
      defaultValue: 0,
      required: false,
    },
    {
      name: "withholding_from_w2",
      label: "federal tax withheld from W-2 paychecks so far this year",
      helpText:
        "check your most recent pay stub. it's labeled 'federal income tax withheld'. leave 0 if you have no W-2 job.",
      type: "currency",
      placeholder: "0",
      defaultValue: 0,
      required: false,
    },
  ],
  compute: computeTaxEstimate,
  renderResult,
  explainerSlug: "how-quarterly-taxes-actually-work",
  explainerExcerpt:
    "quarterly taxes are not optional. here's how they actually work, in plain english.",
  buildShareText: (out) =>
    `just figured out i owe $${out.amountThisQuarter.toLocaleString()} in quarterly taxes this quarter. wish i'd known about this tool 6 months ago →`,
  ogTemplate: "result-headline",
  relatedTools: ["scorp-calculator"],
};

export default tool;
