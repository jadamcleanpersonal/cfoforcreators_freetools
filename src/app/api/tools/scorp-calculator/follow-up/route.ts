// S-corp calculator follow-up chat — edge streaming.
// Extends the AI CFO system prompt with S-corp-specific context.
// Rate limit: 3 messages per session (enforced client-side), 10/hr per IP (enforced here).

import { AI_CFO_SYSTEM_PROMPT } from "@/lib/prompts/ai-cfo";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextResponse } from "next/server";

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

const SCORP_CONTEXT = `
S-corp follow-up rules (non-negotiable):
- The user just ran the S-corp calculator. Answer follow-up questions about THEIR specific numbers.
- If they ask "should I form an LLC first" — answer YES. A single-member LLC is the standard prerequisite for S-corp election. You elect S-corp tax status for the LLC (by filing Form 2553). You don't form a separate company.
- If they ask about Form 2553 — give them the filing deadline and explain it's a tax election form, not a company formation document. It elects S-corp tax treatment for their existing LLC or corporation.
- If they ask "what if I'm wrong about my income next year" — explain the 5-year lockout candidly. Once you elect S-corp, you're locked in for 5 years (or need IRS consent to revoke early). Revocation requires a formal request and a 5-year wait before re-electing. Don't sugarcoat this — it's a real risk for creators with volatile income.
- If they ask about reasonable salary — use the range from their result and explain the IRS "comparable salary" standard. Acknowledge this is judgment-based and their accountant sets the final number.
- If they ask about state-specific rules, refer to the state gotchas in their result. Remind them state tax rules change and they should confirm with a CPA in their state.
- If they mention payroll — Gusto, OnPay, and ADP Run are common options. Most creators use Gusto ($40–49/month base). This is a legitimate business expense.
- If they ask about distributions — these are just payments from the business to the owner that are NOT salary. They're documented as distributions in the books. No magic to it — just need proper accounting.
- Never promise specific tax savings without noting that actual numbers depend on their full tax picture, which an accountant must calculate.
- Defer tax filing decisions to "a CPA" or "an accountant." Never say "consult a professional" — name the human.
- Read-only framing — we can explain and calculate, but we don't move money or file on their behalf.
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

  // Pull key fields from outputs for the context summary
  const out = outputs as Record<string, unknown>;
  const verdict = out?.verdict ?? "unknown";
  const state = (inputs as Record<string, unknown>)?.state ?? "unknown";
  const niche = (inputs as Record<string, unknown>)?.niche ?? "unknown";
  const salaryRange = out?.reasonableSalary as
    | { low: number; recommended: number; high: number }
    | undefined;

  const contextPrompt = `The user just ran the S-corp calculator.

Their verdict: ${verdict}
Their state: ${state}
Their niche: ${niche}
${
  salaryRange
    ? `Their reasonable salary range: $${salaryRange.low.toLocaleString()}–$${salaryRange.high.toLocaleString()} (recommended: $${salaryRange.recommended.toLocaleString()})`
    : ""
}

Full inputs:
${JSON.stringify(inputs, null, 2)}

Full result:
${JSON.stringify(outputs, null, 2)}

Answer their follow-up questions about this specific S-corp calculation.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `${AI_CFO_SYSTEM_PROMPT}\n\n${SCORP_CONTEXT}\n\n${contextPrompt}`,
    messages,
    maxTokens: 600,
    temperature: 0.2,
  });

  return result.toDataStreamResponse();
}
