import { subscribe } from "@/lib/beehiiv";
import { Events, trackServerEvent } from "@/lib/posthog";
import { sendWaitlistSignupNotification } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  firstName: z.string().max(100).optional(),
  source: z.string().max(100).default("landing"),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { email, firstName, source, utm_source, utm_medium, utm_campaign, utm_content } =
    parsed.data;

  const referrer = req.headers.get("referer") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;
  // Vercel geo header (not stored as PII — just country code)
  const ipCountry = req.headers.get("x-vercel-ip-country") ?? undefined;

  // 1. Upsert into Supabase waitlist
  const { data: existingRow } = await supabaseAdmin
    .from("waitlist")
    .select("id, beehiiv_subscriber_id")
    .eq("email", email)
    .single();

  let beehiivSubscriberId: string | undefined;

  if (!existingRow) {
    // New signup
    const tags = [`source:${source}`];

    const { error: insertError } = await supabaseAdmin.from("waitlist").insert({
      email,
      first_name: firstName,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      referrer,
      user_agent: userAgent,
      ip_country: ipCountry,
    });

    if (insertError) {
      console.error("waitlist insert error:", insertError);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    // 2. Subscribe to Beehiiv
    try {
      beehiivSubscriberId = await subscribe({
        email,
        firstName,
        source,
        tags,
      });

      // Update Supabase row with Beehiiv ID
      await supabaseAdmin
        .from("waitlist")
        .update({
          beehiiv_subscriber_id: beehiivSubscriberId,
          beehiiv_synced_at: new Date().toISOString(),
        })
        .eq("email", email);
    } catch (beehiivError) {
      // Non-fatal — user is still captured in Supabase
      console.error("beehiiv subscribe error:", beehiivError);
    }

    // 3. Notify the operator (non-fatal — never block on email send)
    try {
      await sendWaitlistSignupNotification({
        email,
        firstName,
        source,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        ipCountry,
      });
    } catch (notificationError) {
      console.error("waitlist notification email error:", notificationError);
    }

    await trackServerEvent(Events.WAITLIST_SUCCESS, { source, email });
  } else {
    // Already on list — still return success
    beehiivSubscriberId = existingRow.beehiiv_subscriber_id ?? undefined;
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
