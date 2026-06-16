// State income tax computation.
// Reads bracket/flat/none data from src/data/states.ts.
// All dollar values are integers.

import { STATE_TAX_DATA, type StateTaxBracket } from "@/data/states";
import type { FilingStatus } from "./federal";

function applyStateBrackets(taxableIncome: number, brackets: StateTaxBracket[]): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= prev) break;
    const inBracket = Math.min(taxableIncome, bracket.upTo) - prev;
    tax += inBracket * bracket.rate;
    prev = bracket.upTo;
    if (bracket.upTo === Number.POSITIVE_INFINITY) break;
  }
  return Math.round(tax);
}

export interface StateTaxResult {
  stateTax: number;
  taxType: "none" | "flat" | "bracket";
  rate?: number; // effective rate for display
  note?: string;
}

/**
 * Compute state income tax.
 *
 * @param federalAgi  Federal AGI (net SE income + W-2 income - half SE tax deduction)
 * @param stateCode   2-letter state code (e.g. "CA")
 * @param filingStatus
 * @returns StateTaxResult
 *
 * Approximation: uses federal AGI as the state starting point. Many states
 * start from federal AGI and apply their own additions/subtractions. This is
 * close enough for a rough quarterly estimate; a CPA or Enrolled Agent should
 * confirm exact state liability at filing time.
 */
export function computeStateTax(
  federalAgi: number,
  stateCode: string,
  filingStatus: FilingStatus,
): StateTaxResult {
  const data = STATE_TAX_DATA[stateCode];

  if (!data) {
    // Unknown state — return 0 with a note
    return { stateTax: 0, taxType: "none", note: `No tax data available for ${stateCode}.` };
  }

  if (data.taxType === "none") {
    return { stateTax: 0, taxType: "none", note: data.note };
  }

  // Determine state standard deduction
  const stdDed = data.standardDeduction
    ? filingStatus === "married_joint"
      ? data.standardDeduction.married_joint
      : data.standardDeduction.single
    : 0;

  const stateTaxableIncome = Math.max(0, federalAgi - stdDed);

  if (data.taxType === "flat" && data.flatRate !== undefined) {
    const stateTax = Math.round(stateTaxableIncome * data.flatRate);
    const effectiveRate = federalAgi > 0 ? stateTax / federalAgi : 0;
    return { stateTax, taxType: "flat", rate: effectiveRate, note: data.note };
  }

  if (data.taxType === "bracket" && data.brackets) {
    const isJoint = filingStatus === "married_joint";
    const brackets =
      isJoint && data.brackets.married_joint ? data.brackets.married_joint : data.brackets.single;

    const stateTax = applyStateBrackets(stateTaxableIncome, brackets);
    const effectiveRate = federalAgi > 0 ? stateTax / federalAgi : 0;
    return { stateTax, taxType: "bracket", rate: effectiveRate, note: data.note };
  }

  return { stateTax: 0, taxType: "none" };
}
