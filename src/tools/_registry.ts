// Tool registry — add every new tool here.
// Imported by the sitemap, cross-promo block, and the follow-up chat API.

import type { z } from "zod";
import type { ToolDefinition } from "./_types";
import contractScanner from "./contract-scanner";
import scorpCalculator from "./scorp-calculator";
import sponsorRate from "./sponsor-rate";
import taxEstimator from "./tax-estimator";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allTools: ToolDefinition<z.ZodTypeAny, any>[] = [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  taxEstimator as unknown as ToolDefinition<z.ZodTypeAny, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scorpCalculator as unknown as ToolDefinition<z.ZodTypeAny, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sponsorRate as unknown as ToolDefinition<z.ZodTypeAny, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contractScanner as unknown as ToolDefinition<z.ZodTypeAny, any>,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getToolBySlug(slug: string): ToolDefinition<z.ZodTypeAny, any> | undefined {
  return allTools.find((t) => t.slug === slug);
}
