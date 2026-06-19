// S-corp Calculator — ToolDefinition
// Zod schema validates client + server (single source of truth).
// computeScorp is imported from src/lib/tax/scorp.ts — no math in this file.

import { STATE_CODES } from "@/data/states";
import { type ScorpResult, computeScorp } from "@/lib/tax/scorp";
import { z } from "zod";
import type { ResultDisplay, ToolDefinition } from "./_types";

// ── Input schema ─────────────────────────────────────────────────────────────
export const scorpCalculatorInputSchema = z.object({
  primary_platform: z.enum(["youtube", "tiktok", "twitch", "instagram", "multi", "podcast"]),
  niche: z.enum(["gaming", "beauty", "finance", "lifestyle", "education", "tech", "other"]),
  audience_size: z.enum(["<10k", "10-100k", "100k-1M", "1M+"]),
  hours_per_week: z.number().int().min(1).max(80),
  total_creator_income: z.number().int().min(0),
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
  business_expenses: z.number().int().min(0),
  state: z.enum(STATE_CODES),
  current_entity: z.enum(["sole_prop", "single_member_llc", "scorp_already", "other", "not_sure"]),
  years_creating_full_time: z.enum(["<1", "1-3", "3-5", "5+"]),
  manager_or_agency_cut: z.number().int().min(0).max(30).default(0),
});

export type ScorpCalculatorInput = z.infer<typeof scorpCalculatorInputSchema>;

// ── Output schema ─────────────────────────────────────────────────────────────
export const scorpCalculatorOutputSchema = z.object({
  verdict: z.enum(["yes", "no", "wait"]),
  verdictHeadline: z.string(),
  verdictReason: z.string(),
  reasonableSalary: z.object({
    low: z.number().int(),
    recommended: z.number().int(),
    high: z.number().int(),
    defensibilityNote: z.string(),
  }),
  withoutScorpAnnualTax: z.number().int(),
  withScorpAnnualTax: z.number().int(),
  grossSavings: z.number().int(),
  runningCosts: z.object({
    payrollServiceAnnual: z.number().int(),
    stateFilingFees: z.number().int(),
    additionalAccountingCost: z.number().int(),
    timeCostAnnual: z.number().int(),
    total: z.number().int(),
  }),
  netSavings: z.number().int(),
  stateGotchas: z.array(z.string()),
  filingDeadline: z.string(),
  breakdownExplainer: z.string(),
});

