import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "what we save from contract scans | cfoforcreators",
  description:
    "plain-language explanation of the optional clause pattern collection on the brand contract scanner.",
};

export default async function PrivacyClausePatternsPage() {
  let content: string;
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "legal", "privacy-clause-patterns.mdx"),
      "utf8",
    );
    const parsed = matter(raw);
    content = parsed.content;
  } catch {
    notFound();
  }

  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <a href="/contract-scanner" className="text-sm text-brand hover:text-brand-dark mb-6 block">
        ← back to contract scanner
      </a>
      <div className="prose prose-neutral max-w-none">
        <MDXRemote source={content} />
      </div>
    </article>
  );
}
