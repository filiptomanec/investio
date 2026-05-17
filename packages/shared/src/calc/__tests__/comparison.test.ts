import { describe, it, expect } from "vitest";
import { compareScenarios } from "../comparison";
import { calculateCompound } from "../compound";
import { calculateRealEstate } from "../realEstate";
import type { ScenarioComputed } from "../comparison";

function makeCompoundScenario(
  horizonYears: number,
  initialCapital: number,
  annualReturnPct: number
): ScenarioComputed {
  const result = calculateCompound({
    type: "compound",
    initialAmount: initialCapital,
    monthlyContribution: 0,
    annualReturnPct,
    horizonYears,
    contributionTiming: "end",
  });
  return { kind: "compound", horizonYears, initialCapital, result };
}

function makeRealEstateScenario(
  horizonYears: number,
  purchasePrice: number,
  downPayment: number
): ScenarioComputed {
  const result = calculateRealEstate({
    type: "real_estate",
    purchasePrice,
    downPayment,
    mortgage: { annualRatePct: 0.035, termYears: 25 },
    monthlyRent: 15_000,
    monthlyExpenses: 2_500,
    vacancyRatePct: 0.05,
    maintenancePctOfRent: 0.05,
    annualAppreciationPct: 0.03,
    annualRentGrowthPct: 0.02,
    incomeTaxPct: 0.15,
    horizonYears,
  });
  return { kind: "real_estate", horizonYears, initialCapital: downPayment, result };
}

describe("compareScenarios", () => {
  describe("common horizon normalization", () => {
    it("uses min(a.horizonYears, b.horizonYears) as common horizon", () => {
      const a = makeCompoundScenario(20, 100_000, 0.07);
      const b = makeCompoundScenario(10, 100_000, 0.07);
      const result = compareScenarios(a, b);
      expect(result.horizonYears).toBe(10);
    });

    it("timeSeries is truncated to common horizon", () => {
      const a = makeCompoundScenario(20, 100_000, 0.07);
      const b = makeCompoundScenario(10, 100_000, 0.07);
      const result = compareScenarios(a, b);
      const maxMonthA = Math.max(...result.a.timeSeries.map((p) => p.month));
      const maxMonthB = Math.max(...result.b.timeSeries.map((p) => p.month));
      expect(maxMonthA).toBeLessThanOrEqual(10 * 12);
      expect(maxMonthB).toBeLessThanOrEqual(10 * 12);
    });

    it("uses same horizon when both equal", () => {
      const a = makeCompoundScenario(15, 100_000, 0.07);
      const b = makeCompoundScenario(15, 100_000, 0.05);
      const result = compareScenarios(a, b);
      expect(result.horizonYears).toBe(15);
    });
  });

  describe("initial capital normalization", () => {
    it("uses max(a.initialCapital, b.initialCapital) by default", () => {
      const a = makeCompoundScenario(10, 50_000, 0.07);
      const b = makeCompoundScenario(10, 100_000, 0.07);
      const result = compareScenarios(a, b);
      expect(result.normalizedInitialCapital).toBe(100_000);
    });

    it("uses opts.normalizedInitialCapital when provided", () => {
      const a = makeCompoundScenario(10, 50_000, 0.07);
      const b = makeCompoundScenario(10, 100_000, 0.07);
      const result = compareScenarios(a, b, { normalizedInitialCapital: 200_000 });
      expect(result.normalizedInitialCapital).toBe(200_000);
    });
  });

  describe("winner determination", () => {
    it("a wins when a has higher final value", () => {
      const a = makeCompoundScenario(10, 100_000, 0.10); // high return
      const b = makeCompoundScenario(10, 100_000, 0.02); // low return
      const result = compareScenarios(a, b);
      expect(result.difference.winnerKey).toBe("a");
      expect(result.difference.finalValueDelta).toBeGreaterThan(0);
    });

    it("b wins when b has higher final value", () => {
      const a = makeCompoundScenario(10, 100_000, 0.02);
      const b = makeCompoundScenario(10, 100_000, 0.10);
      const result = compareScenarios(a, b);
      expect(result.difference.winnerKey).toBe("b");
      expect(result.difference.finalValueDelta).toBeLessThan(0);
    });

    it("tie when both have identical final values", () => {
      const a = makeCompoundScenario(10, 100_000, 0.07);
      const b = makeCompoundScenario(10, 100_000, 0.07);
      const result = compareScenarios(a, b);
      expect(result.difference.winnerKey).toBe("tie");
      expect(Math.abs(result.difference.finalValueDelta)).toBeLessThan(1);
    });
  });

  describe("ROI calculation", () => {
    it("ROI = (finalValue / normalizedInitialCapital) - 1", () => {
      const a = makeCompoundScenario(10, 100_000, 0.07);
      const b = makeCompoundScenario(10, 100_000, 0.05);
      const result = compareScenarios(a, b);
      const expectedROI_a = (result.a.finalValue / result.normalizedInitialCapital) - 1;
      const expectedROI_b = (result.b.finalValue / result.normalizedInitialCapital) - 1;
      expect(result.a.totalROI).toBeCloseTo(expectedROI_a, 6);
      expect(result.b.totalROI).toBeCloseTo(expectedROI_b, 6);
    });

    it("higher annual return → higher ROI", () => {
      const a = makeCompoundScenario(15, 100_000, 0.10);
      const b = makeCompoundScenario(15, 100_000, 0.05);
      const result = compareScenarios(a, b);
      expect(result.a.totalROI).toBeGreaterThan(result.b.totalROI);
    });
  });

  describe("real estate vs compound comparison", () => {
    it("can compare compound vs real estate scenario", () => {
      const compound = makeCompoundScenario(10, 700_000, 0.07);
      const re = makeRealEstateScenario(10, 3_500_000, 700_000);
      const result = compareScenarios(compound, re);
      expect(result.horizonYears).toBe(10);
      expect(result.normalizedInitialCapital).toBe(700_000);
      expect(result.a.finalValue).toBeGreaterThan(0);
      expect(result.b.finalValue).toBeGreaterThan(0);
      expect(["a", "b", "tie"]).toContain(result.difference.winnerKey);
    });
  });

  describe("finalValueDeltaPct", () => {
    it("delta pct is (aFinalValue - bFinalValue) / |bFinalValue|", () => {
      const a = makeCompoundScenario(10, 100_000, 0.10);
      const b = makeCompoundScenario(10, 100_000, 0.05);
      const result = compareScenarios(a, b);
      const expected = (result.a.finalValue - result.b.finalValue) / Math.abs(result.b.finalValue);
      expect(result.difference.finalValueDeltaPct).toBeCloseTo(expected, 6);
    });
  });
});
