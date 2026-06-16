// Beehiiv API v2 wrapper
// Used for waitlist signups and subscriber tagging.
// Marketing sequences (welcome, tax reminders) are configured in Beehiiv UI — not here.

const BASE = "https://api.beehiiv.com/v2";
const PUB = process.env.BEEHIIV_PUBLICATION_ID!;
const KEY = process.env.BEEHIIV_API_KEY!;

export interface SubscribeInput {
  email: string;
  firstName?: string;
  source: string; // becomes utm_source in Beehiiv
  tags: string[];
}

/**
 * Subscribe an email to the Beehiiv publication.
 * Returns the Beehiiv subscriber ID.
 */
export async function subscribe(input: SubscribeInput): Promise<string> {
  const res = await fetch(`${BASE}/publications/${PUB}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      reactivate_existing: true,
      send_welcome_email: true,
      utm_source: input.source,
      custom_fields: input.firstName
        ? [{ name: "first_name", value: input.firstName }]
        : [],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`beehiiv_subscribe_failed: ${res.status} ${text}`);
  }

  const { data } = await res.json();

  // Beehiiv doesn't accept tags in the initial POST — second call required
  if (input.tags.length > 0) {
    await tag(data.id, input.tags);
  }

  return data.id as string;
}

/**
 * Apply tags to an existing Beehiiv subscriber.
 */
export async function tag(subscriberId: string, tags: string[]): Promise<void> {
  const res = await fetch(
    `${BASE}/publications/${PUB}/subscriptions/${subscriberId}/tags`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tags }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`beehiiv_tag_failed: ${res.status} ${text}`);
  }
}
