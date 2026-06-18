// PII sanitizer — strips identifiable information before sending to the LLM.
// Defense in depth: Anthropic's terms don't require this, but we minimize PII exposure.
// Logs redaction counts (NOT the content) for monitoring.

export interface SanitizeResult {
  text: string;
  redactionCounts: {
    emails: number;
    phones: number;
    taxIds: number;
    bankAccounts: number;
  };
}

const PATTERNS = {
  // Email addresses
  email: /\b[\w.+%-]+@[\w-]+\.[\w.]+\b/g,
  // SSN format: XXX-XX-XXXX (with or without dashes)
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  // EIN format: XX-XXXXXXX
  ein: /\b\d{2}-\d{7}\b/g,
  // Bank account numbers (10+ consecutive digits — conservative to avoid false positives)
  // Run BEFORE phone so 10-digit strings aren't swallowed by the phone regex
  bankAccount: /\b\d{10,17}\b/g,
  // US phone numbers (various formats) — run AFTER bank accounts
  phone: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
} as const;

export function sanitizeContract(text: string): SanitizeResult {
  let result = text;
  let emailCount = 0;
  let phoneCount = 0;
  let taxIdCount = 0;
  let bankCount = 0;

  result = result.replace(PATTERNS.email, () => {
    emailCount++;
    return "[REDACTED-EMAIL]";
  });

  result = result.replace(PATTERNS.ssn, () => {
    taxIdCount++;
    return "[REDACTED-TAX-ID]";
  });

  result = result.replace(PATTERNS.ein, () => {
    taxIdCount++;
    return "[REDACTED-TAX-ID]";
  });

  // Bank accounts before phone — prevents 10-digit account numbers from
  // being swallowed by the phone regex
  result = result.replace(PATTERNS.bankAccount, () => {
    bankCount++;
    return "[REDACTED-ACCOUNT]";
  });

  result = result.replace(PATTERNS.phone, () => {
    phoneCount++;
    return "[REDACTED-PHONE]";
  });

  const redactionCounts = {
    emails: emailCount,
    phones: phoneCount,
    taxIds: taxIdCount,
    bankAccounts: bankCount,
  };

  const totalRedactions = emailCount + phoneCount + taxIdCount + bankCount;
  if (totalRedactions > 0) {
    console.log("[contract-sanitize] redacted before LLM send:", redactionCounts);
  }

  return { text: result, redactionCounts };
}
