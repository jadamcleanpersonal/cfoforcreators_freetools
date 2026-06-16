"use client";
// Client boundary for the tax estimator tool.
// Imports taxEstimator directly so the Zod schema doesn't cross the server/client boundary.
// The server page (page.tsx) reads plain string metadata; this component handles all interactivity.

import type { z } from "zod";
import ToolPage from "./ToolPage";
import taxEstimator from "@/tools/tax-estimator";
import type { ToolDefinition } from "@/tools/_types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tool = taxEstimator as unknown as ToolDefinition<z.ZodTypeAny, any>;

export default function TaxEstimatorClient() {
  return <ToolPage tool={tool} />;
}
