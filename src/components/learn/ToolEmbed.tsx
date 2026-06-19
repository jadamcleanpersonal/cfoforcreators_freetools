import Link from "next/link";
import { getToolBySlug } from "@/tools/_registry";

interface Props {
  slug: string;
}

/**
 * Embedded tool callout used inside MDX explainers.
 * Renders a card linking to the tool itself (we don't inline the full form
 * to keep MDX pages light and avoid double-rendering complex calculator UI).
 */
export default function ToolEmbed({ slug }: Props) {
  const tool = getToolBySlug(slug);

  if (!tool) {
    return null;
  }

  return (
    <aside className="not-prose my-8 rounded-2xl border border-brand/30 bg-brand/5 p-6 space-y-3">
      <p className="text-sm font-semibold text-brand uppercase tracking-wide">free tool</p>
      <h3 className="text-xl font-bold text-ink">{tool.title}</h3>
      <p className="text-base text-ink-muted leading-relaxed">{tool.oneLiner}</p>
      <Link
        href={`/${tool.slug}`}
        className="inline-flex items-center gap-1.5 min-h-tap px-4 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition-colors"
      >
        try it now &rarr;
      </Link>
    </aside>
  );
}