// ── renderResult: converts ScorpResult → ResultDisplay ───────────────────────
function renderResult(output: ScorpResult, input: ScorpCalculatorInput): ResultDisplay {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const breakdown: { label: string; value: string }[] = [
    {
      label: "SE tax as sole prop / SMLLC (what you pay now)",
      value: fmt(output.withoutScorpAnnualTax),
    },
    {
      label: "SE tax as S-corp (only on salary)",
      value: fmt(output.withScorpAnnualTax - output.runningCosts.total),
    },
    { label: "gross SE tax savings", value: fmt(output.grossSavings) },
    {
      label: "payroll service (~$75/mo)",
      value: `−${fmt(output.runningCosts.payrollServiceAnnual)}`,
    },
    {
      label: "extra accounting (S-corp filing)",
      value: `−${fmt(output.runningCosts.additionalAccountingCost)}`,
    },
    {
      label: `${input.state} S-corp state fees`,
      value: `−${fmt(output.runningCosts.stateFilingFees)}`,
    },
    {
      label: "net savings per year",
      value:
        output.netSavings >= 0 ? fmt(output.netSavings) : `−${fmt(Math.abs(output.netSavings))}`,
    },
    {
      label: "reasonable salary range",
      value: `${fmt(output.reasonableSalary.low)}–${fmt(output.reasonableSalary.high)}`,
    },
    { label: "recommended salary", value: fmt(output.reasonableSalary.recommended) },
  ];

  const headlineNumber =
    output.verdict === "yes"
      ? `~${fmt(output.netSavings)}/yr saved`
      : output.verdict === "no"
        ? "don't switch yet"
        : "borderline. wait.";

  const headline =
    output.verdict === "yes"
      ? `save ~${fmt(output.netSavings)} per year by switching to S-corp`
      : output.verdict === "no"
        ? "S-corp would not save you money right now"
        : "right at the breakeven. wait for more stability.";

  const subline = `${input.state} · ${input.niche} · ${input.audience_size} audience · ${input.hours_per_week} hrs/week`;

  const recommendation =
    output.verdict === "yes"
      ? `file Form 2553 with the IRS by ${output.filingDeadline}. your accountant handles this. it takes about a week.`
      : output.verdict === "wait"
        ? `re-run this calculator next quarter. if profit stays above $80k, switch then.`
        : undefined;

  const caveat =
    output.stateGotchas.length > 0
      ? output.stateGotchas[0]
      : `estimates based on 2025 SE tax rates and typical S-corp running costs. verify with an accountant before filing Form 2553.`;

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

// ── ToolDefinition ─────────────────────────────────────────────────────────────
const tool: ToolDefinition<typeof scorpCalculatorInputSchema, ScorpResult> = {
  slug: "scorp-calculator",
  title: "S-corp calculator for content creators",
  oneLiner:
    "11 creator-specific questions. get a real yes / no / wait answer on whether switching to S-corp would actually save you money.",
  metaTitle: "S-corp calculator for content creators. honest yes/no answer in under 3 minutes.",
  metaDescription:
    "free tool. 11 creator-specific questions. get a real yes/no/wait answer on whether switching to an S-corp would actually save you money, including the cases where it wouldn't.",
  priority: 2,
  inputs: scorpCalculatorInputSchema,
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
      label: "content niche",
      helpText:
        "your niche affects what the IRS considers a 'reasonable salary'. finance and tech creators face higher salary expectations than lifestyle creators",
      type: "radio",
      options: [
        { value: "gaming", label: "gaming" },
        { value: "beauty", label: "beauty / fashion" },
        { value: "finance", label: "finance / business" },
        { value: "lifestyle", label: "lifestyle / travel" },
        { value: "education", label: "education / how-to" },
        { value: "tech", label: "tech / programming" },
        { value: "other", label: "other" },
      ],
      required: true,
    },
    {
      name: "audience_size",
      label: "total audience size",
      helpText:
        "across all platforms. a 1M+ creator can't claim a $30k salary. the IRS knows your channel is worth more",
      type: "radio",
      options: [
        { value: "<10k", label: "under 10k" },
        { value: "10-100k", label: "10k–100k" },
        { value: "100k-1M", label: "100k–1M" },
        { value: "1M+", label: "1M+" },
      ],
      required: true,
    },
    {
      name: "hours_per_week",
      label: "hours per week spent on content creation",
      helpText:
        "this helps justify your salary number. 10 hrs/wk supports a part-time equivalent salary; 40+ hrs/wk supports a full-time one",
      type: "number",
      placeholder: "25",
      required: true,
    },
    {
      name: "total_creator_income",
      label: "total annual creator income",
      helpText:
        "gross income from all creator sources before any expenses: AdSense, brand deals, Patreon, affiliate, merch, courses, etc.",
      type: "currency",
      placeholder: "0",
      required: true,
    },
    {
      name: "business_expenses",
      label: "annual business expenses",
      helpText:
        "camera gear, software subscriptions, editing, studio costs, home office, travel for content. anything you'd deduct on a Schedule C",
      type: "currency",
      placeholder: "0",
      required: true,
    },
    {
      name: "state",
      label: "state you file taxes in",
      helpText:
        "California, NY, NJ, OR, TN, and NH have specific S-corp rules the calculator surfaces",
      type: "state",
      required: true,
    },
    {
      name: "current_entity",
      label: "current business structure",
      helpText: "what you are right now. 'not sure' defaults to sole prop rules",
      type: "radio",
      options: [
        { value: "sole_prop", label: "sole proprietor (no LLC)" },
        { value: "single_member_llc", label: "single-member LLC" },
        { value: "scorp_already", label: "already an S-corp" },
        { value: "other", label: "other (partnership, C-corp, etc.)" },
        { value: "not_sure", label: "not sure" },
      ],
      required: true,
    },
    {
      name: "years_creating_full_time",
      label: "how long have you been creating full-time?",
      helpText:
        "S-corp election locks you in for 5 years. newer creators face more risk if income drops",
      type: "radio",
      options: [
        { value: "<1", label: "less than 1 year" },
        { value: "1-3", label: "1–3 years" },
        { value: "3-5", label: "3–5 years" },
        { value: "5+", label: "5+ years" },
      ],
      required: true,
    },
    {
      name: "manager_or_agency_cut",
      label: "manager or MCN cut (%)",
      helpText:
        "if you have a manager or are signed to an MCN, enter their percentage. this reduces net income for the calculation. enter 0 if none",
      type: "percent",
      placeholder: "0",
      defaultValue: 0,
      required: false,
    },
  ],
  compute: computeScorp,
  renderResult,
  explainerSlug: "should-you-switch-to-scorp",
  explainerExcerpt:
    "S-corp election can save you thousands. it can also lock you into 5 years of payroll headaches for $400 in savings. here's how to tell which one applies to you.",
  buildShareText: (out) => {
    if (out.verdict === "yes") {
      return `s-corp would save me ~$${out.netSavings.toLocaleString()}/year. finally ran the actual math →`;
    }
    if (out.verdict === "no") {
      return `turns out s-corp is NOT worth it for me yet. this calc actually told me to wait, which feels honest →`;
    }
    return `right at the s-corp breakeven, going to wait a quarter and re-run →`;
  },
  ogTemplate: "result-comparison",
  relatedTools: ["tax-estimator"],
};

export default tool;
