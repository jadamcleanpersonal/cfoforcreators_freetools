// IRS safe harbor computation for estimated tax payments.
//
// IRS safe harbor rule (IRC § 6654):
//   Pay the LESSER of:
//     (a) 90% of current-year tax liability, OR
//     (b) 100% of prior-year tax (110% if prior-year AGI > $150k)
//
// v1 limitation: We don't ask for prior-year tax (too much friction at signup).
// We use method (a) — 90% of projected current-year tax — only.
// This is disclosed to the user in the result.
//
// A creator using method (b) might owe less in quarterly payments if their
// income is growing. We flag this in the methodology explainer.

export interface SafeHarborResult {
  threshold: number; // integer dollars — total annual payment needed for safe harbor
  methodologyNote: string; // shown in result caveat
}

/**
 * Compute the safe harbor threshold for annual estimated tax payments.
 *
 * @param projectedAnnualTax  Total projected federal + state tax for the year (integer $)
 * @returns SafeHarborResult
 */
export function computeSafeHarbor(projectedAnnualTax: number): SafeHarborResult {
  // Method A: 90% of current-year projected tax
  const threshold = Math.ceil(projectedAnnualTax * 0.9);

  const methodologyNote =
    "We use the 90%-of-current-year method (IRS method A). " +
    "If you paid taxes last year, you may also qualify for safe harbor by paying 100% of last year's bill " +
    "(or 110% if last year's AGI was over $150k), whichever is less. " +
    "A CPA can run both methods if your income dropped significantly.";

  return { threshold, methodologyNote };
}
