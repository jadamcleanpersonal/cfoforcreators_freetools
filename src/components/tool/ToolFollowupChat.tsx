"use client";

// Follow-up chat block — Anthropic-powered, 3 messages free per session.
// Every tool result includes this. Not optional per CLAUDE.md.
// The model receives inputs + outputs + verdict as context.
//
// Defenses (Sprint 4c):
//   - Email gate: first send requires a waitlist email
//   - Hard cap: 3 messages per result (enforced server-side)
//   - Rate limit: 429 responses show a message
//   - Off-topic refusal: handled by the model (system prompt)

import { Events } from "@/lib/posthog";
import type { ToolDefinition } from "@/tools/_types";
import { useChat } from "ai/react";
import { useState } from "react";
import type { z } from "zod";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool: ToolDefinition<z.ZodTypeAny, any>;
  result: {
    id: string;
    inputs: unknown;
    outputs: unknown;
  };
}

function trackEvent(event: string, props?: Record<string, unknown>) {
  if (typeof window !== "undefined" && "posthog" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).posthog?.capture(event, props);
  }
}

export default function ToolFollowupChat({ tool, result }: Props) {
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: `/api/tools/${tool.slug}/follow-up`,
    body: {
      toolSlug: tool.slug,
      resultId: result.id,
      email,
      inputs: result.inputs,
      outputs: result.outputs,
    },
    onFinish: () => {
      trackEvent(Events.TOOL_FOLLOWUP_MESSAGE, { slug: tool.slug });
    },
    onError: (err) => {
      // Parse structured errors from our API
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error === "email_not_on_waitlist" || parsed.error === "email_required") {
          setEmail(""); // Reset so gate shows again
          setEmailError(
            "that email isn't on the waitlist yet. join below to unlock follow-up questions.",
          );
        } else if (
          parsed.error === "message_cap_reached" ||
          parsed.error === "rate_limited"
        ) {
          setBlockedMessage(parsed.message ?? "follow-up limit reached.");
        }
      } catch {
        // Non-JSON error — leave as-is
      }
    },
  });

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const remaining = 3 - userMessageCount;
  const isCapped = remaining <= 0 || blockedMessage !== null;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);

    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError("enter a valid email address");
      return;
    }

    setIsSubmittingEmail(true);

    try {
      // Try to join waitlist — 200 if already on it, 201 if newly added
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: `followup-gate-${tool.slug}`,
          utm_source: "followup_gate",
        }),
      });

      if (res.ok || res.status === 409) {
        // 409 = already exists — either way, they're on the list
        setEmail(trimmed);
      } else {
        setEmailError("couldn't save your email. try again.");
      }
    } catch {
      setEmailError("something went wrong. try again.");
    } finally {
      setIsSubmittingEmail(false);
    }
  }

  // Not yet on waitlist — show email gate
  if (!email) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-ink">got a follow-up question?</h2>
          <p className="text-sm text-ink-muted">
            join the waitlist (free) to ask up to 3 follow-up questions about your result.
          </p>
        </header>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 min-h-tap text-base rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="email address"
              disabled={isSubmittingEmail}
            />
            <button
              type="submit"
              disabled={isSubmittingEmail || !emailInput.trim()}
              className="min-h-tap min-w-tap bg-brand text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmittingEmail ? "..." : "unlock"}
            </button>
          </div>
          {emailError && (
            <p className="text-sm text-danger" role="alert">
              {emailError}
            </p>
          )}
          <p className="text-xs text-ink-muted">
            no spam. unsubscribe any time. used only to gate 3 free questions per result.
          </p>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-ink">got a follow-up?</h2>
        <p className="text-sm text-ink-muted">
          {isCapped
            ? blockedMessage ?? "you've used your 3 follow-up questions for this result."
            : `ask me anything about your result. ${remaining} question${remaining === 1 ? "" : "s"} left.`}
        </p>
      </header>

      {/* Message thread */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-xl bg-brand/10 px-4 py-3 text-sm text-ink"
                  : "max-w-[85%] rounded-xl bg-paper-soft border border-border px-4 py-3 text-sm text-ink"
              }
            >
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div className="max-w-[85%] rounded-xl bg-paper-soft border border-border px-4 py-3 text-sm text-ink-muted animate-pulse">
              thinking...
            </div>
          )}
        </div>
      )}

      {/* Input or cap CTA */}
      {!isCapped ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="e.g., what if my income drops next quarter?"
            rows={3}
            className="w-full min-h-tap text-base rounded-lg border border-border bg-background px-3 py-3 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            aria-label="Ask a follow-up question"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full min-h-tap bg-brand text-white font-semibold rounded-lg px-6 py-3 text-base hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "thinking..." : "ask"}
          </button>
          {error && !blockedMessage && (
            <p className="text-sm text-danger" role="alert">
              something went wrong. try again.
            </p>
          )}
        </form>
      ) : (
        <a
          href="#waitlist"
          className="block w-full text-center min-h-tap bg-brand text-white font-semibold rounded-lg px-6 py-3 text-base hover:bg-brand-dark transition-colors leading-[44px]"
        >
          join the waitlist for unlimited questions
        </a>
      )}
    </section>
  );
}
