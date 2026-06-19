// Benchmark lookup — finds the best matching row in SPONSOR_RATE_BENCHMARKS.
// Falls back to nearest-neighbor interpolation when exact match doesn't exist.
// Returns dataConfidence: "low" when no direct data exists for the intersection.

import {
  SPONSOR_RATE_BENCHMARKS,
  type SponsorAudienceSize,
  type SponsorDeliverableType,
  type SponsorNiche,
  type SponsorPlatform,
  type SponsorRateBenchmark,
} from "@/data/sponsor_rate_benchmarks";

export interface BenchmarkLookupInput {
  platform: SponsorPlatform;
  niche: SponsorNiche;
  audienceSize: SponsorAudienceSize;
  deliverableType: SponsorDeliverableType;
}

export interface BenchmarkResult {
  rateLow: number;
  rateMid: number;
  rateHigh: number;
  source: string;
  dataConfidence: "high" | "medium" | "low";
  matchType: "exact" | "adjacent_deliverable" | "adjacent_niche" | "interpolated";
}

// Deliverable fallback order — if exact deliverable not found, try these in order
const DELIVERABLE_FALLBACK: Record<SponsorDeliverableType, SponsorDeliverableType[]> = {
  integration: ["dedicated_video", "mention", "feed_post"],
  dedicated_video: ["integration", "feed_post"],
  mention: ["integration", "story_post", "feed_post"],
  story_post: ["mention", "feed_post", "integration"],
  feed_post: ["story_post", "integration", "mention"],
  podcast_read: ["integration", "mention"],
  multi_deliverable: ["integration", "dedicated_video"],
};

// Niche fallback — if exact niche not found, try semantically closest
const NICHE_FALLBACK: Record<SponsorNiche, SponsorNiche[]> = {
  tech: ["education", "finance", "other"],
  finance: ["education", "tech", "other"],
  gaming: ["tech", "lifestyle", "other"],
  beauty: ["lifestyle", "fitness", "other"],
  lifestyle: ["beauty", "fitness", "food", "other"],
  education: ["tech", "finance", "other"],
  food: ["lifestyle", "fitness", "other"],
  fitness: ["lifestyle", "beauty", "other"],
  other: ["lifestyle", "education", "gaming"],
};

// Deliverable type multiplier (relative to integration = 1.0)
// Used to scale values when falling back to adjacent deliverable
const DELIVERABLE_MULTIPLIER: Record<SponsorDeliverableType, number> = {
  dedicated_video: 2.5,
  integration: 1.0,
  mention: 0.35,
  story_post: 0.3,
  feed_post: 0.6,
  podcast_read: 1.0, // platform-specific, treat as integration
  multi_deliverable: 1.8,
};

function applyDeliverableScale(
  base: SponsorRateBenchmark,
  targetDeliverable: SponsorDeliverableType,
): BenchmarkResult {
  const sourceMultiplier = DELIVERABLE_MULTIPLIER[base.deliverableType];
  const targetMultiplier = DELIVERABLE_MULTIPLIER[targetDeliverable];
  const scale = targetMultiplier / sourceMultiplier;

  return {
    rateLow: Math.round(base.rateLow * scale),
    rateMid: Math.round(base.rateMid * scale),
    rateHigh: Math.round(base.rateHigh * scale),
    source: base.source,
    dataConfidence: "low", // always low when we're scaling
    matchType: "adjacent_deliverable",
  };
}

export function lookupBenchmark(input: BenchmarkLookupInput): BenchmarkResult {
  const { platform, niche, audienceSize, deliverableType } = input;

  // 1. Exact match
  const exact = SPONSOR_RATE_BENCHMARKS.find(
    (b) =>
      b.platform === platform &&
      b.niche === niche &&
      b.audienceSize === audienceSize &&
      b.deliverableType === deliverableType,
  );
  if (exact) {
    return {
      rateLow: exact.rateLow,
      rateMid: exact.rateMid,
      rateHigh: exact.rateHigh,
      source: exact.source,
      dataConfidence: exact.dataConfidence,
      matchType: "exact",
    };
  }

  // 2. Same platform + niche + audience, adjacent deliverable
  const fallbackDeliverables = DELIVERABLE_FALLBACK[deliverableType];
  for (const fallbackDeliverable of fallbackDeliverables) {
    const row = SPONSOR_RATE_BENCHMARKS.find(
      (b) =>
        b.platform === platform &&
        b.niche === niche &&
        b.audienceSize === audienceSize &&
        b.deliverableType === fallbackDeliverable,
    );
    if (row) {
      return applyDeliverableScale(row, deliverableType);
    }
  }

  // 3. Same platform + audience + deliverable, adjacent niche
  const fallbackNiches = NICHE_FALLBACK[niche];
  for (const fallbackNiche of fallbackNiches) {
    const row = SPONSOR_RATE_BENCHMARKS.find(
      (b) =>
        b.platform === platform &&
        b.niche === fallbackNiche &&
        b.audienceSize === audienceSize &&
        b.deliverableType === deliverableType,
    );
    if (row) {
      return {
        rateLow: row.rateLow,
        rateMid: row.rateMid,
        rateHigh: row.rateHigh,
        source: row.source,
        dataConfidence: "low",
        matchType: "adjacent_niche",
      };
    }
  }

  // 4. Same platform + audience, any deliverable, any niche fallback — scale both
  for (const fallbackNiche of fallbackNiches) {
    for (const fallbackDeliverable of fallbackDeliverables) {
      const row = SPONSOR_RATE_BENCHMARKS.find(
        (b) =>
          b.platform === platform &&
          b.niche === fallbackNiche &&
          b.audienceSize === audienceSize &&
          b.deliverableType === fallbackDeliverable,
      );
      if (row) {
        const scaled = applyDeliverableScale(row, deliverableType);
        return { ...scaled, dataConfidence: "low", matchType: "interpolated" };
      }
    }
  }

  // 5. Complete fallback — minimal floor rates for the audience tier
  // Only reached for very unusual combinations (e.g., Twitch food podcast_read)
  const AUDIENCE_FLOOR: Record<SponsorAudienceSize, { low: number; mid: number; high: number }> = {
    "<10k": { low: 50, mid: 150, high: 400 },
    "10-100k": { low: 150, mid: 500, high: 1_500 },
    "100k-1M": { low: 500, mid: 1_500, high: 4_000 },
    "1M+": { low: 2_000, mid: 6_000, high: 15_000 },
  };
  const floor = AUDIENCE_FLOOR[audienceSize];
  const multiplier = DELIVERABLE_MULTIPLIER[deliverableType];
  const baseMultiplier = 1.0; // integration base

  return {
    rateLow: Math.round(floor.low * (multiplier / baseMultiplier)),
    rateMid: Math.round(floor.mid * (multiplier / baseMultiplier)),
    rateHigh: Math.round(floor.high * (multiplier / baseMultiplier)),
    source: "floor estimate (no matching data for this combination)",
    dataConfidence: "low",
    matchType: "interpolated",
  };
}
