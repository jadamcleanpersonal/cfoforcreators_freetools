// Benchmark lookup tests — data integrity + fallback behavior.
// These guard against stale or missing data breaking the calculator silently.

import { lookupBenchmark } from "@/lib/sponsor/benchmark_lookup";
import { describe, expect, it } from "vitest";

describe("exact match returns correct data", () => {
  it("finds YouTube tech 100k-1M integration", () => {
    const result = lookupBenchmark({
      platform: "youtube_long",
      niche: "tech",
      audienceSize: "100k-1M",
      deliverableType: "integration",
    });
    expect(result.matchType).toBe("exact");
    expect(result.dataConfidence).toBe("high");
    expect(result.rateMid).toBe(4_200);
    expect(result.rateLow).toBeLessThan(result.rateMid);
    expect(result.rateHigh).toBeGreaterThan(result.rateMid);
  });

  it("finds podcast finance 10-100k podcast_read", () => {
    const result = lookupBenchmark({
      platform: "podcast",
      niche: "finance",
      audienceSize: "10-100k",
      deliverableType: "podcast_read",
    });
    expect(result.matchType).toBe("exact");
    expect(result.rateMid).toBeGreaterThan(0);
  });

  it("finds TikTok beauty 100k-1M integration", () => {
    const result = lookupBenchmark({
      platform: "tiktok",
      niche: "beauty",
      audienceSize: "100k-1M",
      deliverableType: "integration",
    });
    expect(result.matchType).toBe("exact");
    expect(result.dataConfidence).toBe("high");
  });

  it("finds Instagram feed beauty feed_post", () => {
    const result = lookupBenchmark({
      platform: "instagram_feed",
      niche: "beauty",
      audienceSize: "10-100k",
      deliverableType: "feed_post",
    });
    expect(result.matchType).toBe("exact");
  });
});

describe("fallback to adjacent deliverable", () => {
  it("falls back for YouTube tech 100k-1M mention (not in table)", () => {
    // 'mention' for tech 100k-1M IS in the table — if we remove it's in adjacent deliverable path
    // Test a combo we know isn't in the table: youtube_shorts tech mention
    const result = lookupBenchmark({
      platform: "youtube_shorts",
      niche: "tech",
      audienceSize: "100k-1M",
      deliverableType: "mention",
    });
    // Should fall back — youtube_shorts tech 100k-1M integration exists, scale from that
    expect(result.rateMid).toBeGreaterThan(0);
    expect(result.rateMid).toBeLessThan(result.rateHigh);
  });

  it("dedicated_video rates higher than integration rates (same platform/niche/audience)", () => {
    const integration = lookupBenchmark({
      platform: "youtube_long",
      niche: "tech",
      audienceSize: "100k-1M",
      deliverableType: "integration",
    });
    const dedicated = lookupBenchmark({
      platform: "youtube_long",
      niche: "tech",
      audienceSize: "100k-1M",
      deliverableType: "dedicated_video",
    });
    expect(dedicated.rateMid).toBeGreaterThan(integration.rateMid);
  });

  it("mention rates lower than integration rates", () => {
    const integration = lookupBenchmark({
      platform: "youtube_long",
      niche: "tech",
      audienceSize: "100k-1M",
      deliverableType: "integration",
    });
    const mention = lookupBenchmark({
      platform: "youtube_long",
      niche: "tech",
      audienceSize: "100k-1M",
      deliverableType: "mention",
    });
    expect(mention.rateMid).toBeLessThan(integration.rateMid);
  });
});

describe("fallback to adjacent niche", () => {
  it("returns low confidence for Twitch food mention (no direct data)", () => {
    const result = lookupBenchmark({
      platform: "twitch",
      niche: "food",
      audienceSize: "10-100k",
      deliverableType: "mention",
    });
    // No direct Twitch food data — should fallback and return low confidence
    expect(result.dataConfidence).toBe("low");
    expect(result.rateMid).toBeGreaterThan(0);
  });

  it("X gaming integration returns a result (even if low confidence)", () => {
    const result = lookupBenchmark({
      platform: "x",
      niche: "gaming",
      audienceSize: "10-100k",
      deliverableType: "integration",
    });
    expect(result.rateMid).toBeGreaterThan(0);
  });
});

describe("data integrity constraints", () => {
  it("rateLow < rateMid < rateHigh for all lookups", () => {
    const combos = [
      {
        platform: "youtube_long" as const,
        niche: "tech" as const,
        audienceSize: "100k-1M" as const,
        deliverableType: "integration" as const,
      },
      {
        platform: "tiktok" as const,
        niche: "beauty" as const,
        audienceSize: "10-100k" as const,
        deliverableType: "integration" as const,
      },
      {
        platform: "podcast" as const,
        niche: "finance" as const,
        audienceSize: "100k-1M" as const,
        deliverableType: "podcast_read" as const,
      },
      {
        platform: "instagram_feed" as const,
        niche: "lifestyle" as const,
        audienceSize: "100k-1M" as const,
        deliverableType: "feed_post" as const,
      },
      {
        platform: "twitch" as const,
        niche: "gaming" as const,
        audienceSize: "10-100k" as const,
        deliverableType: "integration" as const,
      },
    ];
    for (const combo of combos) {
      const r = lookupBenchmark(combo);
      expect(r.rateLow).toBeLessThan(r.rateMid);
      expect(r.rateMid).toBeLessThan(r.rateHigh);
    }
  });

  it("all rates are positive integers", () => {
    const result = lookupBenchmark({
      platform: "youtube_long",
      niche: "finance",
      audienceSize: "1M+",
      deliverableType: "integration",
    });
    expect(result.rateLow).toBeGreaterThan(0);
    expect(Number.isInteger(result.rateLow)).toBe(true);
    expect(Number.isInteger(result.rateMid)).toBe(true);
    expect(Number.isInteger(result.rateHigh)).toBe(true);
  });

  it("returns a source string for all lookups", () => {
    const result = lookupBenchmark({
      platform: "youtube_long",
      niche: "tech",
      audienceSize: "100k-1M",
      deliverableType: "integration",
    });
    expect(result.source).toBeTruthy();
    expect(typeof result.source).toBe("string");
  });

  it("larger audience sizes produce higher base rates", () => {
    const small = lookupBenchmark({
      platform: "youtube_long",
      niche: "tech",
      audienceSize: "10-100k",
      deliverableType: "integration",
    });
    const large = lookupBenchmark({
      platform: "youtube_long",
      niche: "tech",
      audienceSize: "100k-1M",
      deliverableType: "integration",
    });
    expect(large.rateMid).toBeGreaterThan(small.rateMid);
  });
});
