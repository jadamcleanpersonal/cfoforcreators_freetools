"use client";
// Client boundary for the S-corp calculator.
// Imports scorpCalculator directly so the Zod schema doesn't cross the server/client boundary.
// The server page (page.tsx) reads plain string metadata; this component handles all interactivity.

import type { ToolDefinition } from "@/tools/_types";
import scorpCalculator from "@/tools/scorp-calculator";
import type { z } from "zod";
import ToolPage from "./ToolPage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tool = scorpCalculator as unknown as ToolDefinition<z.ZodTypeAny, any>;

export default function ScorpCalculatorClient() {
  return <ToolPage tool={tool} />;
}
