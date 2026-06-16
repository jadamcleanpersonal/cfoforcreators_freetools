// Quarterly estimated tax payment logic.
//
// IRS quarterly deadlines (for calendar-year taxpayers):
//   Q1 (Jan 1 – Mar 31)  → due Apr 15
//   Q2 (Apr 1 – May 31)  → due Jun 15   ← yes, the gap is intentional
//   Q3 (Jun 1 – Aug 31)  → due Sep 15
//   Q4 (Sep 1 – Dec 31)  → due Jan 15 of following year
//
// Source: IRS Publication 505 (Tax Withholding and Estimated Tax)

export type Quarter = "q1" | "q2" | "q3" | "q4";
export type Verdict = "yes" | "no" | "wait";

export interface QuarterDeadline {
  label: string;     // "April 15, 2025"
  isoDate: string;   // "2025-04-15"
}

// Deadlines keyed by tax year and quarter
export function getDeadline(taxYear: number, quarter: Quarter): QuarterDeadline {
  switch (quarter) {
    case "q1":
      return {
        label: `April 15, ${taxYear}`,
        isoDate: `${taxYear}-04-15`,
      };
    case "q2":
      return {
        label: `June 15, ${taxYear}`,
        isoDate: `${taxYear}-06-15`,
      };
    case "q3":
      return {
        label: `September 15, ${taxYear}`,
        isoDate: `${taxYear}-09-15`,
      };
    case "q4":
      return {
        label: `January 15, ${taxYear + 1}`,
        isoDate: `${taxYear + 1}-01-15`,
      };
  }
}

// How many quarters have elapsed (for annualization and cumulative payment math)
export function quartersElapsed(quarter: Quarter): number {
  return { q1: 1, q2: 2, q3: 3, q4: 4 }[quarter];
}

// Penalty rate for underpayment — IRS adjusts quarterly (federal short-term rate + 3%).
// 2024-2025: 8%. We use 8% as a conservative estimate.
// Source: IRS IR-2023-217 and IRS Rev. Rul. 2024-01
const UNDERPAYMENT_PENALTY_ANNUAL_RATE = 0.08;

