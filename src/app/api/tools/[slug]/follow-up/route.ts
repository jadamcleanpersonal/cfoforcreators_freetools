// Follow-up chat API — streams an Anthropic response using the AI CFO system prompt.
// The tool's inputs + outputs + verdict are injected as context so the model can give
// specific advice without the user re-typing everything.
//
// Defenses (Sprint 4c):
//   1. Hard server-side message cap: 3 per result (tracked in followup_sessions)
//   2. IP rate limit: 5 follow-up sessions per hour per IP
//   3. Email gate: first message requires a waitlist email
//   4. System prompt off-topic enforcement (refusal patterns in followup_prompt.ts)

import { buildFollowupSystemPrompt } from "@/lib/ai-cfo/followup_prompt";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getToolBySlug } from "@/tools/_registry";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // needs supabase, which requires Node
export const dynamic = "force-dynamic";

const MAX_MESSAGES_PER_SESSION = 3;
const MAX_IP_SESSIONS_PER_HOUR = 5;

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  toolSlug: string;
  resultId: string;
  email: string;
  inputs: unknown;
  outputs: unknown;
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// ── Defense 2: IP rate limit (5 sessions/hr per IP) ─────────────────────────

async function checkIpSessionRateLimit(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("followup_sessions")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);

  if (error) {
    // Fail open — don't block if DB check fails
    console.error("[followup] IP rate limit check failed:", error.message);
    return true;
  }

  return (count ?? 0) < MAX_IP_SESSIONS_PER_HOUR;
}

// ── Defense 3: Email gate ─────────────────────────────────────────────────────

async function checkEmailOnWaitlist(email: string): Promise<boolean> {
  if (!email || !email.includes("@")) return false;

  const { data, error } = await supabaseAdmin
    .from("waitlist")
    .select("email")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !data) return false;
  return true;
}

// ── Defense 1: Per-result message cap ────────────────────────────────────────

async function getOrCreateSession(
  resultId: string,
  email: string,
  ip: string,
): Promise<{ sessionId: string; messageCount: number } | null> {
  // Look up existing session for this result + email
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("followup_sessions")
    .select("id, message_count")
    .eq("result_id", resultId)
    .eq("email", email.toLowerCase().trim())
    .single();

  if (lookupError && lookupError.code !== "PGRST116") {
    // PGRST116 = "no rows found" — expected for first message
    console.error("[followup] session lookup error:", lookupError.message);
    return null;
  }

  if (existing) {
    return { sessionId: existing.id, messageCount: existing.message_count };
  }

  // New session — check IP rate limit before creating
  const withinIpLimit = await checkIpSessionRateLimit(ip);
  if (!withinIpLimit) return null;

  const { data: created, error: createError } = await supabaseAdmin
    .from("followup_sessions")
    .insert({ result_id: resultId, email: email.toLowerCase().trim(), ip, message_count: 0 })
    .select("id, message_count")
    .single();

  if (createError || !created) {
    console.error("[followup] session create error:", createError?.message);
    return null;
  }

  return { sessionId: created.id, messageCount: 0 };
}

async function incrementMessageCount(sessionId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from("followup_sessions")
    .select("message_count")
    .eq("id", sessionId)
    .single();

  if (data) {
    await supabaseAdmin
      .from("followup_sessions")
      .update({ message_count: (data.message_count ?? 0) + 1 })
      .eq("id", sessionId);
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const ip = getClientIp(req);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { messages, toolSlug, resultId, email, inputs, outputs } = body;

  if (!Array.isArray(messages) || !toolSlug || !resultId) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const tool = getToolBySlug(toolSlug);
  if (!tool) {
    return NextResponse.json({ error: "unknown_tool" }, { status: 400 });
  }

  // Defense 3: Email gate — check before any DB session logic
  if (!email) {
    return NextResponse.json(
      {
        error: "email_required",
        message: "join the waitlist to ask follow-up questions. takes 5 seconds.",
        redirect: "/?utm_source=followup_gate",
      },
      { status: 403 },
    );
  }

  const isOnWaitlist = await checkEmailOnWaitlist(email);
  if (!isOnWaitlist) {
    return NextResponse.json(
      {
        error: "email_not_on_waitlist",
        message: "join the waitlist to ask follow-up questions. takes 5 seconds.",
        redirect: "/?utm_source=followup_gate",
      },
      { status: 403 },
    );
  }

  // Get or create session (includes IP rate limit check for new sessions)
  const session = await getOrCreateSession(resultId, email, ip);

  if (!session) {
    return NextResponse.json(
      { error: "rate_limited", message: "rate limited. try again in an hour." },
      { status: 429 },
    );
  }

  // Defense 1: Hard message cap
  if (session.messageCount >= MAX_MESSAGES_PER_SESSION) {
    return NextResponse.json(
      {
        error: "message_cap_reached",
        message: `you've used your ${MAX_MESSAGES_PER_SESSION} follow-up questions for this result. each result gets ${MAX_MESSAGES_PER_SESSION}.`,
      },
      { status: 429 },
    );
  }

  // Count current user messages as additional client-side-bypass check
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  if (userMessageCount > MAX_MESSAGES_PER_SESSION) {
    return NextResponse.json(
      { error: "message_cap_reached", message: "follow-up limit reached." },
      { status: 429 },
    );
  }

  // Increment count (non-blocking — best effort)
  incrementMessageCount(session.sessionId).catch((err) => {
    console.error("[followup] message count increment failed:", err);
  });

  // Defense 4: System prompt with refusal patterns (in buildFollowupSystemPrompt)
  const systemPrompt = buildFollowupSystemPrompt(tool.title, inputs, outputs);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
    maxTokens: 800,
    temperature: 0.3,
  });

  return result.toDataStreamResponse();
}
