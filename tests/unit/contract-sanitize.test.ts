// PII sanitizer tests.
// Verifies each pattern is correctly stripped and redaction counts are accurate.

import { sanitizeContract } from "@/lib/contract/sanitize";
import { describe, expect, it, vi } from "vitest";

// Suppress console.log output in tests
vi.spyOn(console, "log").mockImplementation(() => {});

describe("sanitizeContract", () => {
  describe("email addresses", () => {
    it("strips a simple email", () => {
      const { text, redactionCounts } = sanitizeContract("Contact legal@brandco.com for questions.");
      expect(text).toBe("Contact [REDACTED-EMAIL] for questions.");
      expect(redactionCounts.emails).toBe(1);
    });

    it("strips multiple emails", () => {
      const { text, redactionCounts } = sanitizeContract(
        "send to jane@creator.io and contracts@brand.com and cc billing@agency.net",
      );
      expect(text).not.toMatch(/\S+@\S+\.\S+/);
      expect(redactionCounts.emails).toBe(3);
    });

    it("strips emails with subdomains and plus signs", () => {
      const { text, redactionCounts } = sanitizeContract("reply to jane+creator@mail.example.co.uk");
      expect(text).toBe("reply to [REDACTED-EMAIL]");
      expect(redactionCounts.emails).toBe(1);
    });

    it("does not alter text without emails", () => {
      const plain = "This is a standard contract clause with no PII.";
      const { text, redactionCounts } = sanitizeContract(plain);
      expect(text).toBe(plain);
      expect(redactionCounts.emails).toBe(0);
    });
  });

  describe("phone numbers", () => {
    it("strips a standard US phone number", () => {
      const { text, redactionCounts } = sanitizeContract(
        "call us at 212-555-0100 for questions.",
      );
      expect(text).toBe("call us at [REDACTED-PHONE] for questions.");
      expect(redactionCounts.phones).toBe(1);
    });

    it("strips phone numbers with parentheses and spaces", () => {
      const { text, redactionCounts } = sanitizeContract("phone: (800) 555 1234");
      expect(text).toContain("[REDACTED-PHONE]");
      expect(redactionCounts.phones).toBe(1);
    });

    it("strips phone numbers with country code", () => {
      const { text, redactionCounts } = sanitizeContract("reach us at +1-800-555-9999");
      expect(text).toContain("[REDACTED-PHONE]");
      expect(redactionCounts.phones).toBe(1);
    });

    it("strips phone numbers with dots", () => {
      const { text, redactionCounts } = sanitizeContract("tel: 415.555.0199");
      expect(text).toContain("[REDACTED-PHONE]");
      expect(redactionCounts.phones).toBe(1);
    });
  });

  describe("tax IDs and SSNs", () => {
    it("strips a dashed SSN pattern", () => {
      const { text, redactionCounts } = sanitizeContract("SSN: 123-45-6789");
      expect(text).toBe("SSN: [REDACTED-TAX-ID]");
      expect(redactionCounts.taxIds).toBe(1);
    });

    it("strips an EIN pattern", () => {
      const { text, redactionCounts } = sanitizeContract("EIN 12-3456789");
      expect(text).toContain("[REDACTED-TAX-ID]");
      expect(redactionCounts.taxIds).toBe(1);
    });

    it("strips multiple tax IDs", () => {
      const { text, redactionCounts } = sanitizeContract(
        "Contractor SSN: 987-65-4321, Company EIN: 54-3210987",
      );
      expect(text).not.toMatch(/\d{3}-\d{2}-\d{4}/);
      expect(redactionCounts.taxIds).toBe(2);
    });
  });

  describe("bank account numbers", () => {
    it("strips a 10-digit account number", () => {
      const { text, redactionCounts } = sanitizeContract("account: 1234567890");
      expect(text).toContain("[REDACTED-ACCOUNT]");
      expect(redactionCounts.bankAccounts).toBe(1);
    });

    it("strips longer account numbers", () => {
      const { text, redactionCounts } = sanitizeContract("routing 021000021 account 123456789012");
      expect(text).not.toMatch(/\b\d{10,17}\b/);
      expect(redactionCounts.bankAccounts).toBeGreaterThan(0);
    });

    it("does not strip normal dollar amounts or short numbers", () => {
      const { text, redactionCounts } = sanitizeContract(
        "payment of $5000 due within 30 days",
      );
      expect(text).toBe("payment of $5000 due within 30 days");
      expect(redactionCounts.bankAccounts).toBe(0);
    });
  });

  describe("combined redaction", () => {
    it("strips all PII types in a single pass", () => {
      const mixed =
        "Creator: jane@creator.io, Phone: 212-555-0100, SSN: 123-45-6789. Payment to account 1234567890.";
      const { text, redactionCounts } = sanitizeContract(mixed);

      expect(text).not.toMatch(/\S+@\S+\.\S+/);
      expect(text).not.toMatch(/\d{3}-\d{2}-\d{4}/);
      expect(text).toContain("[REDACTED-EMAIL]");
      expect(text).toContain("[REDACTED-PHONE]");
      expect(text).toContain("[REDACTED-TAX-ID]");
      expect(text).toContain("[REDACTED-ACCOUNT]");
      expect(redactionCounts.emails).toBeGreaterThan(0);
      expect(redactionCounts.phones).toBeGreaterThan(0);
      expect(redactionCounts.taxIds).toBeGreaterThan(0);
      expect(redactionCounts.bankAccounts).toBeGreaterThan(0);
    });

    it("returns redactionCounts of zero for clean text", () => {
      const clean = "Creator shall deliver one (1) sponsored YouTube video per the brief attached.";
      const { redactionCounts } = sanitizeContract(clean);
      expect(redactionCounts.emails).toBe(0);
      expect(redactionCounts.phones).toBe(0);
      expect(redactionCounts.taxIds).toBe(0);
      expect(redactionCounts.bankAccounts).toBe(0);
    });
  });

  describe("contract text preservation", () => {
    it("preserves clause language and punctuation", () => {
      const clause =
        'Brand grants Creator a non-exclusive, royalty-free license to use the Brand\'s logo ("Brand Assets") solely for the purposes outlined in this Agreement.';
      const { text } = sanitizeContract(clause);
      expect(text).toBe(clause);
    });

    it("preserves dollar amounts", () => {
      const { text } = sanitizeContract("Creator shall receive $7,500 USD within Net-30 days.");
      expect(text).toBe("Creator shall receive $7,500 USD within Net-30 days.");
    });
  });
});
