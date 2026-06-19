// Extracts anonymized clause patterns from a completed scan and inserts them
// into contract_clause_patterns. Only called if the user opted in.
// Uses Anthropic to strip identifiers from each flagged clause.
// Validates with sanitizePattern before inserting — drops rows that fail.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanitizePattern } from "./sanitize_pattern";
import type { FlaggedClause } from "./types";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

// Clause type mapping from flagged category to DB enum
// We infer clause_type from the scan's clause quote via the model
const VALID_CLAUSE_TYPES = [
  "exclusivity",
  "usage_rights",
  "payment_terms",
  "kill_fee",
  "content_approval",
  "ip_assignment",
  "indemnification",
  "term_length",
  "morality_clause",
  "other",
] as const;

type ClauseType = (typeof VALID_CLAUSE_TYPES)[number];

function isValidClauseType(s: string): s is ClauseType {
  return (VALID_CLAUSE_TYPES as readonly string[]).includes(s);
}

export interface ClausePatternContext {
  niche: string;
  platform: string;
  audienceTier: "<10k" | "10-100k" | "100k-1M" | "1M+";
  dealSizeTier: "under_1k" | "1k-5k" | "5k-25k" | "25k+";
  sourceScanId: string;
}

const EXTRACTION_SYSTEM_PROMPT = `You are extracting an anonymized pattern from a brand deal contract clause.
Strip ALL identifying info: party names, dollar amounts, dates, platforms named explicitly, percentages above 50.
Return ONLY a JSON object with two fields:
- "clause_type": one of: exclusivity, usage_rights, payment_terms, kill_fee, content_approval, ip_assignment, indemnification, term_length, morality_clause, other
- "pattern": the structural pattern of the clause in 1-3 sentences, plain English

Example input: "Creator John Doe grants Acme Brand a perpetual worldwide license to use all video content created under this Agreement for marketing across YouTube and Meta platforms for $5,000 paid Net 60."
Example output: {"clause_type": "usage_rights", "pattern": "Creator grants perpetual worldwide license to all content for paid and organic use across platforms with Net 60 payment."}

Return ONLY valid JSON. No markdown. No explanation.`;

async function extractPatternFromClause(
  clause: FlaggedClause,
): Promise<{ clauseType: ClauseType; patternRedacted: string } | null> {
  let rawText: string;
  try {
    const result = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: EXTRACTION_SYSTEM_PROMPT,
      prompt: `Extract from this clause:\n\n${clause.quote}`,
      maxTokens: 256,
      temperature: 0,
    });
    rawText = result.text;
  } catch (err) {
    console.error("[clause-pattern] Anthropic call failed:", err);
    return null;
  }

  let parsed: { clause_type?: string; pattern?: string };
  try {
    parsed = JSON.parse(rawText.trim());
  } catch {
    console.error("[clause-pattern] failed to parse model JSON:", rawText.slice(0, 200));
    return null;
  }

  const clauseType = parsed.clause_type ?? "other";
  const rawPattern = parsed.pattern ?? "";

  if (!isValidClauseType(clauseType) || !rawPattern) return null;

  const sanitized = sanitizePattern(rawPattern);
  if (!sanitized) {
    console.warn("[clause-pattern] sanitization failed — dropping row");
    return null;
  }

  return { clauseType: clauseType as ClauseType, patternRedacted: sanitized };
}

export async function extractAndSaveClausePatterns(
  flaggedClauses: FlaggedClause[],
  ctx: ClausePatternContext,
): Promise<void> {
  if (flaggedClauses.length === 0) return;

  for (const clause of flaggedClauses) {
    const extracted = await extractPatternFromClause(clause);
    if (!extracted) continue;

    const { error } = await supabaseAdmin.from("contract_clause_patterns").insert({
      clause_type: extracted.clauseType,
      niche: ctx.niche,
      platform: ctx.platform,
      audience_tier: ctx.audienceTier,
      deal_size_tier: ctx.dealSizeTier,
      clause_pattern_redacted: extracted.patternRedacted,
      source_scan_id: ctx.sourceScanId,
    });

    if (error) {
      console.error("[clause-pattern] DB insert failed:", error.message);
    }
  }
}
