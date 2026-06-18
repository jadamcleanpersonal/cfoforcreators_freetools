// POST /api/sponsor-rate/submit
// Accepts anonymous community rate submissions.
// Saves to sponsor_rate_submissions table — NOT the tool_results table.
// Submissions are queued for moderation before affecting the calculator.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const submissionSchema = z.object({
  platform: z.enum([
    "youtube_long",
    "youtube_shorts",
    "tiktok",
    "instagram_reels",
    "instagram_feed",
    "twitch",
    "podcast",
    "x",
  ]),
  niche: z.enum([
    "gaming",
    "beauty",
    "finance",
    "lifestyle",
    "education",
    "tech",
    "food",
    "fitness",
    "other",
  ]),
  audience_size: z.enum(["<10k", "10-100k", "100k-1M", "1M+"]),
  deliverable_type: z.enum([
    "dedicated_video",
    "integration",
    "mention",
    "story_post",
    "feed_post",
    "podcast_read",
    "multi_deliverable",
  ]),
  rate_charged: z.number().int().min(1).max(10_000_000),
  brand_accepted: z.boolean().optional(),
  exclusivity_days: z.number().int().min(0).default(0),
  usage_rights: z
    .enum(["organic_only", "brand_can_boost_paid", "brand_owns_perpetual"])
    .default("organic_only"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const { error: dbError } = await supabaseAdmin.from("sponsor_rate_submissions").insert({
    platform: data.platform,
    niche: data.niche,
    audience_size: data.audience_size,
    deliverable_type: data.deliverable_type,
    rate_charged: data.rate_charged,
    brand_accepted: data.brand_accepted ?? null,
    exclusivity_days: data.exclusivity_days,
    usage_rights: data.usage_rights,
    approved_for_display: false, // requires moderation before use
  });

  if (dbError) {
    console.error("sponsor_rate_submissions insert error:", dbError);
    return NextResponse.json({ error: "submission_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
