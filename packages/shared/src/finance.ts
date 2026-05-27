// Compound interest math with monthly compounding and contributions.
// Annual rate is converted to an equivalent monthly rate via (1+r)^(1/12)-1
// so reported APY matches actual annual growth.

export interface InvestmentInputs {
  initial: number; // initial deposit
  monthly: number; // monthly contribution
  annualRatePct: number; // annual interest rate in percent (e.g. 7 = 7%)
  years: number; // duration in years
  inflationPct: number; // expected annual inflation in percent
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
  const { initial, monthly, annualRatePct, years, inflationPct } = input;
  const r = annualRatePct / 100;
  const i = inflationPct / 100;
  const monthlyRate = Math.pow(1 + r, 1 / 12) - 1;

  const series: YearPoint[] = [];
  let balance = initial;
  let contributions = initial;

  series.push({
    year: 0,
    contributions,
    nominal: balance,
    real: balance,
    interest: 0,
  });

  const totalMonths = Math.max(0, Math.round(years * 12));
  for (let m = 1; m <= totalMonths; m++) {
    balance = balance * (1 + monthlyRate) + monthly;
    contributions += monthly;
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
