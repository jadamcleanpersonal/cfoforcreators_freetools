// Resend wrapper — transactional emails only.
// Marketing sequences go through Beehiiv. See docs/cfoforcreators_buildout_plan.md §6.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = "cfo for creators <noreply@thecfoforcreators.com>";

export interface DeepDiveConfirmationInput {
  to: string;
  firstName?: string;
}

/**
 * Send the auto-confirmation email to a founder video walkthrough intake submitter.
 */
export async function sendDeepDiveConfirmation(input: DeepDiveConfirmationInput): Promise<void> {
  const name = input.firstName ?? "there";

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: "got it. your video walkthrough is in the queue",
    html: `
      <p>hey ${name},</p>
      <p>your video walkthrough request came through. here's what happens next:</p>
      <ul>
        <li>i'll review your numbers and your questions personally.</li>
        <li>you'll get a 10-minute video within 48 hours with specific recommendations for your channel.</li>
        <li>no charge. no catch.</li>
      </ul>
      <p>in the meantime, if you haven't tried the free tools yet, the quarterly tax estimator is the most useful place to start: <a href="https://thecfoforcreators.com/tax-estimator">thecfoforcreators.com/tax-estimator</a></p>
      <p>talk soon,<br>— Jada Mclean<br>cfo for creators</p>
    `,
  });
}

export interface AdminDeepDiveNotificationInput {
  submitterEmail: string;
  submitterName?: string;
  incomeTier: string;
  questions: string[];
}

/**
 * Notify the founder when a new video walkthrough intake is submitted.
 */
export async function sendAdminDeepDiveNotification(
  input: AdminDeepDiveNotificationInput,
): Promise<void> {
  const founderEmail = process.env.FOUNDER_EMAIL ?? "hello@thecfoforcreators.com";

  await resend.emails.send({
    from: FROM,
    to: founderEmail,
    subject: `new video walkthrough intake: ${input.submitterEmail}`,
    html: `
      <p><strong>new video walkthrough intake submitted.</strong></p>
      <p><strong>email:</strong> ${input.submitterEmail}</p>
      <p><strong>name:</strong> ${input.submitterName ?? "n/a"}</p>
      <p><strong>income tier:</strong> ${input.incomeTier}</p>
      <p><strong>questions:</strong></p>
      <ol>
        ${input.questions.map((q) => `<li>${q}</li>`).join("")}
      </ol>
      <p><a href="https://thecfoforcreators.com/admin">view in admin dashboard</a></p>
    `,
  });
}

export interface WaitlistSignupNotificationInput {
  email: string;
  firstName?: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  ipCountry?: string;
}

/**
 * Notify the operator when a new waitlist signup comes in.
 * Fires non-fatally from /api/waitlist after the Supabase insert succeeds.
 */
export async function sendWaitlistSignupNotification(
  input: WaitlistSignupNotificationInput,
): Promise<void> {
  const operatorEmail = process.env.FOUNDER_EMAIL ?? "hello@thecfoforcreators.com";

  const utmParts = [
    input.utm_source && `source: ${input.utm_source}`,
    input.utm_medium && `medium: ${input.utm_medium}`,
    input.utm_campaign && `campaign: ${input.utm_campaign}`,
    input.utm_content && `content: ${input.utm_content}`,
  ].filter(Boolean);

  const utmLine = utmParts.length > 0 ? `<p><strong>utm:</strong> ${utmParts.join(" · ")}</p>` : "";

  await resend.emails.send({
    from: FROM,
    to: operatorEmail,
    subject: `new waitlist signup: ${input.email}`,
    html: `
      <p><strong>new waitlist signup.</strong></p>
      <p><strong>email:</strong> ${input.email}</p>
      <p><strong>name:</strong> ${input.firstName ?? "(not provided)"}</p>
      <p><strong>landing source:</strong> ${input.source}</p>
      ${utmLine}
      ${input.ipCountry ? `<p><strong>country:</strong> ${input.ipCountry}</p>` : ""}
      <p>view all signups in supabase → table editor → waitlist.</p>
    `,
  });
}

export { resend };
