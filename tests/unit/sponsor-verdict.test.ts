// Sponsor rate verdict tests — ALL FOUR paths must be covered:
//   yes / no (too low) / no (too high) / wait
// These are the high-stakes tests: wrong verdicts mislead creators.

import { computeSponsorRate } from "@/lib/sponsor";
import { describe, expect, it } from "vitest";

// ── Base inputs ───────────────────────────────────────────────────────────────

const base = {
  primary_platform: "youtube_long" as const,
  niche: "tech" as const,
  audience_size: "100k-1M" as const,
  avg_views_per_video: 200_000,
  deliverable_type: "integration" as const,
  your_asking_rate: 4_500,
  exclusivity_window_days: 0,
  usage_rights: "organic_only" as const,
};

// ── YES verdict ───────────────────────────────────────────────────────────────

describe("verdict: 'yes'", () => {
  it("returns 'yes' when asking rate is within market range", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 4_500, // market range 3500-5500
    });
    expect(result.verdict).toBe("yes");
  });

  it("verdictHeadline contains the asking rate for yes verdict", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 4_200,
    });
    expect(result.verdict).toBe("yes");
    expect(result.verdictHeadline).toMatch(/in market range|confidently quote/i);
  });

  it("returns 'yes' for asking rate exactly at market mid", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 4_200, // exact mid
    });
    expect(result.verdict).toBe("yes");
  });

  it("returns 'yes' for asking rate at market floor (no viral bonus)", () => {
    // Use avg_views < 30% of audience midpoint (500k) to avoid viral views multiplier
    const result = computeSponsorRate({
      ...base,
      avg_views_per_video: 100_000, // 100k < 150k (30% of 500k midpoint) → no viral bonus
      your_asking_rate: 3_500, // exact low of base range
    });
    expect(result.verdict).toBe("yes");
  });

  it("returns 'yes' for asking rate at market ceiling", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 5_500, // exact high
    });
    expect(result.verdict).toBe("yes");
  });

  it("deltaDirection is 'in_range' for yes verdict", () => {
    const result = computeSponsorRate({ ...base });
    expect(result.verdict).toBe("yes");
    expect(result.deltaDirection).toBe("in_range");
  });

  it("returns 'yes' for finance podcast with in-range rate", () => {
    const result = computeSponsorRate({
      primary_platform: "podcast",
      niche: "finance",
      audience_size: "10-100k",
      avg_views_per_video: 30_000,
      deliverable_type: "podcast_read",
      your_asking_rate: 1_500,
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
    });
    expect(result.verdict).toBe("yes");
  });

  it("multipliers shift the range — asking rate in ADJUSTED range is yes", () => {
    // Base rate 3500-5500, with 30-day exclusivity 1.2x = 4200-6600
    // Ask 6000 — outside base range but inside adjusted range
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 6_000,
      exclusivity_window_days: 30,
    });
    expect(result.verdict).toBe("yes");
    expect(result.marketHigh).toBeGreaterThan(5_500); // confirms multiplier applied
  });
});

// ── NO — underpricing ─────────────────────────────────────────────────────────

describe("verdict: 'no' (underpricing)", () => {
  it("returns 'no' when asking rate is well below market floor", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 1_200,
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictHeadline).toMatch(/way under|undercharging|leaving money/i);
  });

  it("deltaDirection is 'too_low' for underpricing", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 1_200,
    });
    expect(result.deltaDirection).toBe("too_low");
  });

  it("deltaFromMid is negative for underpricing", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 1_200,
    });
    expect(result.deltaFromMid).toBeLessThan(0);
  });

  it("marketMid is greater than asking rate for underpricing", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 500,
    });
    expect(result.marketMid).toBeGreaterThan(500);
  });

  it("verdict reason mentions the market median for underpricing", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 800,
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictReason).toMatch(/median|market/i);
  });
});

// ── NO — overpricing ──────────────────────────────────────────────────────────

describe("verdict: 'no' (overpricing)", () => {
  it("returns 'no' when asking rate is well above market ceiling", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 12_000,
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictHeadline).toMatch(/above market|expect pushback/i);
  });

  it("deltaDirection is 'too_high' for overpricing", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 15_000,
    });
    expect(result.deltaDirection).toBe("too_high");
  });

  it("deltaFromMid is positive for overpricing", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 12_000,
    });
    expect(result.deltaFromMid).toBeGreaterThan(0);
  });

  it("verdict reason mentions the market high for overpricing", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 20_000,
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictReason).toMatch(/high end|above|ceiling|over/i);
  });

  it("overpricing verdict suggests a reset range", () => {
    const result = computeSponsorRate({
      ...base,
      your_asking_rate: 25_000,
    });
    expect(result.verdictReason).toMatch(/reset|\$|range/i);
  });
});

