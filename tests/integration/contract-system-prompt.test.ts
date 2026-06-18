// Integration tests for the contract scanner system prompt.
// Five fake contracts with known clause patterns — mocked Anthropic responses.
// Verifies parser produces the correct structured output for each scenario.

import { parseFullResponse } from "@/lib/contract/parse_response";
import type { ScanEvent, ScanResult } from "@/lib/contract/types";
import { describe, expect, it } from "vitest";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildNdjson(
  verdict: ScanResult["verdict"],
  verdictHeadline: string,
  verdictReason: string,
  flags: Array<{
    category: "risky" | "unusual" | "fine";
    quote: string;
    explanation: string;
    suggestedAction?: string;
  }>,
  summary: string,
): string {
  const lines: string[] = [
    JSON.stringify({ type: "verdict", verdict, verdictHeadline, verdictReason }),
    ...flags.map((f) => JSON.stringify({ type: "flag", ...f })),
    JSON.stringify({ type: "summary", text: summary }),
  ];
  return lines.join("\n");
}

function parsedToResult(events: ScanEvent[]): Partial<ScanResult> & { verdict?: ScanResult["verdict"] } {
  let verdict: ScanResult["verdict"] | undefined;
  let verdictHeadline = "";
  let verdictReason = "";
  const flaggedClauses: ScanResult["flaggedClauses"] = [];
  let summary = "";

  for (const e of events) {
    if (e.type === "verdict") {
      verdict = e.verdict;
      verdictHeadline = e.verdictHeadline;
      verdictReason = e.verdictReason;
    } else if (e.type === "flag") {
      flaggedClauses.push({
        category: e.category,
        quote: e.quote,
        explanation: e.explanation,
        suggestedAction: e.suggestedAction,
      });
    } else if (e.type === "summary") {
      summary = e.text;
    }
  }

  return { verdict, verdictHeadline, verdictReason, flaggedClauses, summary };
}

// ── Test contracts ────────────────────────────────────────────────────────────

// Contract 1: Standard YouTube integration — should verdict YES
const STANDARD_YOUTUBE_RESPONSE = buildNdjson(
  "yes",
  "Looks fine. Standard terms.",
  "Standard payment terms (Net 30), organic-only usage rights for 6 months, and no exclusivity beyond the specific product category. A couple of things worth knowing about in the details below, but nothing that should block signing.",
  [
    {
      category: "fine",
      quote: "Brand shall pay Creator within thirty (30) days of Creator's invoice",
      explanation: "Net-30 payment terms. Standard for the industry — this is what you want.",
    },
    {
      category: "fine",
      quote: "Brand may use the Integration in paid social media advertising for up to 6 months following publication",
      explanation: "6-month brand boost rights. Industry standard for YouTube integrations. After 6 months the paid usage rights expire.",
    },
    {
      category: "unusual",
      quote: "Creator agrees not to promote any competing skincare brand for 30 days following publication",
      explanation: "30-day narrow exclusivity for the skincare category. Short window, specific category — this is on the more acceptable end, but check if your rate accounts for it.",
    },
  ],
  "Clean contract. Standard YouTube integration terms. The 30-day exclusivity is narrow and the rate should reflect it, but there are no dealbreakers here.",
);

// Contract 2: Perpetual rights grab — should verdict NO
const PERPETUAL_RIGHTS_RESPONSE = buildNdjson(
  "no",
  "Don't sign. They want perpetual rights without paying for them.",
  "Clause 7 grants the brand a perpetual worldwide license to all content — that's a 2-3x rate premium they're not offering. Two other serious issues flagged below.",
  [
    {
      category: "risky",
      quote: "Creator hereby grants Brand a perpetual, irrevocable, worldwide, royalty-free license to reproduce, distribute, display, and create derivative works from the Content",
      explanation: "This grants the brand unlimited rights to your content forever without additional payment. Standard organic-only deals grant 6-12 months of usage rights. Perpetual rights are worth 2-3x the rate.",
      suggestedAction: "Negotiate to organic-only rights (no paid amplification) or add a perpetual rights premium of 2-3x your base rate explicitly in the contract.",
    },
    {
      category: "risky",
      quote: "Creator shall not promote, endorse, or mention any brand in the beauty, skincare, wellness, or personal care industries for a period of 18 months",
      explanation: "Exclusivity over the entire beauty industry for 18 months. This is extremely broad — it would block you from any other brand deals in adjacent categories for a year and a half.",
      suggestedAction: "Push back to narrow the exclusivity to just their specific brand or product line, not the entire category. If they insist on category exclusivity, 18 months is too long — ask for 90 days.",
    },
    {
      category: "fine",
      quote: "Payment due within thirty (30) days of invoice",
      explanation: "Standard Net-30 payment terms.",
    },
  ],
  "Three serious issues: perpetual rights without compensation, overly broad exclusivity, and a vague approval clause. Do not sign as-is. Negotiate clause 7 (rights) and clause 9 (exclusivity) before proceeding.",
);

