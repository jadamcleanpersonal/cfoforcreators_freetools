"use client";
// Client boundary for the sponsor rate calculator.
// Imports sponsorRate directly so the Zod schema doesn't cross the server/client boundary.
// The server page (page.tsx) reads plain string metadata; this component handles all interactivity.

import type { ToolDefinition } from "@/tools/_types";
import sponsorRate from "@/tools/sponsor-rate";
import type { z } from "zod";
import ToolPage from "./ToolPage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tool = sponsorRate as unknown as ToolDefinition<z.ZodTypeAny, any>;

export default function SponsorRateCalculatorClient() {
  return <ToolPage tool={tool} />;
}
