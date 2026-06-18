// POST /api/tools/contract-scanner
// Streams a contract scan via the Anthropic API.
// Rate limits: 5 scans/hr per IP, 50 scans/day globally (cost ceiling).
// Saves result to Supabase with 7-day delete_after for disclosed retention policy.
// Returns SSE stream: verdict → flags → summary → done (with id).

import { streamScan } from "@/lib/contract/scan";
import { contractInputSchema } from "@/lib/contract/types";
import type { FlaggedClause, ScanEvent, ScanResult } from "@/lib/contract/types";
import { Events, trackServerEvent } from "@/lib/posthog";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Rate limiting ─────────────────────────────────────────────────────────────

const RATE_LIMIT_PER_IP: { count: number; window: number } = { count: 5, window: 60 * 60 * 1000 };
const DAILY_GLOBAL_LIMIT = 50;
const MAX_INPUT_CHARS = 50_000;

const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_PER_IP.window });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_IP.count) return false;
  entry.count += 1;
  return true;
}

async function checkGlobalDailyLimit(): Promise<boolean> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("tool_results")
      .select("*", { count: "exact", head: true })
      .eq("tool_slug", "contract-scanner")
      .gte("created_at", since);

    return (count ?? 0) < DAILY_GLOBAL_LIMIT;
  } catch {
    // If DB check fails, allow the request (fail open for UX)
    return true;
  }
}

// ── SSE helpers ───────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function sseEvent(data: object): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // IP rate limit
  if (!checkIpRateLimit(ip)) {
    await trackServerEvent(Events.CONTRACT_SCAN_RATE_LIMITED, { ip_hash: ip.slice(0, 8) });
    return new Response(
      JSON.stringify({ error: "rate_limit_exceeded", message: "5 scans per hour — try again in a bit" }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  // Global daily ceiling
  const withinDailyLimit = await checkGlobalDailyLimit();
  if (!withinDailyLimit) {
    return new Response(
      JSON.stringify({
        error: "daily_limit_reached",
        message: "high traffic right now — try again in a few hours",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  // Parse + validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = contractInputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "validation_failed", issues: parsed.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Hard cap on input size (belt-and-suspenders on top of Zod)
  if (parsed.data.contract_text.length > MAX_INPUT_CHARS) {
    return new Response(JSON.stringify({ error: "input_too_long" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Track scan start
  await trackServerEvent(Events.CONTRACT_SCAN_START, { niche: parsed.data.niche ?? "unset" });

  // ── Streaming response ──────────────────────────────────────────────────────

  const input = parsed.data;

  const stream = new ReadableStream({
    async start(controller) {
      let verdict: ScanResult["verdict"] | null = null;
      let verdictHeadline = "";
      let verdictReason = "";
      const flaggedClauses: FlaggedClause[] = [];
      let summary = "";

      try {
        for await (const event of streamScan(input)) {
          // Accumulate for DB save
          if (event.type === "verdict") {
            verdict = event.verdict;
            verdictHeadline = event.verdictHeadline;
            verdictReason = event.verdictReason;
          } else if (event.type === "flag") {
            flaggedClauses.push({
              category: event.category,
              quote: event.quote,
              explanation: event.explanation,
              suggestedAction: event.suggestedAction,
            });
          } else if (event.type === "summary") {
            summary = event.text;
          }

          // Stream to client
          controller.enqueue(sseEvent(event));
        }

        // Save to Supabase after stream completes
        if (verdict) {
          const outputs: ScanResult = {
            verdict,
            verdictHeadline,
            verdictReason,
            flaggedClauses,
            summary,
          };

          const id = nanoid(10);
          const deleteAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          const { error: dbError } = await supabaseAdmin.from("tool_results").insert({
            id,
            tool_slug: "contract-scanner",
            inputs: {
              // Store contract text hash only — not the full text — to minimize PII in DB
              contract_length: input.contract_text.length,
              creator_context: input.creator_context,
              niche: input.niche,
            },
            outputs,
            delete_after: deleteAfter,
          });

          if (dbError) {
            console.error("contract-scanner tool_results insert error:", dbError);
            // Non-fatal — emit done without shareable ID
            controller.enqueue(sseEvent({ type: "done", id: "local" }));
          } else {
            controller.enqueue(sseEvent({ type: "done", id }));

            await trackServerEvent(Events.CONTRACT_SCAN_COMPLETE, {
              verdict,
              niche: input.niche ?? "unset",
              flagged_count: flaggedClauses.length,
              risky_count: flaggedClauses.filter((c) => c.category === "risky").length,
            });
          }
        } else {
          // Model didn't produce a verdict (malformed response)
          controller.enqueue(
            sseEvent({ type: "error", message: "scan incomplete — try again" }),
          );
        }
      } catch (err) {
        console.error("contract-scanner stream error:", err);
        controller.enqueue(
          sseEvent({
            type: "error",
            message: "something went wrong — try again in a moment",
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
