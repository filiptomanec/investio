import type { CompoundInput, RealEstateInput } from "@investio/shared/schemas";

/**
 * Default scenario A: compound interest (S&P 500-like preset).
 * initial 100k, monthly 5k, 7% annual return, 20-year horizon.
 */
export const defaultScenarioA: CompoundInput = {
  type: "compound",
  initialAmount: 100_000,
  monthlyContribution: 5_000,
  annualReturnPct: 0.07, // 7% stored as decimal
  horizonYears: 20,
  contributionTiming: "end",
};

/**
 * Default scenario B: real estate (CZ flat preset).
 * purchasePrice 6M, downPayment 1.5M, mortgage 4.5%/30y, rent 22k, 20-year horizon.
 */
export const defaultScenarioB: RealEstateInput = {
  type: "real_estate",
  purchasePrice: 6_000_000,
  downPayment: 1_500_000,
  mortgage: {
    annualRatePct: 0.045, // 4.5% stored as decimal
    termYears: 30,
  },
  monthlyRent: 22_000,
  monthlyExpenses: 2_000,
  vacancyRatePct: 0.05,
  maintenancePctOfRent: 0.05,
  annualAppreciationPct: 0.03,
  annualRentGrowthPct: 0.02,
  incomeTaxPct: 0.15,
  horizonYears: 20,
};