// ── WAIT — thin data ─────────────────────────────────────────────────────────

describe("verdict: 'wait' (low data confidence)", () => {
  it("returns 'wait' for thin-data niche/platform intersection", () => {
    // Twitch food mention — no direct data, should be low confidence → wait
    const result = computeSponsorRate({
      primary_platform: "twitch",
      niche: "food",
      audience_size: "<10k",
      avg_views_per_video: 500,
      deliverable_type: "mention",
      your_asking_rate: 200,
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
    });
    expect(result.verdict).toBe("wait");
    expect(result.dataConfidence).toBe("low");
  });

  it("wait verdict headline mentions data confidence issue", () => {
    const result = computeSponsorRate({
      primary_platform: "twitch",
      niche: "food",
      audience_size: "<10k",
      avg_views_per_video: 500,
      deliverable_type: "mention",
      your_asking_rate: 200,
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
    });
    expect(result.verdict).toBe("wait");
    expect(result.verdictHeadline).toMatch(/not enough data|thin data|confidently/i);
  });

  it("wait verdict still provides a market range estimate", () => {
    const result = computeSponsorRate({
      primary_platform: "twitch",
      niche: "food",
      audience_size: "<10k",
      avg_views_per_video: 500,
      deliverable_type: "mention",
      your_asking_rate: 200,
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
    });
    expect(result.marketLow).toBeGreaterThan(0);
    expect(result.marketMid).toBeGreaterThan(0);
    expect(result.marketHigh).toBeGreaterThan(0);
  });

  it("X gaming with thin data returns wait", () => {
    const result = computeSponsorRate({
      primary_platform: "x",
      niche: "gaming",
      audience_size: "<10k",
      avg_views_per_video: 1_000,
      deliverable_type: "dedicated_video",
      your_asking_rate: 100,
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
    });
    // X gaming <10k dedicated_video — likely low confidence
    expect(result.dataConfidence).toBe("low");
    expect(result.verdict).toBe("wait");
  });
});

// ── Coverage gate (CI) ────────────────────────────────────────────────────────

describe("verdict coverage gate", () => {
  it("yes path reachable", () => {
    const r = computeSponsorRate({ ...base, your_asking_rate: 4_200 });
    expect(r.verdict).toBe("yes");
  });

  it("no (too low) path reachable", () => {
    const r = computeSponsorRate({ ...base, your_asking_rate: 500 });
    expect(r.verdict).toBe("no");
    expect(r.deltaDirection).toBe("too_low");
  });

  it("no (too high) path reachable", () => {
    const r = computeSponsorRate({ ...base, your_asking_rate: 50_000 });
    expect(r.verdict).toBe("no");
    expect(r.deltaDirection).toBe("too_high");
  });

  it("wait path reachable", () => {
    const r = computeSponsorRate({
      primary_platform: "twitch",
      niche: "food",
      audience_size: "<10k",
      avg_views_per_video: 500,
      deliverable_type: "mention",
      your_asking_rate: 100,
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
    });
    expect(r.verdict).toBe("wait");
  });
});

// ── Result structure ──────────────────────────────────────────────────────────

describe("result structure", () => {
  it("always returns marketLow < marketMid < marketHigh", () => {
    const combos = [
      { ...base, your_asking_rate: 4_200 },
      { ...base, your_asking_rate: 500, niche: "gaming" as const },
      {
        primary_platform: "tiktok" as const,
        niche: "beauty" as const,
        audience_size: "100k-1M" as const,
        avg_views_per_video: 150_000,
        deliverable_type: "integration" as const,
        your_asking_rate: 2_500,
        exclusivity_window_days: 0,
        usage_rights: "organic_only" as const,
      },
    ];
    for (const combo of combos) {
      const r = computeSponsorRate(combo);
      expect(r.marketLow).toBeLessThanOrEqual(r.marketMid);
      expect(r.marketMid).toBeLessThanOrEqual(r.marketHigh);
    }
  });

  it("always returns a non-empty source citation", () => {
    const result = computeSponsorRate({ ...base });
    expect(result.dataSource).toBeTruthy();
  });

  it("adjustments array is populated when exclusivity or rights applied", () => {
    const result = computeSponsorRate({
      ...base,
      exclusivity_window_days: 90,
      usage_rights: "brand_can_boost_paid",
    });
    expect(result.adjustments.length).toBeGreaterThan(0);
  });
});
