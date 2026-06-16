"use client";

import { Events } from "@/lib/posthog";
import { useState } from "react";

interface Props {
  source?: string;
  ctaText?: string;
  placeholder?: string;
  className?: string;
}

function trackEvent(event: string, props?: Record<string, unknown>) {
  if (typeof window !== "undefined" && "posthog" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).posthog?.capture(event, props);
  }
}

export default function WaitlistForm({
  source = "landing",
  ctaText = "join the waitlist →",
  placeholder = "your@email.com",
  className = "",
}: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    trackEvent(Events.WAITLIST_SUBMIT, { source });
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "something went wrong. try again.");
      }

      trackEvent(Events.WAITLIST_SUCCESS, { source });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "something went wrong.";
      setError(msg);
      trackEvent(Events.WAITLIST_ERROR, { source, error: msg });
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        className={`rounded-xl border border-brand/30 bg-brand/5 px-5 py-4 space-y-1 ${className}`}
      >
        <p className="font-semibold text-brand">you&apos;re on the list.</p>
        <p className="text-sm text-ink-muted">
          check your inbox. we&apos;ll send each new tool as it goes live.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`} noValidate>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          autoComplete="email"
          className="flex-1 min-h-tap text-base rounded-xl border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand transition-colors"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={isLoading}
          onClick={() => trackEvent(Events.HERO_CTA_CLICK, { source })}
          className="min-h-tap bg-brand text-white font-semibold rounded-xl px-6 py-3 text-base hover:bg-brand-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? "joining..." : ctaText}
        </button>
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-ink-muted">no spam. unsubscribe anytime.</p>
    </form>
  );
}
