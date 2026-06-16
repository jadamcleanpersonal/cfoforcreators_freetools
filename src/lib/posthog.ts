// PostHog client + event helpers.
// Client-side: use `usePostHog()` from posthog-js/react.
// Server-side: use `trackServerEvent()` from this module.

// ============================================================
// Event taxonomy — single source of truth.
// Both client-side and server-side tracking reference this object.
// ============================================================
export const Events = {
  // landing funnel
  PAGE_VIEW: "page.viewed",
  HERO_CTA_CLICK: "landing.hero_cta_clicked",
  WAITLIST_SUBMIT: "waitlist.submitted",
  WAITLIST_SUCCESS: "waitlist.success",
  WAITLIST_ERROR: "waitlist.error",

  // deep-dive funnel
  DEEPDIVE_CLICK: "deepdive.cta_clicked",
  DEEPDIVE_FORM_VIEW: "deepdive.form_viewed",
  DEEPDIVE_SUBMIT: "deepdive.submitted",
  DEEPDIVE_DISQUALIFIED: "deepdive.disqualified",

  // tool funnel (parameterized by tool slug)
  TOOL_VIEW: "tool.viewed",
  TOOL_FORM_START: "tool.form_started",
  TOOL_FORM_SUBMIT: "tool.form_submitted",
  TOOL_RESULT_COMPUTED: "tool.result_computed",
  TOOL_EMAIL_GATE_VIEW: "tool.email_gate_viewed",
  TOOL_EMAIL_GATE_SUBMIT: "tool.email_gate_submitted",
  TOOL_SHARE_TWITTER: "tool.share.twitter",
  TOOL_SHARE_COPY: "tool.share.copy_link",
  TOOL_SHARE_NATIVE: "tool.share.native",
  TOOL_CROSS_PROMO_CLICK: "tool.cross_promo_clicked",
  TOOL_FOLLOWUP_MESSAGE: "tool.followup_message_sent",

  // result page (inbound from share)
  SHARED_RESULT_VIEW: "shared_result.viewed",
  SHARED_RESULT_TRY_OWN: "shared_result.try_own_clicked",

  // contract scanner
  CONTRACT_SCAN_START: "contract.scan_started",
  CONTRACT_SCAN_COMPLETE: "contract.scan_completed",
  CONTRACT_SCAN_RATE_LIMITED: "contract.scan_rate_limited",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

/**
 * Server-side PostHog event tracking.
 * Uses a lightweight HTTP call to the PostHog capture endpoint.
 * Does not require posthog-js.
 */
export async function trackServerEvent(
  event: EventName | string,
  properties?: Record<string, unknown>,
  distinctId = "server",
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (!key) return; // silently skip in local dev if key is missing

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties: {
          $lib: "cfoforcreators-server",
          ...properties,
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Non-fatal — analytics should never break the user flow
  }
}
