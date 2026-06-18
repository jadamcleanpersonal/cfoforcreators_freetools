// Sponsor rate calculator — orchestrator.
// lookup → adjust → verdict → result
// Pure function, no React, no I/O.

import type {
  SponsorAudienceSize,
  SponsorDeliverableType,
  SponsorNiche,
  SponsorPlatform,
} from "@/data/sponsor_rate_benchmarks";
import { lookupBenchmark } from "./benchmark_lookup";
import { type AdjustedRange, type UsageRights, applyMultipliers } from "./multipliers";
import { type VerdictResult, rateVerdict } from "./verdict";

export interface SponsorRateInputs {
  primary_platform: SponsorPlatform;
  niche: SponsorNiche;
  audience_size: SponsorAudienceSize;
  avg_views_per_video: number;
  engagement_rate_pct?: number;
  deliverable_type: SponsorDeliverableType;
  your_asking_rate: number;
  exclusivity_window_days: number;
  usage_rights: UsageRights;
}

export interface SponsorRateResult extends VerdictResult {
  // Market range (after multipliers)
  marketLow: number;
  marketMid: number;
  marketHigh: number;
  // Source citation
  dataSource: string;
  dataConfidence: "high" | "medium" | "low";
  matchType: "exact" | "adjacent_deliverable" | "adjacent_niche" | "interpolated";
  // Adjustments applied
  adjustments: AdjustedRange["adjustments"];
  // The user's asking rate (echoed for display)
  your_asking_rate: number;
}

export function computeSponsorRate(inputs: SponsorRateInputs): SponsorRateResult {
  // ── Step 1: Benchmark lookup ─────────────────────────────────────────────
  const benchmark = lookupBenchmark({
    platform: inputs.primary_platform,
    niche: inputs.niche,
    audienceSize: inputs.audience_size,
    deliverableType: inputs.deliverable_type,
  });

  // ── Step 2: Apply multipliers ────────────────────────────────────────────
  const adjusted = applyMultipliers(
    {
      rateLow: benchmark.rateLow,
      rateMid: benchmark.rateMid,
      rateHigh: benchmark.rateHigh,
    },
    {
      exclusivity_window_days: inputs.exclusivity_window_days,
      usage_rights: inputs.usage_rights,
      engagement_rate_pct: inputs.engagement_rate_pct,
      avg_views_per_video: inputs.avg_views_per_video,
      audience_size: inputs.audience_size,
    },
  );

  // ── Step 3: Verdict ──────────────────────────────────────────────────────
  const verdictResult = rateVerdict(
    {
      your_asking_rate: inputs.your_asking_rate,
      niche: inputs.niche,
      platform: inputs.primary_platform,
      audienceSize: inputs.audience_size,
      deliverableType: inputs.deliverable_type,
    },
    adjusted,
    benchmark.dataConfidence,
  );

  return {
    ...verdictResult,
    marketLow: adjusted.low,
    marketMid: adjusted.mid,
    marketHigh: adjusted.high,
    dataSource: benchmark.source,
    dataConfidence: benchmark.dataConfidence,
    matchType: benchmark.matchType,
    adjustments: adjusted.adjustments,
    your_asking_rate: inputs.your_asking_rate,
  };
}
