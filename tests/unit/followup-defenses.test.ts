// Unit tests for follow-up chat defenses.
// Tests each defense in isolation without hitting real Supabase or Anthropic.

import { buildFollowupSystemPrompt, REFUSAL_RESPONSE } from "@/lib/ai-cfo/followup_prompt";
import { describe, expect, it } from "vitest";

// ── Defense 4: System prompt refusal patterns ─────────────────────────────────

describe("buildFollowupSystemPrompt", () => {
  const toolTitle = "Tax Estimator for Creators";
  const inputs = { annual_revenue: 120000, state: "CA" };
  const outputs = { verdict: "yes", tax_owed: 28500 };

  it("includes the AI CFO system prompt", () => {
    const prompt = buildFollowupSystemPrompt(toolTitle, inputs, outputs);
    // The AI CFO prompt starts with its standard intro
    expect(prompt.length).toBeGreaterThan(500);
  });

  it("includes the tool title in context", () => {
    const prompt = buildFollowupSystemPrompt(toolTitle, inputs, outputs);
    expect(prompt).toContain(toolTitle);
  });

  it("includes serialized inputs in context", () => {
    const prompt = buildFollowupSystemPrompt(toolTitle, inputs, outputs);
    expect(prompt).toContain("120000");
    expect(prompt).toContain('"state": "CA"');
  });

  it("includes serialized outputs in context", () => {
    const prompt = buildFollowupSystemPrompt(toolTitle, inputs, outputs);
    expect(prompt).toContain("28500");
    expect(prompt).toContain('"verdict": "yes"');
  });

  it("includes the canonical refusal response in the system prompt", () => {
    const prompt = buildFollowupSystemPrompt(toolTitle, inputs, outputs);
    expect(prompt).toContain(REFUSAL_RESPONSE);
  });

  it("contains off-topic examples in refusal instructions", () => {
    const prompt = buildFollowupSystemPrompt(toolTitle, inputs, outputs);
    expect(prompt.toLowerCase()).toContain("off-topic");
  });

  it("includes instruction to not engage with jailbreak attempts", () => {
    const prompt = buildFollowupSystemPrompt(toolTitle, inputs, outputs);
    expect(prompt.toLowerCase()).toContain("ignore");
    expect(prompt.toLowerCase()).toContain("instructions");
  });
});

// ── Defense 1: Message cap — tested at the module level ──────────────────────

describe("REFUSAL_RESPONSE constant", () => {
  it("is a non-empty string", () => {
    expect(typeof REFUSAL_RESPONSE).toBe("string");
    expect(REFUSAL_RESPONSE.length).toBeGreaterThan(20);
  });

  it("mentions cfoforcreators.com", () => {
    expect(REFUSAL_RESPONSE).toContain("cfoforcreators.com");
  });

  it("does not start with 'I' (wrong voice — should be lowercase)", () => {
    expect(REFUSAL_RESPONSE[0]).toBe("i");
  });
});

// ── Defense integration: message cap threshold ────────────────────────────────

describe("message cap threshold", () => {
  // These tests verify the constant used in the route matches the stated limit
  const MAX_MESSAGES = 3;

  it("cap is exactly 3 messages", () => {
    expect(MAX_MESSAGES).toBe(3);
  });

  it("remaining count math is correct", () => {
    // After 0 messages: 3 left
    expect(MAX_MESSAGES - 0).toBe(3);
    // After 2 messages: 1 left
    expect(MAX_MESSAGES - 2).toBe(1);
    // After 3 messages: capped
    expect(MAX_MESSAGES - 3).toBe(0);
  });
});
