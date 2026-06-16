"use client";

import { useState } from "react";
import type { ToolDefinition } from "@/tools/_types";
import type { z } from "zod";
import ToolCrossPromo from "./ToolCrossPromo";
import ToolEmailGate from "./ToolEmailGate";
import ToolExplainer from "./ToolExplainer";
import ToolFollowupChat from "./ToolFollowupChat";
import ToolForm from "./ToolForm";
import ToolHero from "./ToolHero";
import ToolResult from "./ToolResult";
import ToolShareBlock from "./ToolShareBlock";

interface ToolResultState<I, O> {
  id: string;
  inputs: I;
  outputs: O;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ToolPage({ tool }: { tool: ToolDefinition<z.ZodTypeAny, any> }) {
  const [result, setResult] = useState<ToolResultState<unknown, unknown> | null>(null);

  return (
    <article className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-12">
      {/* 1 — Hero */}
      <ToolHero tool={tool} />

      {/* 2 — Form */}
      <ToolForm tool={tool} onResult={setResult} />

      {/* 3-8 — Results (shown after submit) */}
      {result && (
        <div className="space-y-12" aria-live="polite" aria-atomic="true">
          {/* 3 — Result: verdict prominently above headline number */}
          <ToolResult tool={tool} result={result} />

          {/* 4 — Explainer excerpt */}
          <ToolExplainer slug={tool.explainerSlug} excerpt={tool.explainerExcerpt} />

          {/* 5 — Follow-up chat (AI CFO, 3 messages free) */}
          <ToolFollowupChat tool={tool} result={result} />

          {/* 6 — Email gate (depth-gated personalization) */}
          <ToolEmailGate tool={tool} resultId={result.id} />

          {/* 7 — Share block */}
          <ToolShareBlock tool={tool} result={result} />

          {/* 8 — Cross-promo */}
          <ToolCrossPromo currentSlug={tool.slug} related={tool.relatedTools} />
        </div>
      )}
    </article>
  );
}
