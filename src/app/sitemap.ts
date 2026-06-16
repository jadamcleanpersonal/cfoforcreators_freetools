import { allTools } from "@/tools/_registry";
import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thecfoforcreators.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes = allTools.map((t) => ({
    url: `${BASE}/${t.slug}`,
    priority: 0.9,
    changeFrequency: "monthly" as const,
  }));

  return [
    {
      url: BASE,
      priority: 1.0,
      changeFrequency: "weekly",
    },
    ...toolRoutes,
    // Sprint 2+: add /learn/* content routes
    // Sprint 5+: add /states/* pSEO routes
  ];
}
