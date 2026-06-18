// streamScan — streams a contract scan via the Anthropic API.
// Yields ScanEvents as the AI response is parsed incrementally.
// This is the AI-driven replacement for the pure compute() function in other tools.

import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { parseChunk } from "./parse_response";
import { sanitizeContract } from "./sanitize";
import { CONTRACT_SCAN_SYSTEM_PROMPT } from "./system_prompt";
import type { ContractInput, ScanEvent } from "./types";

export async function* streamScan(input: ContractInput): AsyncGenerator<ScanEvent> {
  const sanitized = sanitizeContract(input.contract_text);

  const parts: string[] = [`Contract text:\n\n${sanitized.text}`];
  if (input.creator_context) {
    parts.push(
      `\nCreator context (what the creator told us about this deal):\n${input.creator_context}`,
    );
  }
  if (input.niche) {
    parts.push(`\nCreator niche: ${input.niche}`);
  }

  const userMessage = parts.join("\n");

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: CONTRACT_SCAN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 3000,
    temperature: 0.1,
  });

  let buffer = "";

  for await (const chunk of result.textStream) {
    const { events, remaining } = parseChunk(buffer, chunk);
    buffer = remaining;
    for (const event of events) {
      yield event;
    }
  }

  // Flush any remaining buffer after stream ends
  if (buffer.trim()) {
    const { events } = parseChunk("", buffer);
    for (const event of events) {
      yield event;
    }
  }
}
