import type { CompoundInput } from "../schemas/scenario";

export type { CompoundInput };

export type CompoundResult = {
  finalValue: number;
  totalContributions: number;
  totalGains: number;
  timeSeries: Array<{
    month: number;
    contributions: number;
    value: number;
  }>;
};

/**
 * Compute compound interest FV with periodic contributions.
 *
 * Closed-form formula (for validation):
 *   FV = P*(1+r)^n + C*[((1+r)^n - 1)/r]*(1 + r*t)
 * where r = effective monthly rate = (1+annualReturnPct)^(1/12)-1
 * and t = 1 for "begin" timing, 0 for "end".
 *
 * Time series generated iteratively (architecture.md requirement — single loop,
 * avoids accumulating separate rounding error vs closed-form).
 */
export function calculateCompound(input: CompoundInput): CompoundResult {
  const {
    initialAmount,
    monthlyContribution,
    annualReturnPct,
    horizonYears,
    contributionTiming,
  } = input;

  // horizonYears === 0: no growth, return principal only
  if (horizonYears === 0) {
    return {
      finalValue: initialAmount,
      totalContributions: initialAmount,
      totalGains: 0,
      timeSeries: [{ month: 0, contributions: initialAmount, value: initialAmount }],
    };
  }

  const n = horizonYears * 12;

  // Effective geometric monthly rate (architecture.md: geometric, not r/12)
  const r = Math.pow(1 + annualReturnPct, 1 / 12) - 1;

  const timeSeries: CompoundResult["timeSeries"] = [
    { month: 0, contributions: initialAmount, value: initialAmount },
  ];

  let balance = initialAmount;

  for (let month = 1; month <= n; month++) {
    if (r === 0) {
      // r=0 degenerate: no compounding, pure linear accumulation
      balance = initialAmount + monthlyContribution * month;
    } else if (contributionTiming === "begin") {
      balance = (balance + monthlyContribution) * (1 + r);
    } else {
      balance = balance * (1 + r) + monthlyContribution;
    }

    timeSeries.push({
      month,
      contributions: initialAmount + monthlyContribution * month,
      value: balance,
    });
  }

  const finalValue = balance;
  const totalContributions = initialAmount + monthlyContribution * n;
  const totalGains = finalValue - totalContributions;

  return { finalValue, totalContributions, totalGains, timeSeries };
}

/**
 * Closed-form FV for validation/testing purposes.
 * Returns the analytically exact FV (no iteration rounding).
 */
export function compoundFVClosedForm(input: CompoundInput): number {
  const {
    initialAmount: P,
    monthlyContribution: C,
    annualReturnPct,
    horizonYears,
    contributionTiming,
  } = input;

  if (horizonYears === 0) return P;

  const n = horizonYears * 12;
  const r = Math.pow(1 + annualReturnPct, 1 / 12) - 1;
  const t = contributionTiming === "begin" ? 1 : 0;

  if (r === 0) return P + C * n;

  const growth = Math.pow(1 + r, n);
  return P * growth + C * ((growth - 1) / r) * (1 + r * t);
}
