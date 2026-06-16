// POST /api/tools/tax-estimator
// Validates input, computes tax estimate, saves snapshot to Supabase.
// Returns { id, outputs } for the client.

import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trackServerEvent, Events } from "@/lib/posthog";
import { taxEstimatorInputSchema } from "@/tools/tax-estimator";
import { computeTaxEstimate } from "@/lib/tax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = taxEstimatorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const inputs = parsed.data;

  // Compute — pure function, no side effects
  let outputs: ReturnType<typeof computeTaxEstimate>;
  try {
    outputs = computeTaxEstimate(inputs);
  } catch (err) {
    console.error("tax computation error:", err);
    return NextResponse.json({ error: "computation_failed" }, { status: 500 });
  }

  // Persist snapshot
  const id = nanoid(10);
  const { error: dbError } = await supabaseAdmin.from("tool_results").insert({
    id,
    tool_slug: "tax-estimator",
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
    slug: "tax-estimator",
    verdict: outputs.verdict,
    platform: inputs.primary_platform,
    niche: inputs.niche,
    state: inputs.state,
    quarter: inputs.current_quarter,
  });

  return NextResponse.json({ id, outputs }, { status: 200 });
}
