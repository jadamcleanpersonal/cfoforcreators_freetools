// Follow-up chat API — streams an Anthropic response using the AI CFO system prompt.
// The tool's inputs + outputs + verdict are injected as context so the model can give
// specific advice without the user re-typing everything.
//
// 3 messages/session cap (checked client-side + server-side).
// Rate limited: 10 requests/hr per IP.

import { AI_CFO_SYSTEM_PROMPT } from "@/lib/prompts/ai-cfo";
import { getToolBySlug } from "@/tools/_registry";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Simple in-memory rate limiter for edge runtime.
// For production, swap with Vercel KV / Upstash when budget allows.
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

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

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 });
  }

  let body: {
    messages: Message[];
    toolSlug: string;
    inputs: unknown;
    outputs: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { messages, toolSlug, inputs, outputs } = body;

  // Validate message array
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages_required" }, { status: 400 });
  }

  // 3-message hard cap per session (server-side enforcement)
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  if (userMessageCount > 3) {
    return NextResponse.json(
      { error: "Free limit reached. Join the waitlist for unlimited questions." },
      { status: 402 },
    );
  }

  const tool = getToolBySlug(toolSlug);
  if (!tool) {
    return NextResponse.json({ error: "unknown_tool" }, { status: 400 });
  }

  const contextPrompt = `The user just used the ${tool.title}.

Their inputs:
${JSON.stringify(inputs, null, 2)}

Their result:
${JSON.stringify(outputs, null, 2)}

Answer their follow-up questions in the AI CFO voice (plain language, lead with the answer, one short caveat, name humans for escalations). Stay scoped to their calculation context — don't volunteer unrelated topics. If they ask something this tool can't answer, point them to the relevant other tool on CFOforcreators.com.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: `${AI_CFO_SYSTEM_PROMPT}\n\n${contextPrompt}`,
    messages,
    maxTokens: 800,
    temperature: 0.3,
  });

  return result.toDataStreamResponse();
}
