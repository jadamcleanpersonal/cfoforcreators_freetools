// Sponsor Rate Calculator — ToolDefinition
// Zod schema validates client + server (single source of truth).
// computeSponsorRate is imported from src/lib/sponsor — no math in this file.

import { type SponsorRateResult, computeSponsorRate } from "@/lib/sponsor";
import { z } from "zod";
import type { ResultDisplay, ToolDefinition } from "./_types";

// ── Input schema ──────────────────────────────────────────────────────────────
export const sponsorRateInputSchema = z.object({
  primary_platform: z.enum([
    "youtube_long",
    "youtube_shorts",
    "tiktok",
    "instagram_reels",
    "instagram_feed",
    "twitch",
    "podcast",
    "x",
  ]),
  niche: z.enum([
    "gaming",
    "beauty",
    "finance",
    "lifestyle",
    "education",
    "tech",
    "food",
    "fitness",
    "other",
  ]),
  audience_size: z.enum(["<10k", "10-100k", "100k-1M", "1M+"]),
  avg_views_per_video: z.number().int().min(0),
  engagement_rate_pct: z.number().min(0).max(30).optional(),
  deliverable_type: z.enum([
    "dedicated_video",
    "integration",
    "mention",
    "story_post",
    "feed_post",
    "podcast_read",
    "multi_deliverable",
  ]),
  your_asking_rate: z.number().int().min(0),
  exclusivity_window_days: z.number().int().min(0).default(0),
  usage_rights: z.enum(["organic_only", "brand_can_boost_paid", "brand_owns_perpetual"]),
});

export type SponsorRateInput = z.infer<typeof sponsorRateInputSchema>;

