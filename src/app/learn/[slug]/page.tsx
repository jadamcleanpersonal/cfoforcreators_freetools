import ToolEmbed from "@/components/learn/ToolEmbed";
import matter from "gray-matter";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "learn");

interface Frontmatter {
  title: string;
  description: string;
  publishedAt?: string;
}

async function loadMdx(slug: string): Promise<{ frontmatter: Frontmatter; content: string } | null> {
  try {
    const raw = await fs.readFile(path.join(CONTENT_DIR, `${slug}.mdx`), "utf8");
    const { data, content } = matter(raw);
    if (!data.title || !data.description) {
      return null;
    }
    return {
      frontmatter: {
        title: data.title,
        description: data.description,
        publishedAt: data.publishedAt,
      },
      content,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadMdx(slug);
  if (!post) {
    return { title: "Not found" };
  }
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
  };
}

export default async function LearnPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await loadMdx(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-tight">
          {post.frontmatter.title}
        </h1>
        <p className="text-base text-ink-muted leading-relaxed">{post.frontmatter.description}</p>
      </header>

      <div className="prose prose-neutral max-w-none prose-headings:text-ink prose-headings:font-bold prose-p:text-ink prose-p:leading-relaxed prose-strong:text-ink prose-a:text-brand hover:prose-a:text-brand-dark prose-li:text-ink">
        <MDXRemote source={post.content} components={{ ToolEmbed }} />
      </div>
    </article>
  );
}
