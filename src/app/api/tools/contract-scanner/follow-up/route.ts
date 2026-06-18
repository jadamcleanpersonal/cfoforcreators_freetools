// Contract scanner follow-up chat — edge streaming.
// Post-scan questions: up to 3 per session, 10/hr per IP.
// CRITICAL: Never give legal advice. Refer to "a lawyer" for serious concerns.

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

const CONTRACT_FOLLOW_UP_CONTEXT = `
Contract scanner follow-up rules (non-negotiable):

- The user just received a contract scan. Do NOT give legal advice. Do NOT generate new legal opinions about clauses.
- If they ask about a specific clause, refer back to the scan's flagging and explanation — don't interpret the clause beyond what was flagged.
- If they ask about negotiation tactics, give plain-language scripts they can actually use. Example: "you could say to the brand: 'we're happy to grant organic-only rights at this rate; perpetual rights are 2.5x our standard rate.'"
- If they ask whether a clause is enforceable, whether they have legal recourse, or whether a clause is "legal" — defer: "that's a legal question — talk to a lawyer who knows entertainment and IP law."
- If they ask who to hire: "a lawyer who works with creators or in entertainment/IP law. ask other creators in your space for referrals."
- You CAN discuss standard industry practice, typical negotiation moves, and how other creators handle similar clauses.
- You CAN help them draft a negotiation response (as a starting point — not a legal letter).
- NEVER say "consult a professional." Name the role: "a lawyer," "an Enrolled Agent," "a CPA."
- Read-only framing always — you explain and advise, you don't file, draft legally binding documents, or act on their behalf.
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

  const { messages, outputs } = body;

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

  const out = outputs as Record<string, unknown>;
  const verdict = out?.verdict ?? "unknown";
  const flaggedClauses = (out?.flaggedClauses as unknown[]) ?? [];
  const riskyCount = flaggedClauses.filter(
    (c) => (c as Record<string, unknown>)?.category === "risky",
  ).length;

  const contextPrompt = `The user just received a brand contract scan.

Their verdict: ${verdict}
Flagged clauses: ${flaggedClauses.length} total (${riskyCount} risky)
Verdict headline: ${out?.verdictHeadline ?? ""}
Verdict reason: ${out?.verdictReason ?? ""}

Full scan result:
${JSON.stringify(outputs, null, 2)}

Answer their follow-up questions about this specific contract scan. Do NOT give legal advice. Refer to the scan's findings.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `${AI_CFO_SYSTEM_PROMPT}\n\n${CONTRACT_FOLLOW_UP_CONTEXT}\n\n${contextPrompt}`,
    messages,
    maxTokens: 600,
    temperature: 0.2,
  });

  return result.toDataStreamResponse();
}
