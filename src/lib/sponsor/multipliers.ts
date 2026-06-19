// Sponsor rate multipliers — exclusivity, usage rights, and engagement adjustments.
// Applied AFTER the base benchmark lookup.
// All multipliers stack multiplicatively (not additively).

export type UsageRights = "organic_only" | "brand_can_boost_paid" | "brand_owns_perpetual";

export interface MultiplierInputs {
  exclusivity_window_days: number;
  usage_rights: UsageRights;
  engagement_rate_pct?: number;
  avg_views_per_video: number;
  audience_size: "<10k" | "10-100k" | "100k-1M" | "1M+";
}

export interface AdjustedRange {
  low: number;
  mid: number;
  high: number;
  /** Human-readable list of applied adjustments for display */
  adjustments: { label: string; multiplier: number; impact: string }[];
}

// Audience size midpoint estimates for viral-content bonus calculation
const AUDIENCE_MIDPOINT: Record<string, number> = {
  "<10k": 5_000,
  "10-100k": 50_000,
  "100k-1M": 500_000,
  "1M+": 3_000_000,
};

export function applyMultipliers(
  baseRange: { rateLow: number; rateMid: number; rateHigh: number },
  inputs: MultiplierInputs,
): AdjustedRange {
  let multiplier = 1.0;
  const adjustments: AdjustedRange["adjustments"] = [];

  // ── Exclusivity window ────────────────────────────────────────────────────
  if (inputs.exclusivity_window_days >= 90) {
    const exclusivityMultiplier = 1.5;
    multiplier *= exclusivityMultiplier;
    adjustments.push({
      label: "90-day exclusivity window",
      multiplier: exclusivityMultiplier,
      impact: "+50%. brands pay a premium to lock out competitors for 90 days",
    });
  } else if (inputs.exclusivity_window_days >= 30) {
    const exclusivityMultiplier = 1.2;
    multiplier *= exclusivityMultiplier;
    adjustments.push({
      label: "30-day exclusivity window",
      multiplier: exclusivityMultiplier,
      impact: "+20%. 30-day exclusivity is standard for most brand deals",
    });
  }

  // ── Usage rights ─────────────────────────────────────────────────────────
  if (inputs.usage_rights === "brand_owns_perpetual") {
    const rightsMultiplier = 2.5;
    multiplier *= rightsMultiplier;
    adjustments.push({
      label: "perpetual usage rights",
      multiplier: rightsMultiplier,
      impact: "+150%. the brand owns the content forever and can run it as an ad indefinitely",
    });
  } else if (inputs.usage_rights === "brand_can_boost_paid") {
    const rightsMultiplier = 1.4;
    multiplier *= rightsMultiplier;
    adjustments.push({
      label: "paid amplification rights",
      multiplier: rightsMultiplier,
      impact: "+40%. the brand can boost your content as a paid ad",
    });
  }
  // organic_only = base rate, no adjustment

  // ── Engagement bonus ─────────────────────────────────────────────────────
  // Stacks: very high engagement gets both bonuses
  if (inputs.engagement_rate_pct !== undefined) {
    if (inputs.engagement_rate_pct > 15) {
      const engagementMultiplier = 1.3;
      multiplier *= engagementMultiplier;
      adjustments.push({
        label: `${inputs.engagement_rate_pct}% engagement rate (exceptional)`,
        multiplier: engagementMultiplier,
        impact: "+30%. engagement above 15% is a strong signal brands pay premium for",
      });
    } else if (inputs.engagement_rate_pct > 8) {
      const engagementMultiplier = 1.15;
      multiplier *= engagementMultiplier;
      adjustments.push({
        label: `${inputs.engagement_rate_pct}% engagement rate (above average)`,
        multiplier: engagementMultiplier,
        impact: "+15%. engagement above 8% is above the platform average",
      });
    }
    // Below 8% = no bonus (expected baseline)
  }

  // ── Views vs audience size (viral content signal) ─────────────────────────
  // If avg views/episode is > 30% of audience midpoint, content is punching
  // above its weight — a strong buying signal for sponsors.
  const audienceMidpoint = AUDIENCE_MIDPOINT[inputs.audience_size] ?? 50_000;
  const viewsToAudienceRatio = inputs.avg_views_per_video / audienceMidpoint;
  if (viewsToAudienceRatio > 0.3 && inputs.engagement_rate_pct === undefined) {
    // Only apply this bonus if they didn't provide engagement rate
    // (engagement rate is a better signal when available)
    const viralMultiplier = 1.1;
    multiplier *= viralMultiplier;
    adjustments.push({
      label: "high views-to-subscriber ratio",
      multiplier: viralMultiplier,
      impact: "+10%. your average views suggest strong algorithmic reach",
    });
  }

  return {
    low: Math.round(baseRange.rateLow * multiplier),
    mid: Math.round(baseRange.rateMid * multiplier),
    high: Math.round(baseRange.rateHigh * multiplier),
    adjustments,
  };
}
