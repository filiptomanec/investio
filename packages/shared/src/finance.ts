// Compound interest math with monthly compounding and contributions.
// Annual rate is converted to an equivalent monthly rate via (1+r)^(1/12)-1
// so reported APY matches actual annual growth.

export interface InvestmentInputs {
  initial: number; // initial deposit
  monthly: number; // monthly contribution
  annualRatePct: number; // annual interest rate in percent (e.g. 7 = 7%)
  years: number; // duration in years
  inflationPct: number; // expected annual inflation in percent
  // When true, the monthly contribution is multiplied by (1+inflation)^year
  // each year so its real value stays constant. Only meaningful when
  // inflationPct > 0.
  increaseMonthlyWithInflation?: boolean;
}

export interface YearPoint {
  year: number;
  contributions: number; // cumulative contributions (incl. initial)
  nominal: number; // nominal balance at end of year
  real: number; // inflation-adjusted (today's purchasing power)
  interest: number; // nominal - contributions
}

export interface InvestmentResult {
  series: YearPoint[];
  totalContributions: number;
  finalNominal: number;
  finalReal: number;
  totalInterest: number;
  purchasingPowerLoss: number;
}

export function calculateInvestment(input: InvestmentInputs): InvestmentResult {
  const {
    initial,
    monthly,
    annualRatePct,
    years,
    inflationPct,
    increaseMonthlyWithInflation = false,
  } = input;
  const r = annualRatePct / 100;
  const i = inflationPct / 100;
  const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;

  const series: YearPoint[] = [];
  let balance = initial;
  let contributions = initial;
  // Active monthly contribution for the current 12-month block.
  let currentMonthly = monthly;

  series.push({
    year: 0,
    contributions,
    nominal: balance,
    real: balance,
    interest: 0,
  });

  const totalMonths = Math.max(0, Math.round(years * 12));
  for (let m = 1; m <= totalMonths; m++) {
    balance = balance * (1 + monthlyRate) + currentMonthly;
    contributions += currentMonthly;
    if (m % 12 === 0) {
      const year = m / 12;
      const real = balance / Math.pow(1 + i, year);
      series.push({
        year,
        contributions,
        nominal: balance,
        real,
        interest: balance - contributions,
      });
      // After closing the year, bump next year's contribution by inflation
      // so its purchasing power stays flat.
      if (increaseMonthlyWithInflation && year < years) {
        currentMonthly = currentMonthly * (1 + i);
      }
    }
  }

  const last = series[series.length - 1];
  return {
    series,
    totalContributions: last.contributions,
    finalNominal: last.nominal,
    finalReal: last.real,
    totalInterest: last.nominal - last.contributions,
    purchasingPowerLoss: last.nominal - last.real,
  };
}

export interface RentaInputs {
  // Target monthly retirement income in today's purchasing power.
  targetMonthlyToday: number;
  // Years until retirement (= years of accumulation).
  years: number;
  // Expected annual return during accumulation.
  annualRatePct: number;
  // Expected annual inflation.
  inflationPct: number;
  // Safe withdrawal rate in retirement (% per year).
  withdrawalRatePct: number;
  // Optional initial deposit.
  initial: number;
}

export interface RentaResult {
  // Portfolio needed in today's purchasing power.
  requiredRealPortfolio: number;
  // Portfolio needed in nominal money at the retirement date.
  requiredNominalPortfolio: number;
  // Monthly contribution required (can be negative if the initial deposit
  // already overshoots the target — caller treats as "no need to contribute").
  requiredMonthly: number;
}

// Given a desired retirement income (in today's purchasing power), solve for
// the monthly contribution required to reach the target portfolio.
//
// Math:
//   realPortfolio = annualIncomeToday / withdrawalRate
//   nominalPortfolio = realPortfolio * (1 + inflation)^years
//   FV = initial * (1+rm)^N + PMT * [((1+rm)^N - 1) / rm]
//   → PMT = (FV - initial * (1+rm)^N) * rm / ((1+rm)^N - 1)
// Where rm = (1 + annualRate)^(1/12) − 1 and N = years * 12.
export function solveMonthlyForTargetIncome(input: RentaInputs): RentaResult {
  const {
    targetMonthlyToday,
    years,
    annualRatePct,
    inflationPct,
    withdrawalRatePct,
    initial,
  } = input;

  const wr = withdrawalRatePct / 100;
  const requiredRealPortfolio = wr > 0 ? (targetMonthlyToday * 12) / wr : 0;
  const requiredNominalPortfolio =
    requiredRealPortfolio * Math.pow(1 + inflationPct / 100, years);

  const r = annualRatePct / 100;
  const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;
  const n = Math.max(0, Math.round(years * 12));
  const futureOfInitial = initial * Math.pow(1 + monthlyRate, n);

  let requiredMonthly: number;
  if (n === 0) {
    requiredMonthly = 0;
  } else if (Math.abs(monthlyRate) < 1e-12) {
    requiredMonthly = (requiredNominalPortfolio - initial) / n;
  } else {
    const annuityFactor = (Math.pow(1 + monthlyRate, n) - 1) / monthlyRate;
    requiredMonthly = (requiredNominalPortfolio - futureOfInitial) / annuityFactor;
  }

  return {
    requiredRealPortfolio,
    requiredNominalPortfolio,
    requiredMonthly,
  };
}
