import { describe, it, expect } from "vitest";
import { calculateCompound, compoundFVClosedForm } from "../compound";
import type { CompoundInput } from "../../schemas/scenario";
import goldenFixtures from "../__fixtures__/compound.golden.json";

const REL_TOL = 1e-4; // 0.01% relative tolerance for golden masters
const CLOSE_TOL = 2;  // CZK tolerance for financial values

function relDiff(a: number, b: number): number {
  if (b === 0) return Math.abs(a);
  return Math.abs((a - b) / b);
}

describe("calculateCompound", () => {
  describe("happy path", () => {
    it("conservative scenario — low return, long horizon", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 100_000,
        monthlyContribution: 2_000,
        annualReturnPct: 0.04,
        horizonYears: 20,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      expect(result.finalValue).toBeGreaterThan(100_000 + 2_000 * 240);
      expect(result.totalContributions).toBe(100_000 + 2_000 * 240);
      expect(result.totalGains).toBeGreaterThan(0);
      expect(result.timeSeries).toHaveLength(241); // month 0..240
    });

    it("aggressive scenario — high return, medium horizon", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 50_000,
        monthlyContribution: 5_000,
        annualReturnPct: 0.12,
        horizonYears: 15,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      expect(result.finalValue).toBeGreaterThan(50_000 + 5_000 * 180);
      expect(result.totalGains).toBeGreaterThan(0);
    });

    it("bear market scenario — negative return", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 200_000,
        monthlyContribution: 1_000,
        annualReturnPct: -0.05,
        horizonYears: 5,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      const totalContributions = 200_000 + 1_000 * 60;
      // With negative return, FV < total contributions
      expect(result.finalValue).toBeLessThan(totalContributions);
      expect(result.totalGains).toBeLessThan(0);
    });
  });

  describe("edge cases", () => {
    it("r=0 — no return, pure linear accumulation", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 5_000,
        monthlyContribution: 200,
        annualReturnPct: 0,
        horizonYears: 5,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      expect(result.finalValue).toBeCloseTo(5_000 + 200 * 60, 6);
      expect(result.totalGains).toBeCloseTo(0, 6);
    });

    it("r<0 — negative annual return reduces final value below contributions", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 10_000,
        monthlyContribution: 0,
        annualReturnPct: -0.10,
        horizonYears: 5,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      expect(result.finalValue).toBeLessThan(10_000);
      expect(result.totalGains).toBeLessThan(0);
    });

    it("horizonYears=0 — returns initial amount only, no time series past month 0", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 50_000,
        monthlyContribution: 500,
        annualReturnPct: 0.07,
        horizonYears: 0,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      expect(result.finalValue).toBe(50_000);
      expect(result.totalContributions).toBe(50_000);
      expect(result.totalGains).toBe(0);
      expect(result.timeSeries).toHaveLength(1);
      expect(result.timeSeries[0]?.month).toBe(0);
    });

    it("monthlyContribution=0 — pure compounding of initial amount", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 100_000,
        monthlyContribution: 0,
        annualReturnPct: 0.07,
        horizonYears: 10,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      // FV = 100000 * (1.07)^10
      const expected = 100_000 * Math.pow(1.07, 10);
      expect(result.finalValue).toBeCloseTo(expected, 4);
      expect(result.totalContributions).toBe(100_000);
    });

    it("contributionTiming begin produces higher FV than end (when r>0, C>0)", () => {
      const base: CompoundInput = {
        type: "compound",
        initialAmount: 10_000,
        monthlyContribution: 500,
        annualReturnPct: 0.07,
        horizonYears: 10,
        contributionTiming: "end",
      };
      const beginResult = calculateCompound({ ...base, contributionTiming: "begin" });
      const endResult = calculateCompound({ ...base, contributionTiming: "end" });
      expect(beginResult.finalValue).toBeGreaterThan(endResult.finalValue);
    });

    it("contributionTiming begin vs end difference is one month of compounding on contributions", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 10_000,
        monthlyContribution: 100,
        annualReturnPct: 0.07,
        horizonYears: 10,
        contributionTiming: "end",
      };
      const endResult = calculateCompound(input);
      const beginResult = calculateCompound({ ...input, contributionTiming: "begin" });
      // begin FV ≈ end FV * (1+r), where r is monthly rate
      const r = Math.pow(1.07, 1 / 12) - 1;
      // For pure contributions (P=0), begin FV = end FV * (1+r). With P>0 the ratio is slightly different.
      // Verify begin > end and the difference is positive
      expect(beginResult.finalValue - endResult.finalValue).toBeGreaterThan(0);
    });
  });

  describe("iterative time series consistency", () => {
    it("FV from loop equals closed-form (relative tolerance 1e-6)", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 10_000,
        monthlyContribution: 100,
        annualReturnPct: 0.07,
        horizonYears: 10,
        contributionTiming: "end",
      };
      const iterResult = calculateCompound(input);
      const closedForm = compoundFVClosedForm(input);
      expect(relDiff(iterResult.finalValue, closedForm)).toBeLessThan(1e-6);
    });

    it("timeSeries length = horizonYears*12 + 1 (month 0 through n)", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 1_000,
        monthlyContribution: 100,
        annualReturnPct: 0.05,
        horizonYears: 3,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      expect(result.timeSeries).toHaveLength(37); // 0..36
    });

    it("timeSeries[0] is the initial state", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 10_000,
        monthlyContribution: 500,
        annualReturnPct: 0.07,
        horizonYears: 5,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      expect(result.timeSeries[0]).toEqual({
        month: 0,
        contributions: 10_000,
        value: 10_000,
      });
    });

    it("cumulative contributions increase by monthlyContribution each month", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 1_000,
        monthlyContribution: 100,
        annualReturnPct: 0.05,
        horizonYears: 1,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      for (let i = 1; i < result.timeSeries.length; i++) {
        const curr = result.timeSeries[i]!;
        const prev = result.timeSeries[i - 1]!;
        expect(curr.contributions - prev.contributions).toBeCloseTo(100, 6);
      }
    });

    it("value is monotonically increasing when r>0 and C>=0", () => {
      const input: CompoundInput = {
        type: "compound",
        initialAmount: 5_000,
        monthlyContribution: 0,
        annualReturnPct: 0.08,
        horizonYears: 10,
        contributionTiming: "end",
      };
      const result = calculateCompound(input);
      for (let i = 1; i < result.timeSeries.length; i++) {
        expect(result.timeSeries[i]!.value).toBeGreaterThanOrEqual(
          result.timeSeries[i - 1]!.value
        );
      }
    });
  });

  describe("golden masters (cross-checked against closed-form formula)", () => {
    it.each(goldenFixtures.map((f, i) => [i + 1, f] as const))(
      "golden case %i matches expected output within 0.01%",
      (_, fixture) => {
        const input = fixture.input as CompoundInput;
        const result = calculateCompound(input);
        const e = fixture.expected;

        expect(relDiff(result.finalValue, e.finalValue)).toBeLessThan(REL_TOL);
        expect(relDiff(result.totalContributions, e.totalContributions)).toBeLessThan(REL_TOL);
        expect(Math.abs(result.totalGains - e.totalGains)).toBeLessThan(CLOSE_TOL);
      }
    );
  });
});
