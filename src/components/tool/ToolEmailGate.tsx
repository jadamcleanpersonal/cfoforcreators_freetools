"use client";

// Email gate — depth-gated personalization.
// Shown after the result + explainer. Optional submit — user can skip.
// Captures email against the result ID for future personalization features.

import { useState } from "react";
import type { ToolDefinition } from "@/tools/_types";
import type { z } from "zod";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool: ToolDefinition<z.ZodTypeAny, any>;
  resultId: string;
}

export default function ToolEmailGate({ tool, resultId }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: `tool:${tool.slug}`,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Something went wrong.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <aside className="rounded-2xl border border-brand/30 bg-brand/5 p-5 space-y-2">
        <p className="font-semibold text-brand">You&apos;re on the list.</p>
        <p className="text-sm text-ink-muted">
          We&apos;ll send each new tool + the weekly creator finance newsletter. You can unsubscribe
          anytime.
        </p>
      </aside>
    );
  }

  return (
    <aside
      id="waitlist"
      className="rounded-2xl border border-border bg-paper-soft p-5 space-y-4"
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-ink">Want the full picture?</h2>
        <p className="text-sm text-ink-muted">
          Drop your email and we&apos;ll send every new free tool + weekly creator finance tips.
          Founding member pricing locked in when we launch.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 min-h-tap text-base rounded-lg border border-border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="min-h-tap bg-brand text-white font-semibold rounded-lg px-5 py-3 text-base hover:bg-brand-dark transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {isLoading ? "Joining..." : "Join the waitlist"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-ink-muted">No spam. Unsubscribe anytime.</p>
    </aside>
  );
}
