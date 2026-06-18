// Parses NDJSON lines from the AI streaming response into typed ScanEvents.
// Handles malformed output gracefully — bad lines are skipped, not thrown.

import { scanEventSchema } from "./types";
import type { ScanEvent } from "./types";

/**
 * Parse a single NDJSON line into a ScanEvent.
 * Returns null if the line is invalid or doesn't match the expected schema.
 */
export function parseResponseLine(line: string): ScanEvent | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//")) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  const result = scanEventSchema.safeParse(parsed);
  if (!result.success) return null;

  return result.data;
}

/**
 * Process a new chunk of text combined with a carry-over buffer.
 * Returns completed ScanEvents and the remaining incomplete line buffer.
 */
export function parseChunk(
  buffer: string,
  newChunk: string,
): { events: ScanEvent[]; remaining: string } {
  const combined = buffer + newChunk;
  const lines = combined.split("\n");
  const remaining = lines.pop() ?? "";

  const events: ScanEvent[] = [];
  for (const line of lines) {
    const event = parseResponseLine(line);
    if (event) events.push(event);
  }

  return { events, remaining };
}

/**
 * Parse a complete response string (for testing / non-streaming use).
 * Returns all events found in the response.
 */
export function parseFullResponse(text: string): ScanEvent[] {
  const lines = text.split("\n");
  const events: ScanEvent[] = [];
  for (const line of lines) {
    const event = parseResponseLine(line);
    if (event) events.push(event);
  }
  return events;
}
