// POST /api/tools/sponsor-rate
// Validates input, computes sponsor rate result, saves snapshot to Supabase.
// Returns { id, outputs } for the client.

import { Events, trackServerEvent } from "@/lib/posthog";
import { computeSponsorRate } from "@/lib/sponsor";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sponsorRateInputSchema } from "@/tools/sponsor-rate";
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

  const parsed = sponsorRateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const inputs = parsed.data;

  // Compute — pure function, no side effects
  let outputs: ReturnType<typeof computeSponsorRate>;
  try {
    outputs = computeSponsorRate(inputs);
  } catch (err) {
    console.error("sponsor rate computation error:", err);
    return NextResponse.json({ error: "computation_failed" }, { status: 500 });
  }

  // Persist snapshot
  const id = nanoid(10);
  const { error: dbError } = await supabaseAdmin.from("tool_results").insert({
    id,
    tool_slug: "sponsor-rate",
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
    slug: "sponsor-rate",
    verdict: outputs.verdict,
    platform: inputs.primary_platform,
    niche: inputs.niche,
    deliverable_type: inputs.deliverable_type,
    audience_size: inputs.audience_size,
    data_confidence: outputs.dataConfidence,
  });

  return NextResponse.json({ id, outputs }, { status: 200 });
}
