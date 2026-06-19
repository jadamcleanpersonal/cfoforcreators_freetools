// Sponsor rate verdict logic.
// Takes the user's asking rate + adjusted market range → "yes" | "no" | "wait".
//
// Brand-defining rules:
//   WAIT  = thin data. Never manufacture confidence we don't have.
//   YES   = asking rate is within the adjusted market range.
//   NO    = outside range. Distinguish "too low" vs "too high" in the message.

import type { AdjustedRange } from "./multipliers";

export interface VerdictInputs {
  your_asking_rate: number;
  niche: string;
  platform: string;
  audienceSize: string;
  deliverableType: string;
}

export interface VerdictResult {
  verdict: "yes" | "no" | "wait";
  verdictHeadline: string;
  verdictReason: string;
  /** Positive = you're above mid (overpricing). Negative = below mid (underpricing). */
  deltaFromMid: number;
  deltaDirection: "too_low" | "too_high" | "in_range";
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    youtube_long: "YouTube long-form",
    youtube_shorts: "YouTube Shorts",
    tiktok: "TikTok",
    instagram_reels: "Instagram Reels",
    instagram_feed: "Instagram",
    twitch: "Twitch",
    podcast: "podcast",
    x: "X (Twitter)",
  };
  return labels[platform] ?? platform;
}

function deliverableLabel(deliverable: string): string {
  const labels: Record<string, string> = {
    dedicated_video: "dedicated video",
    integration: "integration",
    mention: "mention",
    story_post: "story post",
    feed_post: "feed post",
    podcast_read: "host-read ad",
    multi_deliverable: "multi-platform package",
  };
  return labels[deliverable] ?? deliverable;
}

export function rateVerdict(
  inputs: VerdictInputs,
  marketRange: AdjustedRange,
  dataConfidence: "high" | "medium" | "low",
): VerdictResult {
  const { your_asking_rate } = inputs;
  const { low, mid, high } = marketRange;
  const deltaFromMid = your_asking_rate - mid;

  const platLabel = platformLabel(inputs.platform);
  const delLabel = deliverableLabel(inputs.deliverableType);

  // ── WAIT — thin data, don't pretend we know ───────────────────────────────
  if (dataConfidence === "low") {
    return {
      verdict: "wait",
      verdictHeadline: "Not enough data to validate this rate confidently.",
      verdictReason: `We don't have strong public data for ${inputs.audienceSize} ${inputs.niche} ${platLabel} ${delLabel}s specifically. Triangulating from adjacent data suggests ${fmt(low)}–${fmt(high)} is a plausible range. Your ${fmt(your_asking_rate)} is ${your_asking_rate >= low && your_asking_rate <= high ? "in the middle of that. probably fine, but" : "outside that range."} treat it as a starting position. Track your acceptance rate over the next 5 pitches and adjust.`,
      deltaFromMid,
      deltaDirection: "in_range",
    };
  }

  // ── YES — within market range ─────────────────────────────────────────────
  if (your_asking_rate >= low && your_asking_rate <= high) {
    const aboveMid = your_asking_rate > mid;
    const pctAbove = aboveMid ? Math.round(((your_asking_rate - mid) / mid) * 100) : 0;

    let reason: string;
    if (aboveMid && pctAbove > 15) {
      reason = `${fmt(your_asking_rate)} is on the high end of market. brands may negotiate you toward ${fmt(mid)}, which is fine. The market median is ${fmt(mid)} for a ${inputs.audienceSize} ${inputs.niche} ${platLabel} ${delLabel}. Hold your rate. Dropping to ${fmt(low)} is your walk-away floor.`;
    } else if (!aboveMid && Math.abs(deltaFromMid) / mid > 0.15) {
      reason = `${fmt(your_asking_rate)} is toward the low end of market. you could push for ${fmt(mid)} and likely get it. The median for a ${inputs.audienceSize} ${inputs.niche} ${platLabel} ${delLabel} is ${fmt(mid)}. You're leaving some money on the table but not enough to kill a deal over.`;
    } else {
      reason = `The median rate for a ${inputs.audienceSize} ${inputs.niche} ${platLabel} ${delLabel} is ${fmt(mid)}. You're close to median. that's the sweet spot. Brands won't push back. If they negotiate, hold above ${fmt(low)}.`;
    }

    return {
      verdict: "yes",
      verdictHeadline: `${fmt(your_asking_rate)} is in market range. You can confidently quote this.`,
      verdictReason: reason,
      deltaFromMid,
      deltaDirection: "in_range",
    };
  }

  // ── NO — underpricing ─────────────────────────────────────────────────────
  if (your_asking_rate < low) {
    const underBy = low - your_asking_rate;
    const timesUnder = (mid / your_asking_rate).toFixed(1);

    return {
      verdict: "no",
      verdictHeadline: `${fmt(your_asking_rate)} is way under market. You can ask ${timesUnder}x this.`,
      verdictReason: `The median rate for a ${inputs.audienceSize} ${inputs.niche} ${platLabel} ${delLabel} is ${fmt(mid)} (Karat 2024 + industry data). You're undercharging by ${fmt(underBy)} per deal. If this is your first sponsor, start at ${fmt(low)}. Don't go below that just because they're a "small brand." sponsor brands have rate cards. They know what the market looks like.`,
      deltaFromMid,
      deltaDirection: "too_low",
    };
  }

  // ── NO — overpricing ──────────────────────────────────────────────────────
  const overBy = your_asking_rate - high;
  const timesOver = (your_asking_rate / mid).toFixed(1);

  return {
    verdict: "no",
    verdictHeadline: `${fmt(your_asking_rate)} is well above market. expect pushback.`,
    verdictReason: `The high end for a ${inputs.audienceSize} ${inputs.niche} ${platLabel} ${delLabel} is ${fmt(high)}. You're ${fmt(overBy)} over the top of the range (${timesOver}x the median). Brands will pass without responding. If you're getting consistent yeses at this rate, you have leverage we can't see here; keep going. Otherwise reset to ${fmt(Math.round((mid + high) / 2))}–${fmt(high)}.`,
    deltaFromMid,
    deltaDirection: "too_high",
  };
}
