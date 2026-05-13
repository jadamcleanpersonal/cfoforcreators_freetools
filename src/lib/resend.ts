// Resend wrapper — transactional emails only.
// Marketing sequences go through Beehiiv. See docs/cfoforcreators_buildout_plan.md §6.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM = "CFO for Creators <noreply@thecfoforcreators.com>";

export interface DeepDiveConfirmationInput {
  to: string;
  firstName?: string;
}

/**
 * Send the auto-confirmation email to a founder deep-dive intake submitter.
 */
export async function sendDeepDiveConfirmation(
  input: DeepDiveConfirmationInput,
): Promise<void> {
  const name = input.firstName ?? "there";

  await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: "Got it — your deep-dive is in the queue",
    html: `
      <p>Hey ${name},</p>
      <p>Your financial deep-dive request came through. Here's what happens next:</p>
      <ul>
        <li>I'll review your numbers and your questions personally.</li>
        <li>You'll get a 10-minute Loom video within 48 hours with specific recommendations for your channel.</li>
        <li>No charge. No catch.</li>
      </ul>
      <p>In the meantime, if you haven't tried the free tools yet — the quarterly tax estimator is the most useful place to start: <a href="https://thecfoforcreators.com/tax-estimator">thecfoforcreators.com/tax-estimator</a></p>
      <p>Talk soon,<br>— [Founder Name]<br>CFO for Creators</p>
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
 * Notify the founder when a new deep-dive intake is submitted.
 */
export async function sendAdminDeepDiveNotification(
  input: AdminDeepDiveNotificationInput,
): Promise<void> {
  const founderEmail = process.env.FOUNDER_EMAIL ?? "hello@thecfoforcreators.com";

  await resend.emails.send({
    from: FROM,
    to: founderEmail,
    subject: `New deep-dive intake: ${input.submitterEmail}`,
    html: `
      <p><strong>New deep-dive intake submitted.</strong></p>
      <p><strong>Email:</strong> ${input.submitterEmail}</p>
      <p><strong>Name:</strong> ${input.submitterName ?? "N/A"}</p>
      <p><strong>Income tier:</strong> ${input.incomeTier}</p>
      <p><strong>Questions:</strong></p>
      <ol>
        ${input.questions.map((q) => `<li>${q}</li>`).join("")}
      </ol>
      <p><a href="https://thecfoforcreators.com/admin">View in admin dashboard</a></p>
    `,
  });
}

export { resend };