// Contract 3: Broad exclusivity — should verdict NO
const BROAD_EXCLUSIVITY_RESPONSE = buildNdjson(
  "no",
  "Don't sign. The exclusivity clause covers your whole niche.",
  "The exclusivity window covers the entire gaming category for 12 months — that's effectively blocking all other brand deals for a year at a single-deal rate.",
  [
    {
      category: "risky",
      quote: "Creator agrees not to work with, promote, or accept payment from any brand in the gaming hardware, gaming peripherals, gaming software, or esports industry for twelve (12) months",
      explanation: "This exclusivity is far too broad. It covers an entire industry segment for a year, not just competing brands. A gaming hardware creator's entire income stream is in this category.",
      suggestedAction: "Counter-propose: exclusivity limited to direct competitors (e.g., 'gaming mice manufacturers' not all gaming brands) for 60-90 days only. If they want 12-month broad exclusivity, the rate should be 10-20x higher to compensate for lost opportunities.",
    },
    {
      category: "fine",
      quote: "Creator shall deliver one (1) dedicated integration video per the creative brief",
      explanation: "One dedicated video delivery. Standard deliverable scope.",
    },
    {
      category: "fine",
      quote: "Brand shall remit payment within forty-five (45) days of invoice",
      explanation: "Net-45 payment terms. Slightly longer than ideal Net-30 but common for larger brands.",
    },
  ],
  "The exclusivity clause is the dealbreaker here. Everything else is standard. Focus negotiation on narrowing the exclusivity scope and duration before signing.",
);

// Contract 4: Negotiable issues — Net 60 + narrow exclusivity + no kill fee — verdict WAIT
const NEGOTIABLE_ISSUES_RESPONSE = buildNdjson(
  "wait",
  "Negotiate these three clauses first.",
  "Three things to push back on: Net-60 payment terms, 90-day category exclusivity at no additional rate, and no kill fee. None are dealbreakers — all three are normal asks.",
  [
    {
      category: "risky",
      quote: "Brand shall remit payment within sixty (60) days of Creator's invoice",
      explanation: "Net-60 is longer than industry standard. Most creators invoice at Net-30. At Net-60 you're effectively extending the brand a 2-month interest-free loan.",
      suggestedAction: "Push for Net-30. If they push back, accept Net-45 as a compromise. Add a late payment fee (1.5% per month) for anything beyond the agreed window.",
    },
    {
      category: "risky",
      quote: "Creator shall not work with any competing brand in the personal finance, investing, or fintech category for ninety (90) days",
      explanation: "90-day category exclusivity. Fixable, but only if your rate accounts for it. If the rate doesn't include an exclusivity premium, this is effectively a discount you're giving them.",
      suggestedAction: "Either add an exclusivity premium to the rate (typically 15-25% of the base rate) or push to narrow 'personal finance category' to their specific product type only.",
    },
    {
      category: "risky",
      quote: "Brand may cancel this Agreement at any time for any reason. No compensation shall be owed to Creator for work not yet delivered.",
      explanation: "No kill fee clause. If the brand cancels after you've started creating, you get nothing. This is common but worth negotiating — especially if you're turning down other work.",
      suggestedAction: "Ask for a 50% kill fee if cancelled after brief approval, 100% if cancelled after first draft. This is a standard ask and most brands will accept it.",
    },
  ],
  "Three fixable issues. Push back on payment terms, get an exclusivity premium, and add a kill fee. All of these are normal negotiation asks and shouldn't kill the deal.",
);

// Contract 5: Mixed risky + fixable — should verdict NO (risky dominates)
const MULTI_ISSUE_RESPONSE = buildNdjson(
  "no",
  "Don't sign. There's a serious rights issue plus things to negotiate.",
  "The perpetual IP transfer in clause 5 is a dealbreaker on its own. The payment terms and exclusivity are also worth fixing, but the rights issue must be addressed first.",
  [
    {
      category: "risky",
      quote: "Creator assigns to Brand all right, title, and interest in and to the Content, including all intellectual property rights",
      explanation: "This is an outright IP transfer — not a license, but an assignment. You would no longer own the content you created. This is much more severe than a usage license.",
      suggestedAction: "This should be a license, not an assignment. Strike 'assigns' and replace with 'grants Brand a non-exclusive license' with specified scope and duration.",
    },
    {
      category: "risky",
      quote: "Creator agrees to indemnify, defend, and hold harmless Brand against any and all claims arising from the Content",
      explanation: "One-sided indemnification. You're responsible for any claims from the content but the brand has no reciprocal obligation. Standard contracts have mutual indemnification.",
      suggestedAction: "Request mutual indemnification — each party indemnifies the other for their own actions. This is standard in well-drafted agreements.",
    },
    {
      category: "risky",
      quote: "Payment shall be made within ninety (90) days of Brand's approval of the Content",
      explanation: "Net-90 is extreme. This also starts the clock from brand approval, not from your invoice date — they can delay approval indefinitely to delay payment.",
      suggestedAction: "Push for Net-30 from invoice date, not from approval. Add explicit approval deadlines (e.g., brand must approve or request revisions within 14 days of delivery).",
    },
    {
      category: "fine",
      quote: "Creator shall deliver content in accordance with Brand's creative brief",
      explanation: "Standard creative brief compliance clause. Normal.",
    },
  ],
  "Multiple dealbreakers: IP assignment (not a license), one-sided indemnification, and extreme payment terms. This contract needs significant revision before signing.",
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Contract 1: Standard YouTube integration", () => {
  const events = parseFullResponse(STANDARD_YOUTUBE_RESPONSE);
  const result = parsedToResult(events);

  it("produces verdict YES", () => {
    expect(result.verdict).toBe("yes");
  });

  it("has a non-empty verdictHeadline and verdictReason", () => {
    expect(result.verdictHeadline).toBeTruthy();
    expect(result.verdictReason).toBeTruthy();
  });

  it("has only fine/unusual flags (no risky)", () => {
    const risky = result.flaggedClauses?.filter((c) => c.category === "risky");
    expect(risky?.length).toBe(0);
  });

  it("has at least 2 flagged clauses", () => {
    expect(result.flaggedClauses?.length).toBeGreaterThanOrEqual(2);
  });

  it("has a summary", () => {
    expect(result.summary).toBeTruthy();
  });
});

