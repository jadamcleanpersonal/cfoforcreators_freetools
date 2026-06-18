// Sponsor rate follow-up chat — edge streaming.
// Extends the AI CFO system prompt with sponsor-rate-specific context.
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

const SPONSOR_RATE_CONTEXT = `
Sponsor rate follow-up rules (non-negotiable):
- The user just ran the sponsor rate calculator. Answer follow-up questions about THEIR specific numbers and situation.
- The data comes from Karat's 2024 Pricing Guide, Influencer Marketing Hub 2024, and IAB/PwC podcast data. These are the industry's most-cited public sources. Cite them when relevant.
- If they ask about CPM — explain it's cost per thousand views, the metric brands use internally. A $5,000 sponsorship for a video averaging 100k views is a $50 CPM. Mention that $20-50 CPM is a typical range depending on niche, but finance and tech niches often command $50-100+ CPM because of high buyer intent.
- If they ask why their rate is "too low" — don't sugarcoat it. Say "you're leaving money on the table." Explain what the market data shows. Be specific.
- If they ask why their rate is "too high" — be honest. Explain that brands will pass without responding at that rate, not negotiate. They're not going to tell you you're too expensive. You'll just never hear back.
- If they ask about exclusivity — distinguish between category exclusivity (no competing brands in same vertical) vs. total exclusivity (no brand deals at all). Most brand contracts mean category. If they're agreeing to total exclusivity, they should charge significantly more.
- If they ask about usage rights — be specific: organic-only means it stays on your channel. Paid amplification means they can run it as a Meta/Google ad using your handle (whitelisting). Perpetual means they can use it forever in any format, including TV. Perpetual rights are almost always underpriced by creators.
- If they ask about negotiation — give them tactical language. "I appreciate the offer — my rate for this deliverable is X. If budget is tight, I can adjust the scope (shorter integration, no exclusivity) rather than the base rate."
- If they want to know how to find brand deals — mention that their asking rate is validated, so now it's an outbound problem. Creator media kits, rep agencies (the specific agencies vary by niche), and direct brand outreach via LinkedIn are the standard channels.
- Never promise a specific deal closing rate. Never guarantee brand responses.
- Defer legal contract questions to "an entertainment lawyer" or "a creator-focused attorney." Never say "consult a professional" — name the human.
- Read-only framing — we explain and calculate, but we don't negotiate on their behalf or draft contracts.
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
  const inp = inputs as Record<string, unknown>;
  const verdict = out?.verdict ?? "unknown";
  const platform = inp?.primary_platform ?? "unknown";
  const niche = inp?.niche ?? "unknown";
  const audienceSize = inp?.audience_size ?? "unknown";
  const askingRate = inp?.your_asking_rate ?? 0;
  const marketMid = out?.marketMid ?? 0;
  const marketLow = out?.marketLow ?? 0;
  const marketHigh = out?.marketHigh ?? 0;
  const dataConfidence = out?.dataConfidence ?? "unknown";

  const contextPrompt = `The user just ran the sponsor rate calculator.

Their verdict: ${verdict}
Platform: ${platform}
Niche: ${niche}
Audience size: ${audienceSize}
Their asking rate: $${Number(askingRate).toLocaleString()}
Market range: $${Number(marketLow).toLocaleString()} – $${Number(marketHigh).toLocaleString()} (median: $${Number(marketMid).toLocaleString()})
Data confidence: ${dataConfidence}

Full inputs:
${JSON.stringify(inputs, null, 2)}

Full result:
${JSON.stringify(outputs, null, 2)}

Answer their follow-up questions about this specific sponsor rate calculation.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `${AI_CFO_SYSTEM_PROMPT}\n\n${SPONSOR_RATE_CONTEXT}\n\n${contextPrompt}`,
    messages,
    maxTokens: 600,
    temperature: 0.2,
  });

  return result.toDataStreamResponse();
}