// Rough days past due for each quarter (approximate midpoint of the overdue period)
// Used only for penalty estimation in "wait" verdict.
function estimatedDaysPastDue(quarter: Quarter, taxYear: number, currentQuarter: Quarter): number {
  const currentDate = new Date();
  const dueDate = new Date(getDeadline(taxYear, quarter).isoDate);
  const daysPast = Math.max(0, Math.round((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  return daysPast;
}

export interface QuarterlyPaymentInput {
  safeHarborThreshold: number;     // annual safe harbor amount (from computeSafeHarbor)
  alreadyPaidEstimatedTaxes: number; // YTD estimated tax payments
  withholdingFromW2: number;        // YTD W-2 federal withholding
  currentQuarter: Quarter;
  taxYear: number;
}

export interface QuarterlyPaymentResult {
  verdict: Verdict;
  amountDueThisQuarter: number;    // integer $, 0 if verdict is "no"
  totalPaidToDate: number;
  shouldHavePaidToDate: number;
  underpaidAmount: number;          // > 0 only in "wait"
  penaltyEstimate: number;          // > 0 only in "wait"
  deadline: QuarterDeadline;
  verdictHeadline: string;
  verdictReason: string;
}

export function computeQuarterlyPayment(input: QuarterlyPaymentInput): QuarterlyPaymentResult {
  const {
    safeHarborThreshold,
    alreadyPaidEstimatedTaxes,
    withholdingFromW2,
    currentQuarter,
    taxYear,
  } = input;

  const elapsed = quartersElapsed(currentQuarter);
  const totalPaidToDate = alreadyPaidEstimatedTaxes + withholdingFromW2;
  const deadline = getDeadline(taxYear, currentQuarter);

  // How much should have been paid by end of this quarter for safe harbor?
  // IRS allows equal quarterly installments: threshold / 4 per quarter.
  const shouldHavePaidToDate = Math.ceil((safeHarborThreshold / 4) * elapsed);

  // How much to send this quarter (this quarter's share minus anything extra already paid)
  const thisQuarterShare = Math.ceil(safeHarborThreshold / 4);
  const amountDueThisQuarter = Math.max(0, shouldHavePaidToDate - totalPaidToDate);

  // ── Verdict logic ──────────────────────────────────────────────────────
  // "no": W-2 withholding + prior payments already cover the full safe harbor for the year
  if (totalPaidToDate >= safeHarborThreshold) {
    return {
      verdict: "no",
      amountDueThisQuarter: 0,
      totalPaidToDate,
      shouldHavePaidToDate,
      underpaidAmount: 0,
      penaltyEstimate: 0,
      deadline,
      verdictHeadline: "you don't owe a payment right now",
      verdictReason:
        "your W-2 withholding and prior estimated payments already cover your full safe harbor for the year. " +
        "no quarterly check needed this period.",
    };
  }

  // "wait": they're behind on PAST quarters (not just the current one)
  // Triggered when total paid < what should have been paid by the END OF THE PRIOR quarter
  const priorQuarterAmount =
    elapsed > 1
      ? Math.ceil((safeHarborThreshold / 4) * (elapsed - 1))
      : 0;

  const behindOnPriorQuarters = elapsed > 1 && totalPaidToDate < priorQuarterAmount;

  if (behindOnPriorQuarters) {
    const underpaidAmount = priorQuarterAmount - totalPaidToDate;

    // Estimate penalty: 8% annualized on the underpaid amount for each prior quarter
    // Rough approximation: assume average 4 months late
    let penaltyEstimate = 0;
    for (let q = 1; q < elapsed; q++) {
      const priorQ = ["q1", "q2", "q3", "q4"][q - 1] as Quarter;
      const quarterShare = Math.ceil(safeHarborThreshold / 4);
      const paidThisQuarter = totalPaidToDate >= quarterShare * q ? 0 : quarterShare;
      const days = estimatedDaysPastDue(priorQ, taxYear, currentQuarter);
      if (days > 0 && paidThisQuarter > 0) {
        penaltyEstimate += Math.round(paidThisQuarter * UNDERPAYMENT_PENALTY_ANNUAL_RATE * (days / 365));
      }
    }
    // Floor at a minimum estimate
    if (penaltyEstimate === 0 && underpaidAmount > 0) {
      penaltyEstimate = Math.round(underpaidAmount * UNDERPAYMENT_PENALTY_ANNUAL_RATE * (90 / 365));
    }

    const catchUpTotal = amountDueThisQuarter;

    return {
      verdict: "wait",
      amountDueThisQuarter: catchUpTotal,
      totalPaidToDate,
      shouldHavePaidToDate,
      underpaidAmount,
      penaltyEstimate,
      deadline,
      verdictHeadline: `send $${catchUpTotal.toLocaleString()} by ${deadline.label} to catch up`,
      verdictReason:
        `you missed one or more prior quarterly payments (underpaid by ~$${underpaidAmount.toLocaleString()}). ` +
        `sending $${catchUpTotal.toLocaleString()} now catches you up through ${currentQuarter.toUpperCase()}. ` +
        `the IRS underpayment penalty is typically small — estimated ~$${penaltyEstimate.toLocaleString()} — ` +
        `but you can't avoid it by paying now. an Enrolled Agent can confirm your exact penalty.`,
    };
  }

  // "yes": on track, here's this quarter's payment
  return {
    verdict: "yes",
    amountDueThisQuarter: Math.max(0, thisQuarterShare - Math.max(0, totalPaidToDate - priorQuarterAmount)),
    totalPaidToDate,
    shouldHavePaidToDate,
    underpaidAmount: 0,
    penaltyEstimate: 0,
    deadline,
    verdictHeadline: `send $${Math.max(0, thisQuarterShare - Math.max(0, totalPaidToDate - priorQuarterAmount)).toLocaleString()} by ${deadline.label}`,
    verdictReason:
      `this keeps you inside safe harbor for ${currentQuarter.toUpperCase()}. ` +
      `you\u2019ve paid $${totalPaidToDate.toLocaleString()} so far this year.`,
  };
}
