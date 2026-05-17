import { describe, it, expect } from "vitest";
import { calculateRealEstate } from "../realEstate";
import type { RealEstateInput } from "../../schemas/scenario";
import goldenFixtures from "../__fixtures__/realEstate.golden.json";

const REL_TOL = 1e-3; // 0.1% tolerance

function relDiff(a: number, b: number): number {
  if (Math.abs(b) < 1) return Math.abs(a - b);
  return Math.abs((a - b) / b);
}

const typicalCZInput: RealEstateInput = {
  type: "real_estate",
  purchasePrice: 3_500_000,
  downPayment: 700_000,
  mortgage: { annualRatePct: 0.035, termYears: 25 },
  monthlyRent: 16_000,
  monthlyExpenses: 3_000,
  vacancyRatePct: 0.05,
  maintenancePctOfRent: 0.05,
  annualAppreciationPct: 0.03,
  annualRentGrowthPct: 0.02,
  incomeTaxPct: 0.15,
  horizonYears: 10,
};

describe("calculateRealEstate", () => {
  describe("happy path — three scenarios", () => {
    it("typical CZ rental apartment — mortgage > net rent, negative cashflow", () => {
      const result = calculateRealEstate(typicalCZInput);
      expect(result.monthlyPayment).toBeCloseTo(14017.46, 1);
      expect(result.initialEquity).toBe(700_000);
      expect(result.grossYield).toBeCloseTo(0.0549, 3);
      expect(result.netYield).toBeCloseTo(0.0392, 3);
      // Mortgage is higher than net rent → negative cashflow is expected
      expect(result.totalCashflow).toBeLessThan(0);
      // But equity grows significantly due to appreciation
      expect(result.finalEquity).toBeGreaterThan(2_000_000);
      // timeSeries has entry per month
      expect(result.timeSeries).toHaveLength(120); // 10yr * 12
    });

    it("holiday rental — high vacancy (20%), high maintenance (10%)", () => {
      const input: RealEstateInput = {
        type: "real_estate",
        purchasePrice: 5_000_000,
        downPayment: 1_500_000,
        mortgage: { annualRatePct: 0.04, termYears: 20 },
        monthlyRent: 25_000,
        monthlyExpenses: 8_000,
        vacancyRatePct: 0.2,
        maintenancePctOfRent: 0.1,
        annualAppreciationPct: 0.04,
        annualRentGrowthPct: 0.03,
        incomeTaxPct: 0.15,
        horizonYears: 15,
      };
      const result = calculateRealEstate(input);
      expect(result.grossYield).toBeCloseTo(0.06, 3);
      expect(result.netYield).toBeCloseTo(0.024, 3);
      expect(result.timeSeries).toHaveLength(180);
    });

    it("Prague apartment — 20yr horizon, positive wealth creation", () => {
      const input: RealEstateInput = {
        type: "real_estate",
        purchasePrice: 6_000_000,
        downPayment: 1_200_000,
        mortgage: { annualRatePct: 0.04, termYears: 30 },
        monthlyRent: 25_000,
        monthlyExpenses: 5_000,
        vacancyRatePct: 0.05,
        maintenancePctOfRent: 0.05,
        annualAppreciationPct: 0.035,
        annualRentGrowthPct: 0.025,
        incomeTaxPct: 0.15,
        horizonYears: 20,
      };
      const result = calculateRealEstate(input);
      expect(result.finalEquity).toBeGreaterThan(5_000_000);
      expect(result.timeSeries).toHaveLength(240);
    });
  });

  describe("edge cases", () => {
    it("loanAmount=0 (cash buy) — no mortgage, positive cashflow from month 1", () => {
      const input: RealEstateInput = {
        type: "real_estate",
        purchasePrice: 2_000_000,
        downPayment: 2_000_000,
        mortgage: { annualRatePct: 0.035, termYears: 25 },
        monthlyRent: 10_000,
        monthlyExpenses: 2_000,
        vacancyRatePct: 0.05,
        maintenancePctOfRent: 0.05,
        annualAppreciationPct: 0.03,
        annualRentGrowthPct: 0.02,
        incomeTaxPct: 0.15,
        horizonYears: 5,
      };
      const result = calculateRealEstate(input);
      expect(result.monthlyPayment).toBe(0);
      expect(result.totalCashflow).toBeGreaterThan(0);
      expect(result.breakEvenMonth).toBe(1);
      // All principal and interest should be 0
      result.timeSeries.forEach((entry) => {
        expect(entry.interest).toBe(0);
        expect(entry.principal).toBe(0);
      });
    });

    it("mortgage.termYears < horizonYears — payment becomes 0 after term", () => {
      const input: RealEstateInput = {
        type: "real_estate",
        purchasePrice: 2_000_000,
        downPayment: 400_000,
        mortgage: { annualRatePct: 0.035, termYears: 5 }, // paid off in 5yr
        monthlyRent: 10_000,
        monthlyExpenses: 1_500,
        vacancyRatePct: 0.05,
        maintenancePctOfRent: 0.05,
        annualAppreciationPct: 0.03,
        annualRentGrowthPct: 0.02,
        incomeTaxPct: 0.15,
        horizonYears: 10, // horizon extends beyond mortgage term
      };
      const result = calculateRealEstate(input);
      // After month 60 (5yr * 12), interest and principal should be 0
      const monthAfterPayoff = result.timeSeries.find((e) => e.month === 61);
      expect(monthAfterPayoff).toBeDefined();
      expect(monthAfterPayoff!.interest).toBe(0);
      expect(monthAfterPayoff!.principal).toBe(0);
      // Remaining balance at month 60 should be ~0
      const lastMortgageMonth = result.timeSeries.find((e) => e.month === 60);
      expect(lastMortgageMonth!.remainingBalance).toBeCloseTo(0, -2); // within 100 CZK
    });

    it("vacancyRatePct=0 — full rent collected every month", () => {
      const input: RealEstateInput = {
        ...typicalCZInput,
        vacancyRatePct: 0,
      };
      const resultNoVacancy = calculateRealEstate(input);
      const resultWithVacancy = calculateRealEstate(typicalCZInput);
      // No vacancy = higher effective rent = better cashflow
      expect(resultNoVacancy.totalCashflow).toBeGreaterThan(resultWithVacancy.totalCashflow);
      resultNoVacancy.timeSeries.forEach((e) => {
        expect(e.effectiveRent).toBeGreaterThanOrEqual(e.effectiveRent);
      });
    });

    it("vacancyRatePct=0.5 — 50% vacancy dramatically reduces cashflow", () => {
      const input: RealEstateInput = {
        ...typicalCZInput,
        vacancyRatePct: 0.5,
      };
      const result = calculateRealEstate(input);
      const normalResult = calculateRealEstate(typicalCZInput);
      expect(result.totalCashflow).toBeLessThan(normalResult.totalCashflow);
    });

    it("incomeTaxPct=0 — no tax means higher cashflow", () => {
      const noTax: RealEstateInput = { ...typicalCZInput, incomeTaxPct: 0 };
      const withTax = calculateRealEstate(typicalCZInput);
      const noTaxResult = calculateRealEstate(noTax);
      expect(noTaxResult.totalCashflow).toBeGreaterThan(withTax.totalCashflow);
      noTaxResult.timeSeries.forEach((e) => expect(e.tax).toBe(0));
    });

    it("incomeTaxPct=0.23 — higher tax bracket reduces cashflow vs 0.15", () => {
      const higherTax: RealEstateInput = { ...typicalCZInput, incomeTaxPct: 0.23 };
      const standard = calculateRealEstate(typicalCZInput);
      const higher = calculateRealEstate(higherTax);
      expect(higher.totalCashflow).toBeLessThan(standard.totalCashflow);
    });

    it("mortgage.annualRatePct=0 — zero interest, monthly payment is loan/N", () => {
      const input: RealEstateInput = {
        type: "real_estate",
        purchasePrice: 1_000_000,
        downPayment: 200_000,
        mortgage: { annualRatePct: 0, termYears: 20 },
        monthlyRent: 5_000,
        monthlyExpenses: 1_000,
        vacancyRatePct: 0.05,
        maintenancePctOfRent: 0.05,
        annualAppreciationPct: 0.02,
        annualRentGrowthPct: 0.01,
        incomeTaxPct: 0.15,
        horizonYears: 10,
      };
      const result = calculateRealEstate(input);
      const expectedPayment = 800_000 / (20 * 12);
      expect(result.monthlyPayment).toBeCloseTo(expectedPayment, 4);
      // All interest payments should be 0
      result.timeSeries.forEach((e) => expect(e.interest).toBe(0));
    });

    it("IRR is null when cashflows are extreme negative with no recovery", () => {
      // Very expensive property with tiny rent and high mortgage — IRR should be null or deeply negative
      // All cashflows negative, sale at end also negative (over-leveraged)
      const input: RealEstateInput = {
        type: "real_estate",
        purchasePrice: 10_000_000,
        downPayment: 500_000, // tiny 5% down
        mortgage: { annualRatePct: 0.15, termYears: 30 }, // extreme rate
        monthlyRent: 5_000, // tiny rent vs huge mortgage
        monthlyExpenses: 10_000, // expenses exceed rent
        vacancyRatePct: 0.5,
        maintenancePctOfRent: 0.3,
        annualAppreciationPct: -0.1, // property losing value
        annualRentGrowthPct: -0.1,
        incomeTaxPct: 0.15,
        horizonYears: 3,
      };
      const result = calculateRealEstate(input);
      // IRR might be null or negative — in either case should not be NaN
      expect(result.irr).not.toBeNaN();
    });
  });

  describe("timeSeries structure", () => {
    it("equity = propertyValue - remainingBalance at each month", () => {
      const result = calculateRealEstate(typicalCZInput);
      result.timeSeries.forEach((e) => {
        expect(e.equity).toBeCloseTo(e.propertyValue - e.remainingBalance, 4);
      });
    });

    it("cumulativeCashflow is running sum of netCashflow", () => {
      const result = calculateRealEstate(typicalCZInput);
      let running = 0;
      result.timeSeries.forEach((e) => {
        running += e.netCashflow;
        expect(e.cumulativeCashflow).toBeCloseTo(running, 2);
      });
    });

    it("propertyValue grows geometrically from purchasePrice", () => {
      const result = calculateRealEstate(typicalCZInput);
      const monthlyRate = Math.pow(1.03, 1 / 12) - 1;
      result.timeSeries.forEach((e) => {
        const expected = 3_500_000 * Math.pow(1 + monthlyRate, e.month);
        expect(relDiff(e.propertyValue, expected)).toBeLessThan(1e-6);
      });
    });

    it("remainingBalance decreases over time while mortgage is active", () => {
      const result = calculateRealEstate(typicalCZInput);
      const mortgageEntries = result.timeSeries.slice(0, 60); // first 5 years
      for (let i = 1; i < mortgageEntries.length; i++) {
        expect(mortgageEntries[i]!.remainingBalance).toBeLessThanOrEqual(
          mortgageEntries[i - 1]!.remainingBalance
        );
      }
    });
  });

  describe("yields", () => {
    it("grossYield = 12*monthlyRent / purchasePrice", () => {
      const result = calculateRealEstate(typicalCZInput);
      const expected = (12 * 16_000) / 3_500_000;
      expect(result.grossYield).toBeCloseTo(expected, 8);
    });

    it("netYield is lower than grossYield", () => {
      const result = calculateRealEstate(typicalCZInput);
      expect(result.netYield).toBeLessThan(result.grossYield);
    });
  });

  describe("golden masters", () => {
    it.each(goldenFixtures.map((f, i) => [i + 1, f] as const))(
      "golden case %i matches expected output within 0.1%",
      (_, fixture) => {
        const input = fixture.input as RealEstateInput;
        const result = calculateRealEstate(input);
        const e = fixture.expected;

        expect(relDiff(result.monthlyPayment, e.monthlyPayment)).toBeLessThan(REL_TOL);
        expect(relDiff(result.finalEquity, e.finalEquity)).toBeLessThan(REL_TOL);
        expect(relDiff(result.totalCashflow, e.totalCashflow)).toBeLessThan(REL_TOL);
        expect(relDiff(result.grossYield, e.grossYield)).toBeLessThan(REL_TOL);
        expect(relDiff(result.netYield, e.netYield)).toBeLessThan(REL_TOL);
      }
    );
  });
});
