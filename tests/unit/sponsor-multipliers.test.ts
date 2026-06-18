// Multiplier tests — exclusivity, usage rights, engagement adjustments.
// Multipliers are stackable; test each independently and combined.

import { applyMultipliers } from "@/lib/sponsor/multipliers";
import { describe, expect, it } from "vitest";

const baseRange = { rateLow: 1_000, rateMid: 2_000, rateHigh: 4_000 };

describe("no adjustments", () => {
  it("returns base range unchanged when no multipliers apply", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(2_000);
    expect(result.low).toBe(1_000);
    expect(result.high).toBe(4_000);
    expect(result.adjustments).toHaveLength(0);
  });
});

describe("exclusivity multipliers", () => {
  it("applies 1.2x for 30-day exclusivity", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 30,
      usage_rights: "organic_only",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(2_400); // 2000 * 1.2
    expect(result.adjustments).toHaveLength(1);
    expect(result.adjustments[0].multiplier).toBe(1.2);
  });

  it("applies 1.5x for 90-day exclusivity", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 90,
      usage_rights: "organic_only",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(3_000); // 2000 * 1.5
    expect(result.adjustments[0].multiplier).toBe(1.5);
  });

  it("uses 1.5x for 180-day exclusivity (same as 90+)", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 180,
      usage_rights: "organic_only",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(3_000);
  });

  it("no exclusivity multiplier for 0 days", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(2_000);
  });

  it("no exclusivity multiplier for 15 days (below 30-day threshold)", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 15,
      usage_rights: "organic_only",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(2_000);
    expect(result.adjustments).toHaveLength(0);
  });
});

describe("usage rights multipliers", () => {
  it("applies 1.4x for paid amplification rights", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 0,
      usage_rights: "brand_can_boost_paid",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(2_800); // 2000 * 1.4
    expect(result.adjustments[0].multiplier).toBe(1.4);
  });

  it("applies 2.5x for perpetual rights", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 0,
      usage_rights: "brand_owns_perpetual",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(5_000); // 2000 * 2.5
    expect(result.adjustments[0].multiplier).toBe(2.5);
  });

  it("organic_only has no rights adjustment", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.adjustments).toHaveLength(0);
  });
});

describe("engagement rate bonuses", () => {
  it("applies 1.15x for 9% engagement (above-average)", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
      engagement_rate_pct: 9,
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(2_300); // 2000 * 1.15
    expect(result.adjustments.some((a) => a.multiplier === 1.15)).toBe(true);
  });

  it("applies 1.3x for 20% engagement (exceptional)", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
      engagement_rate_pct: 20,
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    // 1.15 * 1.3 = 1.495, but 20% > 15% applies BOTH bonuses
    expect(result.mid).toBeGreaterThan(2_000);
  });

  it("no engagement bonus for 5% (below threshold)", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
      engagement_rate_pct: 5,
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(2_000);
    expect(result.adjustments).toHaveLength(0);
  });

  it("no engagement bonus when engagement_rate_pct is undefined", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    expect(result.mid).toBe(2_000);
  });
});

describe("multipliers stack correctly", () => {
  it("90-day exclusivity + perpetual rights stacks to 3.75x", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 90,
      usage_rights: "brand_owns_perpetual",
      avg_views_per_video: 50_000,
      audience_size: "100k-1M",
    });
    // 1.5 * 2.5 = 3.75
    expect(result.mid).toBe(7_500); // 2000 * 3.75
    expect(result.adjustments).toHaveLength(2);
  });

  it("all values remain positive after any combination", () => {
    const result = applyMultipliers(baseRange, {
      exclusivity_window_days: 90,
      usage_rights: "brand_owns_perpetual",
      engagement_rate_pct: 18,
      avg_views_per_video: 200_000,
      audience_size: "100k-1M",
    });
    expect(result.low).toBeGreaterThan(0);
    expect(result.mid).toBeGreaterThan(0);
    expect(result.high).toBeGreaterThan(0);
  });

  it("returns integer values", () => {
    const result = applyMultipliers(
      { rateLow: 333, rateMid: 999, rateHigh: 3_333 },
      {
        exclusivity_window_days: 30,
        usage_rights: "brand_can_boost_paid",
        avg_views_per_video: 50_000,
        audience_size: "10-100k",
      },
    );
    expect(Number.isInteger(result.low)).toBe(true);
    expect(Number.isInteger(result.mid)).toBe(true);
    expect(Number.isInteger(result.high)).toBe(true);
  });
});
