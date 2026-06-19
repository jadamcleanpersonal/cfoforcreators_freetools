// Unit tests for the clause pattern sanitizer.
// Verifies each regex correctly strips identifying info, and that
// malicious or identifiable patterns are rejected (return null).

import { sanitizePattern } from "@/lib/contract/sanitize_pattern";
import { describe, expect, it } from "vitest";

describe("sanitizePattern", () => {
  describe("dollar amount stripping", () => {
    it("strips a simple dollar amount", () => {
      const result = sanitizePattern("Creator receives $5,000 upon delivery.");
      expect(result).not.toContain("$5,000");
      expect(result).toContain("$AMOUNT");
    });

    it("strips dollar amounts with decimals", () => {
      const result = sanitizePattern("Kill fee of $250.00 applies if brand cancels.");
      expect(result).not.toContain("$250.00");
      expect(result).toContain("$AMOUNT");
    });

    it("strips multiple dollar amounts", () => {
      const result = sanitizePattern("$1,000 upfront, $2,000 on delivery.");
      expect(result).not.toMatch(/\$\d/);
    });
  });

  describe("percentage handling", () => {
    it("strips percentages over 50%", () => {
      const result = sanitizePattern("Brand takes 75% of secondary revenue.");
      expect(result).not.toContain("75%");
      expect(result).toContain("X%");
    });

    it("strips exactly 100%", () => {
      const result = sanitizePattern("Creator assigns 100% of IP rights.");
      expect(result).not.toContain("100%");
    });

    it("does NOT strip percentages at or below 50%", () => {
      const result = sanitizePattern("Creator retains 50% ownership of derivative works.");
      expect(result).toContain("50%");
    });

    it("does NOT strip low percentages like 25%", () => {
      const result = sanitizePattern("Kill fee is 25% of contract value.");
      expect(result).toContain("25%");
    });
  });

  describe("date stripping", () => {
    it("strips MM/DD/YYYY format", () => {
      const result = sanitizePattern("Agreement signed on 01/15/2024.");
      expect(result).not.toContain("01/15/2024");
      expect(result).toContain("DATE");
    });

    it("strips written dates like January 15, 2024", () => {
      const result = sanitizePattern("Effective January 15, 2024.");
      expect(result).not.toContain("2024");
      expect(result).toContain("DATE");
    });

    it("strips written dates with abbreviated month", () => {
      const result = sanitizePattern("Expires Feb 28, 2025.");
      expect(result).toContain("DATE");
    });
  });

  describe("URL stripping", () => {
    it("strips https URLs", () => {
      const result = sanitizePattern("Brand assets at https://brand.com/assets/2024/creator-kit");
      expect(result).not.toContain("https://");
      expect(result).toContain("URL");
    });

    it("strips http URLs", () => {
      const result = sanitizePattern("Submit deliverables at http://review.brandco.com/portal");
      expect(result).not.toContain("http://");
    });
  });

  describe("@ handle rejection", () => {
    it("returns null when pattern contains an @ handle", () => {
      const result = sanitizePattern("Tag @brandname in all posts per this agreement.");
      expect(result).toBeNull();
    });

    it("returns null when pattern contains an email", () => {
      const result = sanitizePattern("Send deliverables to contracts@brand.com upon completion.");
      expect(result).toBeNull();
    });
  });

  describe("entity name rejection", () => {
    it("returns null for company names with Inc suffix", () => {
      const result = sanitizePattern("Acme Brand Inc retains full creative control.");
      expect(result).toBeNull();
    });

    it("returns null for company names with LLC suffix", () => {
      const result = sanitizePattern("Creator Productions LLC grants perpetual license.");
      expect(result).toBeNull();
    });

    it("returns null for company names with Corp suffix", () => {
      const result = sanitizePattern("Giant Media Corp has approval rights over final edit.");
      expect(result).toBeNull();
    });

    it("does NOT reject single capitalized words (normal sentence start)", () => {
      const result = sanitizePattern("Creator grants a non-exclusive license for paid use.");
      expect(result).not.toBeNull();
    });
  });

  describe("length limit", () => {
    it("returns null for patterns over 500 chars", () => {
      const longPattern = "Creator grants license. ".repeat(30); // >500 chars
      const result = sanitizePattern(longPattern);
      expect(result).toBeNull();
    });

    it("accepts patterns at or under 500 chars", () => {
      const normalPattern =
        "Creator grants a non-exclusive, revocable license to use content for paid advertising purposes only.";
      const result = sanitizePattern(normalPattern);
      expect(result).not.toBeNull();
    });
  });

  describe("clean patterns pass through", () => {
    it("passes a typical exclusivity pattern", () => {
      const pattern =
        "Creator agrees not to promote competing products in the same category for 90 days following content publication.";
      const result = sanitizePattern(pattern);
      expect(result).not.toBeNull();
      expect(result).toContain("90 days");
    });

    it("passes a typical payment pattern", () => {
      const pattern =
        "Payment of $AMOUNT is due within 30 days of content going live, net of applicable taxes.";
      const result = sanitizePattern(pattern);
      expect(result).not.toBeNull();
    });

    it("trims leading/trailing whitespace", () => {
      const pattern = "  Creator grants non-exclusive license.  ";
      const result = sanitizePattern(pattern);
      expect(result).toBe("Creator grants non-exclusive license.");
    });
  });
});