describe("Contract 2: Perpetual rights grab", () => {
  const events = parseFullResponse(PERPETUAL_RIGHTS_RESPONSE);
  const result = parsedToResult(events);

  it("produces verdict NO", () => {
    expect(result.verdict).toBe("no");
  });

  it("has at least one risky flag", () => {
    const risky = result.flaggedClauses?.filter((c) => c.category === "risky");
    expect(risky?.length).toBeGreaterThanOrEqual(1);
  });

  it("the risky flag quotes the perpetual license clause", () => {
    const risky = result.flaggedClauses?.find((c) => c.category === "risky");
    expect(risky?.quote.toLowerCase()).toContain("perpetual");
  });

  it("the risky flag has a suggestedAction", () => {
    const risky = result.flaggedClauses?.find((c) => c.category === "risky");
    expect(risky?.suggestedAction).toBeTruthy();
  });
});

describe("Contract 3: Broad exclusivity", () => {
  const events = parseFullResponse(BROAD_EXCLUSIVITY_RESPONSE);
  const result = parsedToResult(events);

  it("produces verdict NO", () => {
    expect(result.verdict).toBe("no");
  });

  it("flags the exclusivity clause as risky", () => {
    const risky = result.flaggedClauses?.filter((c) => c.category === "risky");
    expect(risky?.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Contract 4: Negotiable issues (Net 60 + narrow exclusivity + no kill fee)", () => {
  const events = parseFullResponse(NEGOTIABLE_ISSUES_RESPONSE);
  const result = parsedToResult(events);

  it("produces verdict WAIT", () => {
    expect(result.verdict).toBe("wait");
  });

  it("has risky flags (but all negotiable)", () => {
    const risky = result.flaggedClauses?.filter((c) => c.category === "risky");
    expect(risky?.length).toBeGreaterThanOrEqual(1);
  });

  it("all risky flags have a suggestedAction (they're negotiable)", () => {
    const risky = result.flaggedClauses?.filter((c) => c.category === "risky");
    for (const r of risky ?? []) {
      expect(r.suggestedAction).toBeTruthy();
    }
  });
});

describe("Contract 5: Multi-issue (risky AND fixable issues)", () => {
  const events = parseFullResponse(MULTI_ISSUE_RESPONSE);
  const result = parsedToResult(events);

  it("produces verdict NO (risky dominates)", () => {
    expect(result.verdict).toBe("no");
  });

  it("has multiple risky flags", () => {
    const risky = result.flaggedClauses?.filter((c) => c.category === "risky");
    expect(risky?.length).toBeGreaterThanOrEqual(2);
  });

  it("has a complete result shape", () => {
    expect(result.verdict).toBeTruthy();
    expect(result.verdictHeadline).toBeTruthy();
    expect(result.verdictReason).toBeTruthy();
    expect(result.flaggedClauses?.length).toBeGreaterThan(0);
    expect(result.summary).toBeTruthy();
  });
});

describe("Parser robustness", () => {
  it("handles a response with markdown code fences (AI mistake)", () => {
    const withFences = `\`\`\`json\n${JSON.stringify({ type: "verdict", verdict: "yes", verdictHeadline: "Fine.", verdictReason: "Clean." })}\n\`\`\``;
    const events = parseFullResponse(withFences);
    // Should skip lines it can't parse without throwing
    expect(() => parseFullResponse(withFences)).not.toThrow();
    // If the JSON line happens to parse, great — but we don't require it
    expect(Array.isArray(events)).toBe(true);
  });

  it("handles an empty string response", () => {
    const events = parseFullResponse("");
    expect(events).toHaveLength(0);
  });

  it("handles a response where the model only output the verdict", () => {
    const verdictOnly = JSON.stringify({ type: "verdict", verdict: "wait", verdictHeadline: "Negotiate.", verdictReason: "Two issues." });
    const events = parseFullResponse(verdictOnly);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("verdict");
  });
});
