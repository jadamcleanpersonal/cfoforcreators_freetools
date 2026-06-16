"use client";

import { useState } from "react";
import type { ToolDefinition } from "@/tools/_types";
import type { z } from "zod";
import { Events } from "@/lib/posthog";

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

export default function ToolShareBlock({ tool, result }: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = tool.buildShareText(result.outputs);
  const resultUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecfoforcreators.com"}/${tool.slug}/result/${result.id}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(resultUrl)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent(Events.TOOL_SHARE_COPY, { slug: tool.slug });
    } catch {
      // clipboard API not available — fail silently
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: tool.title, text: shareText, url: resultUrl });
      trackEvent(Events.TOOL_SHARE_NATIVE, { slug: tool.slug });
    } catch {
      // user cancelled or API unavailable — fall back to copy
    }
  }

  return (
    <aside className="rounded-2xl border border-border p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-ink">Share your result</h2>
        <p className="text-sm text-ink-muted">
          Your result has a permanent link. Share it with your accountant or on Twitter.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent(Events.TOOL_SHARE_TWITTER, { slug: tool.slug })}
          className="min-h-tap inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-ink hover:bg-paper-soft transition-colors"
        >
          Share on X
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="min-h-tap inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-ink hover:bg-paper-soft transition-colors"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>

        {"share" in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="min-h-tap inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-ink hover:bg-paper-soft transition-colors"
          >
            Share
          </button>
        )}
      </div>
    </aside>
  );
}
