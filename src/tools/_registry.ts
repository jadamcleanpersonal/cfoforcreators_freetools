// Tool registry — add every new tool here.
// Imported by the sitemap, cross-promo block, and the follow-up chat API.
//
// Sprint 1: registry is empty (no tools shipped yet — just the template shells).
// Sprint 2+: import each tool and add to the array.

import type { z } from "zod";
import type { ToolDefinition } from "./_types";
import taxEstimator from "./tax-estimator";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allTools: ToolDefinition<z.ZodTypeAny, any>[] = [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  taxEstimator as unknown as ToolDefinition<z.ZodTypeAny, any>,
  // Sprint 3: add scorp-calculator here
  // Sprint 4: add llc-chooser, retirement-chooser here
  // Sprint 5: add sponsor-rate here
  // Sprint 6: add contract-scanner here
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getToolBySlug(slug: string): ToolDefinition<z.ZodTypeAny, any> | undefined {
  return allTools.find((t) => t.slug === slug);
}
