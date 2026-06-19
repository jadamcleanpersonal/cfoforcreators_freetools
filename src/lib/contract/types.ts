// Contract scanner types and Zod schemas.
// Single source of truth — validates both client input and server-side AI output.

import { z } from "zod";

export const NICHES = [
  "gaming",
  "beauty",
  "finance",
  "lifestyle",
  "education",
  "tech",
  "other",
] as const;

// ── Input schema ──────────────────────────────────────────────────────────────

export const contractInputSchema = z.object({
  contract_text: z
    .string()
    .min(10, "paste the contract text to scan it")
    .max(50_000, "contract text exceeds the 50,000 character limit. try pasting the key sections"),
  creator_context: z
    .string()
    .max(2000, "creator context must be under 2,000 characters")
    .optional(),
  niche: z.enum(NICHES).optional(),
  save_clause_patterns: z.boolean().optional().default(false),
});

export type ContractInput = z.infer<typeof contractInputSchema>;

// ── Flagged clause ────────────────────────────────────────────────────────────

export const flaggedClauseSchema = z.object({
  category: z.enum(["risky", "unusual", "fine"]),
  quote: z.string(),
  explanation: z.string(),
  suggestedAction: z.string().optional(),
});

export type FlaggedClause = z.infer<typeof flaggedClauseSchema>;

// ── Scan result (stored in tool_results.outputs) ──────────────────────────────

export const scanResultSchema = z.object({
  verdict: z.enum(["yes", "no", "wait"]),
  verdictHeadline: z.string(),
  verdictReason: z.string(),
  flaggedClauses: z.array(flaggedClauseSchema),
  summary: z.string(),
});

export type ScanResult = z.infer<typeof scanResultSchema>;

// ── Streaming events ──────────────────────────────────────────────────────────
// Emitted by streamScan() as the AI response is parsed incrementally.

export const scanEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("verdict"),
    verdict: z.enum(["yes", "no", "wait"]),
    verdictHeadline: z.string(),
    verdictReason: z.string(),
  }),
  z.object({
    type: z.literal("flag"),
    category: z.enum(["risky", "unusual", "fine"]),
    quote: z.string(),
    explanation: z.string(),
    suggestedAction: z.string().optional(),
  }),
  z.object({
    type: z.literal("summary"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("done"),
    id: z.string(),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);

export type ScanEvent = z.infer<typeof scanEventSchema>;
