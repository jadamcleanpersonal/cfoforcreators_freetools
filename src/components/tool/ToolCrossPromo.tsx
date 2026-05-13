import Link from "next/link";
import { getToolBySlug, allTools } from "@/tools/_registry";

interface Props {
  currentSlug: string;
  related: string[];
}

export default function ToolCrossPromo({ currentSlug, related }: Props) {
  const tools = related
    .map((slug) => getToolBySlug(slug))
    .filter(Boolean)
    .slice(0, 3);

  // If no related tools are in the registry yet, show a generic CTA
  if (tools.length === 0) {
    const others = allTools.filter((t) => t.slug !== currentSlug).slice(0, 3);

    if (others.length === 0) {
      return (
        <aside className="rounded-2xl border border-border p-5 space-y-3">
          <h2 className="text-base font-semibold text-ink">More tools coming soon</h2>
          <p className="text-sm text-ink-muted">
            S-corp calculator, LLC chooser, retirement account selector, sponsor rate benchmark,
            and brand contract scanner are all in the pipeline.
          </p>
          <a
            href="/#waitlist"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
          >
            Join the waitlist to be first in line &rarr;
          </a>
        </aside>
      );
    }

    return <CrossPromoList tools={others} />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <CrossPromoList tools={tools as any[]} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CrossPromoList({ tools }: { tools: any[] }) {
  return (
    <aside className="rounded-2xl border border-border p-5 space-y-4">
      <h2 className="text-base font-semibold text-ink">Related tools</h2>
      <div className="space-y-2">
        {tools.map((t) => (
          <Link
            key={t.slug}
            href={`/${t.slug}`}
            className="flex items-start gap-3 rounded-xl border border-border p-3 hover:bg-paper-soft transition-colors group"
          >
            <div>
              <p className="text-sm font-medium text-ink group-hover:text-brand transition-colors">
                {t.title}
              </p>
              <p className="text-xs text-ink-muted mt-0.5">{t.oneLiner}</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
