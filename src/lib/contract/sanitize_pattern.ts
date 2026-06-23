// Sanitizes a raw clause pattern string extracted from a contract.
// Strips dollar amounts, high percentages, dates, URLs, handles, and entity names.
// Returns the sanitized string or null if sanitization fails (drop the row).

export function sanitizePattern(raw: string): string | null {
  let s = raw;

  // Strip dollar amounts: $X,XXX or $X.XX
  s = s.replace(/\$[\d,]+(\.\d+)?/g, "$AMOUNT");

  // Strip percentages over 50% (under is structural)
  s = s.replace(/\b(5[1-9]|[6-9]\d|100)%/g, "X%");

  // Strip dates: MM/DD/YYYY or MM/DD/YY
  s = s.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "DATE");

  // Strip written dates: January 15, 2024 / Jan 15 2024
  s = s.replace(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2},?\s+\d{4}\b/gi,
    "DATE",
  );

  // Strip URLs
  s = s.replace(/https?:\/\/\S+/g, "URL");

  // Reject if has @ handles or email-like patterns
  if (/@\w+/.test(s)) return null;

  // Reject if has capitalized proper-noun-like sequences (e.g. "Acme Brand Inc")
  if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+(Inc|LLC|Corp|Ltd|Co)\b/.test(s)) return null;

  // Reject if still over 500 chars after sanitization
  if (s.length > 500) return null;

  // Must have at least some real content left
  if (s.trim().length < 10) return null;

  return s.trim();
}
