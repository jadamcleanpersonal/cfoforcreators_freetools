// Contract response parser tests.
// Covers valid, malformed, truncated, and edge-case NDJSON outputs.

import { parseChunk, parseFullResponse, parseResponseLine } from "@/lib/contract/parse_response";
import { describe, expect, it } from "vitest";

describe("parseResponseLine", () => {
  it("parses a valid verdict line", () => {
    const line = JSON.stringify({
      type: "verdict",
      verdict: "yes",
      verdictHeadline: "Looks fine. Standard terms.",
      verdictReason: "Standard payment terms and no unusual clauses.",
    });
    const event = parseResponseLine(line);
    expect(event?.type).toBe("verdict");
    if (event?.type === "verdict") {
      expect(event.verdict).toBe("yes");
      expect(event.verdictHeadline).toBeTruthy();
    }
  });

  it("parses a valid flag line (risky with suggestedAction)", () => {
    const line = JSON.stringify({
      type: "flag",
      category: "risky",
      quote: "perpetual worldwide license to all content",
      explanation: "This grants the brand unlimited rights forever without additional payment.",
      suggestedAction: "Negotiate to organic-only rights or add a 2-3x rate premium.",
    });
    const event = parseResponseLine(line);
    expect(event?.type).toBe("flag");
    if (event?.type === "flag") {
      expect(event.category).toBe("risky");
      expect(event.suggestedAction).toBeTruthy();
    }
  });

  it("parses a valid flag line (fine without suggestedAction)", () => {
    const line = JSON.stringify({
      type: "flag",
      category: "fine",
      quote: "Payment due within thirty (30) days of invoice",
      explanation: "Standard Net-30 payment terms. Industry norm.",
    });
    const event = parseResponseLine(line);
    expect(event?.type).toBe("flag");
    if (event?.type === "flag") {
      expect(event.category).toBe("fine");
      expect(event.suggestedAction).toBeUndefined();
    }
  });

  it("parses a valid summary line", () => {
    const line = JSON.stringify({
      type: "summary",
      text: "Overall a clean contract with standard terms.",
    });
    const event = parseResponseLine(line);
    expect(event?.type).toBe("summary");
  });

  it("parses a done event", () => {
    const line = JSON.stringify({ type: "done", id: "abc1234567" });
    const event = parseResponseLine(line);
    expect(event?.type).toBe("done");
    if (event?.type === "done") {
      expect(event.id).toBe("abc1234567");
    }
  });

  it("returns null for empty string", () => {
    expect(parseResponseLine("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(parseResponseLine("   ")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseResponseLine("{bad json}")).toBeNull();
  });

  it("returns null for JSON with unknown type", () => {
    const line = JSON.stringify({ type: "unknown_event", data: "foo" });
    expect(parseResponseLine(line)).toBeNull();
  });

  it("returns null for verdict with invalid verdict value", () => {
    const line = JSON.stringify({
      type: "verdict",
      verdict: "maybe",
      verdictHeadline: "...",
      verdictReason: "...",
    });
    expect(parseResponseLine(line)).toBeNull();
  });

  it("returns null for flag with invalid category", () => {
    const line = JSON.stringify({
      type: "flag",
      category: "dangerous",
      quote: "...",
      explanation: "...",
    });
    expect(parseResponseLine(line)).toBeNull();
  });

  it("returns null for flag missing required fields", () => {
    const line = JSON.stringify({ type: "flag", category: "risky" });
    expect(parseResponseLine(line)).toBeNull();
  });

  it("skips comment lines", () => {
    expect(parseResponseLine("// this is a comment")).toBeNull();
  });

  it("handles extra whitespace around JSON", () => {
    const line = `  ${JSON.stringify({ type: "summary", text: "Overall fine." })}  `;
    const event = parseResponseLine(line);
    expect(event?.type).toBe("summary");
  });
});

describe("parseChunk", () => {
  it("processes a single complete line", () => {
    const line = JSON.stringify({ type: "summary", text: "Fine contract." });
    const { events, remaining } = parseChunk("", `${line}\n`);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("summary");
    expect(remaining).toBe("");
  });

  it("buffers an incomplete line", () => {
    const partial = '{"type":"summ';
    const { events, remaining } = parseChunk("", partial);
    expect(events).toHaveLength(0);
    expect(remaining).toBe(partial);
  });

  it("processes multiple lines in one chunk", () => {
    const v = JSON.stringify({ type: "verdict", verdict: "wait", verdictHeadline: "Negotiate", verdictReason: "Two fixable issues." });
    const f = JSON.stringify({ type: "flag", category: "unusual", quote: "60-day payment terms", explanation: "Longer than standard." });
    const { events, remaining } = parseChunk("", `${v}\n${f}\n`);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("verdict");
    expect(events[1].type).toBe("flag");
    expect(remaining).toBe("");
  });

  it("carries buffer across chunk boundaries", () => {
    const full = JSON.stringify({ type: "summary", text: "All good." });
    const half1 = full.slice(0, 20);
    const half2 = full.slice(20);

    const { events: e1, remaining: r1 } = parseChunk("", half1);
    expect(e1).toHaveLength(0);
    expect(r1).toBe(half1);

    const { events: e2, remaining: r2 } = parseChunk(r1, `${half2}\n`);
    expect(e2).toHaveLength(1);
    expect(e2[0].type).toBe("summary");
    expect(r2).toBe("");
  });

  it("skips malformed lines and continues", () => {
    const bad = "not valid json\n";
    const good = `${JSON.stringify({ type: "summary", text: "OK." })}\n`;
    const { events } = parseChunk("", bad + good);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("summary");
  });
});

describe("parseFullResponse", () => {
  it("parses a complete NDJSON response", () => {
    const lines = [
      JSON.stringify({ type: "verdict", verdict: "no", verdictHeadline: "Don't sign.", verdictReason: "Perpetual rights." }),
      JSON.stringify({ type: "flag", category: "risky", quote: "perpetual worldwide license", explanation: "Rights grab." }),
      JSON.stringify({ type: "flag", category: "fine", quote: "Net-30 payment terms", explanation: "Standard." }),
      JSON.stringify({ type: "summary", text: "Serious rights issue. Negotiate clause 7." }),
    ].join("\n");

    const events = parseFullResponse(lines);
    expect(events).toHaveLength(4);
    expect(events[0].type).toBe("verdict");
    expect(events[1].type).toBe("flag");
    expect(events[3].type).toBe("summary");
  });

  it("handles empty response", () => {
    expect(parseFullResponse("")).toHaveLength(0);
  });

  it("handles response with mixed valid and invalid lines", () => {
    const response = [
      JSON.stringify({ type: "verdict", verdict: "yes", verdictHeadline: "Fine.", verdictReason: "Clean contract." }),
      "markdown formatting the AI accidentally included",
      JSON.stringify({ type: "summary", text: "All good." }),
    ].join("\n");

    const events = parseFullResponse(response);
    expect(events).toHaveLength(2); // skips the malformed line
  });

  it("handles truncated response (no summary)", () => {
    const truncated = JSON.stringify({
      type: "verdict",
      verdict: "wait",
      verdictHeadline: "Negotiate.",
      verdictReason: "Two issues.",
    });
    const events = parseFullResponse(truncated);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("verdict");
  });
});
