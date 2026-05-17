import type { RealEstateInput } from "../schemas/scenario";
import { irr } from "./irr";

export type { RealEstateInput };

export type RealEstateTimeSeriesEntry = {
  month: number;
  rent: number;
  effectiveRent: number;
  expenses: number;
  interest: number;
  principal: number;
  tax: number;
  netCashflow: number;
  cumulativeCashflow: number;
  propertyValue: number;
  remainingBalance: number;
  equity: number;
};

export type RealEstateResult = {
  monthlyPayment: number;
  initialEquity: number;
  finalEquity: number;
  totalCashflow: number;
  averageMonthlyCashflow: number;
  grossYield: number;
  netYield: number;
  irr: number | null;
  breakEvenMonth: number | null;
  timeSeries: RealEstateTimeSeriesEntry[];
};

/**
 * Annuity mortgage monthly payment.
 * Uses CZ banking convention: nominal annual rate / 12 for monthly rate.
 */
function calcMonthlyPayment(
  loanAmount: number,
  annualRatePct: number,
  termYears: number
): number {
  if (loanAmount <= 0) return 0;

  const N = termYears * 12;
  const i = annualRatePct / 12;

  if (i === 0) {
    // Zero-rate edge case
    return loanAmount / N;
  }

  return (loanAmount * (i * Math.pow(1 + i, N))) / (Math.pow(1 + i, N) - 1);
}

/**
 * Compute real estate investment cashflow, equity build-up, IRR, and yields.
 *
 * CZ tax convention: interest is deductible against rental income;
 * depreciation is excluded from MVP scope.
 */
export function calculateRealEstate(input: RealEstateInput): RealEstateResult {
  const {
    purchasePrice,
    downPayment,
    mortgage,
    monthlyRent,
    monthlyExpenses,
    vacancyRatePct,
    maintenancePctOfRent,
    annualAppreciationPct,
    annualRentGrowthPct,
    incomeTaxPct,
    horizonYears,
    exitMonth,
  } = input;

  const loanAmount = purchasePrice - downPayment;
  const mortgageMonths = mortgage.termYears * 12;
  const totalMonths = exitMonth ?? horizonYears * 12;
  const monthlyPayment = calcMonthlyPayment(
    loanAmount,
    mortgage.annualRatePct,
    mortgage.termYears
  );

  // Effective monthly rates using geometric compounding
  const monthlyAppreciation = Math.pow(1 + annualAppreciationPct, 1 / 12) - 1;
  const monthlyRentGrowth = Math.pow(1 + annualRentGrowthPct, 1 / 12) - 1;
  const monthlyMortgageRate = mortgage.annualRatePct / 12;

  // Gross yield uses nominal annual rent / purchase price
  const grossYield = (12 * monthlyRent) / purchasePrice;

  const timeSeries: RealEstateTimeSeriesEntry[] = [];
  const irrCashflows: number[] = [-downPayment]; // CF[0] = initial investment

  let remainingBalance = loanAmount;
  let cumulativeCashflow = 0;
  let breakEvenMonth: number | null = null;
  let currentMonthlyRent = monthlyRent;

  for (let month = 1; month <= totalMonths; month++) {
    // Rent grows geometrically each month
    if (month > 1) {
      currentMonthlyRent = currentMonthlyRent * (1 + monthlyRentGrowth);
    }

    const effectiveRent = currentMonthlyRent * (1 - vacancyRatePct);
    const maintenance = effectiveRent * maintenancePctOfRent;
    const grossIncome = effectiveRent - monthlyExpenses - maintenance;

    // Mortgage: after termYears the loan is fully repaid
    const mortgageActive = month <= mortgageMonths && loanAmount > 0;
    const interestPayment = mortgageActive
      ? remainingBalance * monthlyMortgageRate
      : 0;
    const principalPayment = mortgageActive
      ? monthlyPayment - interestPayment
      : 0;

    // CZ tax: interest is deductible against rental income
    const taxableIncome = Math.max(0, grossIncome - interestPayment);
    const tax = taxableIncome * incomeTaxPct;

    const netCashflow = grossIncome - (mortgageActive ? monthlyPayment : 0) - tax;

    if (mortgageActive) {
      remainingBalance = Math.max(0, remainingBalance - principalPayment);
    }

    cumulativeCashflow += netCashflow;

    const propertyValue =
      purchasePrice * Math.pow(1 + monthlyAppreciation, month);
    const equity = propertyValue - remainingBalance;

    if (breakEvenMonth === null && cumulativeCashflow > 0) {
      breakEvenMonth = month;
    }

    const entry: RealEstateTimeSeriesEntry = {
      month,
      rent: currentMonthlyRent,
      effectiveRent,
      expenses: monthlyExpenses + maintenance,
      interest: interestPayment,
      principal: principalPayment,
      tax,
      netCashflow,
      cumulativeCashflow,
      propertyValue,
      remainingBalance,
      equity,
    };

    timeSeries.push(entry);

    if (month < totalMonths) {
      irrCashflows.push(netCashflow);
    } else {
      // Final month: include exit (sale proceeds after repaying mortgage)
      irrCashflows.push(netCashflow + propertyValue - remainingBalance);
    }
  }

  const lastEntry = timeSeries[timeSeries.length - 1];
  const finalEquity = lastEntry?.equity ?? downPayment;
  const totalCashflow = lastEntry?.cumulativeCashflow ?? 0;
  const averageMonthlyCashflow = totalMonths > 0 ? totalCashflow / totalMonths : 0;

  // Net yield: annual net operating income / purchase price (month 1 figures, no appreciation)
  const firstEffectiveRent = monthlyRent * (1 - vacancyRatePct);
  const firstMaintenance = firstEffectiveRent * maintenancePctOfRent;
  const netYield =
    (12 * (firstEffectiveRent - monthlyExpenses - firstMaintenance)) /
    purchasePrice;

  // Annualize monthly IRR: (1 + monthlyIRR)^12 - 1
  const monthlyIRR = irr(irrCashflows);
  const annualizedIRR =
    monthlyIRR !== null ? Math.pow(1 + monthlyIRR, 12) - 1 : null;

  return {
    monthlyPayment,
    initialEquity: downPayment,
    finalEquity,
    totalCashflow,
    averageMonthlyCashflow,
    grossYield,
    netYield,
    irr: annualizedIRR,
    breakEvenMonth,
    timeSeries,
  };
}