// ── renderResult: converts SponsorRateResult → ResultDisplay ─────────────────
function renderResult(output: SponsorRateResult, input: SponsorRateInput): ResultDisplay {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const breakdown: { label: string; value: string }[] = [
    { label: "your asking rate", value: fmt(input.your_asking_rate) },
    { label: "market low (floor)", value: fmt(output.marketLow) },
    { label: "market median", value: fmt(output.marketMid) },
    { label: "market high (ceiling)", value: fmt(output.marketHigh) },
  ];

  // Show applied adjustments
  if (output.adjustments.length > 0) {
    breakdown.push({ label: "—", value: "adjustments applied" });
    for (const adj of output.adjustments) {
      breakdown.push({
        label: adj.label,
        value: `×${adj.multiplier.toFixed(1)}`,
      });
    }
  }

  breakdown.push({ label: "data source", value: output.dataSource });
  breakdown.push({
    label: "data confidence",
    value: output.dataConfidence,
  });

  const platformLabels: Record<string, string> = {
    youtube_long: "YouTube",
    youtube_shorts: "YouTube Shorts",
    tiktok: "TikTok",
    instagram_reels: "Instagram Reels",
    instagram_feed: "Instagram",
    twitch: "Twitch",
    podcast: "Podcast",
    x: "X",
  };

  const deliverableLabels: Record<string, string> = {
    dedicated_video: "dedicated video",
    integration: "integration",
    mention: "mention",
    story_post: "story post",
    feed_post: "feed post",
    podcast_read: "host-read ad",
    multi_deliverable: "multi-platform package",
  };

  const headlineNumber = fmt(input.your_asking_rate);
  const platLabel = platformLabels[input.primary_platform] ?? input.primary_platform;
  const delLabel = deliverableLabels[input.deliverable_type] ?? input.deliverable_type;

  const headline =
    output.verdict === "yes"
      ? `${fmt(input.your_asking_rate)} is in market range for your ${platLabel} ${delLabel}`
      : output.verdict === "no" && output.deltaDirection === "too_low"
        ? `${fmt(input.your_asking_rate)} is under market — the median is ${fmt(output.marketMid)}`
        : output.verdict === "no" && output.deltaDirection === "too_high"
          ? `${fmt(input.your_asking_rate)} is above market — the ceiling is ${fmt(output.marketHigh)}`
          : `not enough data to validate this rate confidently`;

  const subline = `${platLabel} · ${input.niche} · ${input.audience_size} · ${delLabel}`;

  const recommendation =
    output.verdict === "no" && output.deltaDirection === "too_low"
      ? `start your next pitch at ${fmt(output.marketLow)}. don't drop below that even if a brand pushes back — they know the market.`
      : output.verdict === "no" && output.deltaDirection === "too_high"
        ? `reset to ${fmt(Math.round((output.marketMid + output.marketHigh) / 2))}–${fmt(output.marketHigh)} for a faster close rate. keep your current rate if you're consistently getting yeses.`
        : output.verdict === "wait"
          ? `track your acceptance rate over the next 5 pitches. if 2+ say yes, your rate is right. if all pass, drop toward ${fmt(output.marketLow)}.`
          : undefined;

  const caveat =
    output.dataConfidence === "low"
      ? `this range is triangulated — no direct public data for this exact niche/platform combination. treat as a starting point, not a firm market rate.`
      : `based on ${output.dataSource}. rates vary by audience quality, brand budget cycle, and negotiation. these are market medians, not guarantees.`;

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
const tool: ToolDefinition<typeof sponsorRateInputSchema, SponsorRateResult> = {
  slug: "sponsor-rate",
  title: "What should you charge for a sponsorship? Free rate calculator",
  oneLiner:
    "9 questions. get a real yes / no / wait answer on whether the rate you're considering is in market range — including when you're undercharging.",
  metaTitle: "Sponsor rate calculator for creators — based on Karat 2024 + industry data",
  metaDescription:
    "free tool. 9 questions. get a real yes/no/wait answer on whether the rate you're considering is in market range — including when you're undercharging or overcharging.",
  priority: 3,
  inputs: sponsorRateInputSchema,
  inputFields: [
    {
      name: "primary_platform",
      label: "main platform",
      helpText: "where this sponsorship will live — platform drives the entire rate model",
      type: "radio",
      options: [
        { value: "youtube_long", label: "YouTube (long-form)" },
        { value: "youtube_shorts", label: "YouTube Shorts" },
        { value: "tiktok", label: "TikTok" },
        { value: "instagram_reels", label: "Instagram Reels" },
        { value: "instagram_feed", label: "Instagram (feed post / story)" },
        { value: "twitch", label: "Twitch" },
        { value: "podcast", label: "Podcast" },
        { value: "x", label: "X (Twitter)" },
      ],
      required: true,
    },
    {
      name: "niche",
      label: "content niche",
      helpText:
        "your niche affects brand demand — finance and tech creators command premiums because their audiences have higher purchase intent",
      type: "radio",
      options: [
        { value: "gaming", label: "gaming" },
        { value: "beauty", label: "beauty / fashion" },
        { value: "finance", label: "finance / business" },
        { value: "lifestyle", label: "lifestyle / travel" },
        { value: "education", label: "education / how-to" },
        { value: "tech", label: "tech / programming" },
        { value: "food", label: "food / cooking" },
        { value: "fitness", label: "fitness / wellness" },
        { value: "other", label: "other" },
      ],
      required: true,
    },
    {
      name: "audience_size",
      label: "total audience size",
      helpText:
        "your subscriber or follower count on this platform. the primary tier that determines base rate",
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
      name: "avg_views_per_video",
      label: "average views per video / episode",
      helpText:
        "the actual delivery metric sponsors care about. if your last 10 videos averaged 80k views, enter 80000",
      type: "number",
      placeholder: "50000",
      required: true,
    },
    {
      name: "engagement_rate_pct",
      label: "engagement rate % (optional)",
      helpText:
        "likes + comments + shares ÷ views × 100. if you don't know it, leave this blank — we'll estimate from your views-to-audience ratio",
      type: "percent",
      placeholder: "",
      required: false,
    },
    {
      name: "deliverable_type",
      label: "what you're delivering",
      helpText:
        "deliverable type moves the rate more than anything else. a dedicated video is 2-3x an integration in the same video",
      type: "radio",
      options: [
        { value: "integration", label: "integration (sponsor segment in your regular video)" },
        { value: "dedicated_video", label: "dedicated video (entire video is the brand)" },
        { value: "mention", label: "mention (brief name-drop or link in description)" },
        { value: "story_post", label: "story post (24-hour ephemeral content)" },
        { value: "feed_post", label: "feed post (permanent static post)" },
        { value: "podcast_read", label: "host-read ad (mid-roll or pre-roll)" },
        {
          value: "multi_deliverable",
          label: "multi-platform package (YouTube + IG + email, etc.)",
        },
      ],
      required: true,
    },
    {
      name: "your_asking_rate",
      label: "what you're considering charging",
      helpText:
        "the dollar amount you're thinking of quoting to the brand. this is what the verdict evaluates",
      type: "currency",
      placeholder: "5000",
      required: true,
    },
    {
      name: "exclusivity_window_days",
      label: "exclusivity window (days)",
      helpText:
        "how long you're agreeing not to work with competing brands. 0 = no exclusivity. 30 and 90 days are standard asks from brands. longer exclusivity = higher rate",
      type: "number",
      placeholder: "0",
      defaultValue: 0,
      required: false,
    },
    {
      name: "usage_rights",
      label: "usage rights",
      helpText:
        "what the brand is allowed to do with the content after you post it. perpetual rights are worth 2-3x organic-only",
      type: "radio",
      options: [
        {
          value: "organic_only",
          label: "organic only (they can't repurpose or run it as an ad)",
        },
        {
          value: "brand_can_boost_paid",
          label: "paid amplification (they can boost your post as an ad)",
        },
        {
          value: "brand_owns_perpetual",
          label: "perpetual / whitelisting (they own the content indefinitely)",
        },
      ],
      required: true,
    },
  ],
  compute: computeSponsorRate,
  renderResult,
  explainerSlug: "how-to-price-a-brand-deal",
  explainerExcerpt:
    "most rate calculators just tell you to charge more. this one tells you when you're overcharging too. here's how brand deal pricing actually works — and where the real money is.",
  buildShareText: (out: SponsorRateResult) => {
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
        notation: "compact",
      }).format(n);
    if (out.verdict === "yes") {
      return `validated my ${fmt(out.your_asking_rate)} sponsor rate against market data. in range →`;
    }
    if (out.verdict === "no" && out.deltaDirection === "too_low") {
      return `turns out i was charging way too little for sponsorships. market median is ${fmt(out.marketMid)} →`;
    }
    if (out.verdict === "no" && out.deltaDirection === "too_high") {
      return `turns out i was overcharging for sponsorships. market median is ${fmt(out.marketMid)} →`;
    }
    return `couldn't fully validate my sponsor rate (thin data for my niche) — here's how i'm triangulating →`;
  },
  ogTemplate: "result-headline",
  relatedTools: ["tax-estimator", "scorp-calculator"],
};

export default tool;
