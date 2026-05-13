"use client";

// Follow-up chat block — Anthropic-powered, 3 messages free per session.
// Every tool result includes this. Not optional per CLAUDE.md.
// The model receives inputs + outputs + verdict as context.

import { useChat } from "ai/react";
import { Events } from "@/lib/posthog";
import type { ToolDefinition } from "@/tools/_types";
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
  // Fire-and-forget client-side PostHog event
  if (typeof window !== "undefined" && "posthog" in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).posthog?.capture(event, props);
  }
}

export default function ToolFollowupChat({ tool, result }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/tools/${tool.slug}/follow-up`,
    body: {
      toolSlug: tool.slug,
      inputs: result.inputs,
      outputs: result.outputs,
    },
    onFinish: () => {
      trackEvent(Events.TOOL_FOLLOWUP_MESSAGE, { slug: tool.slug });
    },
  });

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const remaining = 3 - userMessageCount;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-ink">Got a follow-up?</h2>
        <p className="text-sm text-ink-muted">
          {remaining > 0
            ? `Ask me anything about your result. ${remaining} question${remaining === 1 ? "" : "s"} left.`
            : "Join the waitlist for unlimited questions."}
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
              Thinking...
            </div>
          )}
        </div>
      )}

      {/* Input or upgrade CTA */}
      {remaining > 0 ? (
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
            {isLoading ? "Thinking..." : "Ask"}
          </button>
        </form>
      ) : (
        <a
          href="#waitlist"
          className="block w-full text-center min-h-tap bg-brand text-white font-semibold rounded-lg px-6 py-3 text-base hover:bg-brand-dark transition-colors leading-[44px]"
        >
          Join the waitlist for unlimited questions
        </a>
      )}
    </section>
  );
}
