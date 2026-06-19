// Brand Contract Scanner — ToolDefinition
// AI-driven tool (isAiDriven: true). No compute() — the API route calls streamScan() directly.
// Zod schema validates client + server (single source of truth).

import { contractInputSchema } from "@/lib/contract/types";
import type { ScanResult } from "@/lib/contract/types";
import type { ToolDefinition } from "./_types";

export { contractInputSchema };
export type { ScanResult };

// ── ToolDefinition ─────────────────────────────────────────────────────────────
const tool: ToolDefinition<typeof contractInputSchema, ScanResult> = {
  slug: "contract-scanner",
  title: "Brand contract scanner for creators. free, AI-powered.",
  oneLiner:
    "paste your brand deal contract. get a plain-English breakdown of risky clauses, what's standard, and what to negotiate. no legal advice. just clarity.",
  metaTitle: "Free brand contract review for content creators (AI-powered, no signup)",
  metaDescription:
    "paste your brand sponsorship contract. get a plain-English breakdown of risky clauses, what's standard, and what to negotiate. free, no signup, no legal advice. just clarity.",
  priority: 3,
  isAiDriven: true,

  inputs: contractInputSchema,
  inputFields: [
    {
      name: "contract_text",
      label: "contract text",
      helpText:
        "paste the full contract text here. we strip email addresses, phone numbers, and tax IDs before sending to the AI.",
      type: "textarea",
      placeholder:
        "paste your brand deal contract here (up to 50,000 characters, about 35 pages)...",
      required: true,
    },
    {
      name: "creator_context",
      label: "context about this deal (optional)",
      helpText:
        "what's this deal about? who's the brand? anything discussed verbally that isn't in the contract? this helps the scan weigh clauses against your specific situation.",
      type: "textarea",
      placeholder:
        "e.g. 'YouTube integration for a skincare brand, $5k, they mentioned verbally that I can keep the product but that's not in the contract...'",
      required: false,
    },
    {
      name: "niche",
      label: "your content niche (optional)",
      helpText:
        "helps interpret deliverable-specific risk (e.g. beauty deals often have stricter exclusivity than gaming deals)",
      type: "radio",
      options: [
        { value: "gaming", label: "gaming" },
        { value: "beauty", label: "beauty / fashion" },
        { value: "finance", label: "finance / business" },
        { value: "lifestyle", label: "lifestyle / travel" },
        { value: "education", label: "education / how-to" },
        { value: "tech", label: "tech / programming" },
        { value: "other", label: "other" },
      ],
      required: false,
    },
  ],

  explainerSlug: "how-to-read-a-brand-contract",
  explainerExcerpt:
    "every clause in a brand contract exists because a brand's lawyer put it there to protect the brand. here's how to read them like someone who's been on both sides of the table.",

  buildShareText: (out: ScanResult) => {
    if (out.verdict === "no") {
      return `caught some serious issues in my brand deal contract. almost signed without seeing them →`;
    }
    if (out.verdict === "wait") {
      return `there are clauses to negotiate in this brand deal before i sign →`;
    }
    return `ran my brand deal contract through this scanner. clean. signing it →`;
  },

  ogTemplate: "result-headline",
  relatedTools: ["tax-estimator", "scorp-calculator"],
};

export default tool;
