// Tax estimator follow-up chat — edge streaming.
// Extends the generic follow-up handler with tax-specific AI context.
// Per CLAUDE.md: never recommend W-2 withholding adjustments. Read-only frame.

import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { AI_CFO_SYSTEM_PROMPT } from "@/lib/prompts/ai-cfo";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TAX_ESTIMATOR_CONTEXT = `
Tax estimator follow-up rules (non-negotiable):
- The user just ran their quarterly tax estimate. Answer follow-up questions about THEIR specific numbers.
- DO NOT recommend adjusting W-2 withholding. That is accountant territory. If they ask, say: "adjusting W-2 withholding is something to work through with an accountant or Enrolled Agent — it affects your employer relationship and I don't want to give you the wrong number."
- Lead with the number or direct answer, then explain.
- If they ask about state-specific rules, remind them state tax rules change frequently and they should confirm with an accountant.
- Defer personalized tax filing advice to "a CPA" or "an Enrolled Agent."
- Never promise to eliminate the underpayment penalty — it's a fixed calculation.
- If they ask about S-corp, point them to the S-corp calculator at /scorp-calculator.
`.trim();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
  }

  let body: { messages: Message[]; inputs: unknown; outputs: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { messages, inputs, outputs } = body;

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages_required" }, { status: 400 });
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  if (userMessageCount > 3) {
    return NextResponse.json(
      { error: "Free limit reached. Join the waitlist for unlimited questions." },
      { status: 402 },
    );
  }

  const contextPrompt = `The user just ran the quarterly tax calculator for content creators.

Their inputs:
${JSON.stringify(inputs, null, 2)}

Their result:
${JSON.stringify(outputs, null, 2)}

Answer their follow-up questions about this specific estimate.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `${AI_CFO_SYSTEM_PROMPT}\n\n${TAX_ESTIMATOR_CONTEXT}\n\n${contextPrompt}`,
    messages,
    maxTokens: 600,
    temperature: 0.2,
  });

  return result.toDataStreamResponse();
}
