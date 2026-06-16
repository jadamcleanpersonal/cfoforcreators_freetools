import type { ToolDefinition } from "@/tools/_types";
import type { z } from "zod";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool: ToolDefinition<z.ZodTypeAny, any>;
}

export default function ToolHero({ tool }: Props) {
  return (
    <header className="space-y-3">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{tool.title}</h1>
      <p className="text-lg text-ink-muted leading-relaxed">{tool.oneLiner}</p>
      <p className="text-sm text-ink-muted">
        Free tool &mdash; no signup required to see your result.
      </p>
    </header>
  );
}
