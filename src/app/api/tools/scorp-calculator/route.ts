// POST /api/tools/scorp-calculator
// Validates input, computes S-corp result, saves snapshot to Supabase.
// Returns { id, outputs } for the client.

import { Events, trackServerEvent } from "@/lib/posthog";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { computeScorp } from "@/lib/tax/scorp";
import { scorpCalculatorInputSchema } from "@/tools/scorp-calculator";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = scorpCalculatorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const inputs = parsed.data;

  // Compute — pure function, no side effects
  let outputs: ReturnType<typeof computeScorp>;
  try {
    outputs = computeScorp(inputs);
  } catch (err) {
    console.error("scorp computation error:", err);
    return NextResponse.json({ error: "computation_failed" }, { status: 500 });
  }

  // Persist snapshot
  const id = nanoid(10);
  const { error: dbError } = await supabaseAdmin.from("tool_results").insert({
    id,
    tool_slug: "scorp-calculator",
    inputs,
    outputs,
  });

  if (dbError) {
    console.error("tool_results insert error:", dbError);
    // Non-fatal — return result without a shareable URL if DB fails
    return NextResponse.json({ id: "local", outputs }, { status: 200 });
  }

  // Analytics
  await trackServerEvent(Events.TOOL_RESULT_COMPUTED, {
    slug: "scorp-calculator",
    verdict: outputs.verdict,
    platform: inputs.primary_platform,
    niche: inputs.niche,
    state: inputs.state,
    years_creating_full_time: inputs.years_creating_full_time,
  });

  return NextResponse.json({ id, outputs }, { status: 200 });
}
