import { describe, it, expect } from "vitest";
import { irr } from "../irr";

const TOL = 1e-4; // 0.01% tolerance for IRR comparisons

describe("irr", () => {
  describe("known values", () => {
    it("returns ~5.47% for [-1000, 200, 200, 200, 200, 200, 200] (annual cashflows)", () => {
      // IRR is the rate r such that NPV = 0
      // -1000 + 200/(1+r) + ... + 200/(1+r)^6 = 0
      // Expected ≈ 0.054718 (5.47%) — verified via bisection
      const cashflows = [-1000, 200, 200, 200, 200, 200, 200];
      const result = irr(cashflows);
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(0.054718, 4);
    });

    it("returns sqrt(1.5)-1 ≈ 22.47% for [-100, 0, 150]", () => {
      // Two-period: -100 invested, gets 150 in period 2
      // r such that -100 + 150/(1+r)^2 = 0 → r = sqrt(1.5)-1
      const cashflows = [-100, 0, 150];
      const result = irr(cashflows);
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(Math.sqrt(1.5) - 1, 4);
    });

    it("returns 0 for [-100, 100]", () => {
      // Invest 100, get exactly 100 back — IRR = 0%
      const cashflows = [-100, 100];
      const result = irr(cashflows);
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(0, 4);
    });

    it("returns 100% for [-100, 200]", () => {
      // Double your money in one period
      const cashflows = [-100, 200];
      const result = irr(cashflows);
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(1.0, 4);
    });
  });

  describe("convergence failures → null", () => {
    it("returns null for [1, 1, 1] — no negative cashflow (no investment)", () => {
      const result = irr([1, 1, 1]);
      expect(result).toBeNull();
    });

    it("returns null for [-1, -1, -1] — no positive cashflow (no return)", () => {
      const result = irr([-1, -1, -1]);
      expect(result).toBeNull();
    });

    it("returns null for [0, 0, 0]", () => {
      const result = irr([0, 0, 0]);
      expect(result).toBeNull();
    });
  });

  describe("Newton-Raphson vs bisect parity", () => {
    it("converges to same answer regardless of starting guess for well-behaved cashflows", () => {
      const cashflows = [-500, 100, 150, 200, 100, 50];

      // Use two very different guesses — both should converge to same root
      const r1 = irr(cashflows, 0.01);
      const r2 = irr(cashflows, 0.5);
      expect(r1).not.toBeNull();
      expect(r2).not.toBeNull();
      expect(Math.abs(r1! - r2!)).toBeLessThan(TOL);
    });
  });

  describe("edge cases", () => {
    it("handles very large cashflows without overflow", () => {
      const cashflows = [-1_000_000_000, 200_000_000, 200_000_000, 200_000_000, 200_000_000, 200_000_000, 200_000_000];
      const result = irr(cashflows);
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(0.054718, 4);
    });

    it("handles two-cashflow scenarios (single period)", () => {
      const cashflows = [-1000, 1100];
      const result = irr(cashflows);
      expect(result).not.toBeNull();
      // IRR should be 10%
      expect(result!).toBeCloseTo(0.1, 4);
    });

    it("never returns NaN", () => {
      const edgeCases = [
        [-1, 0, 0, 0, 0.001],
        [0],
        [-1e15, 1e15],
        [-1, 1e-10],
      ];
      for (const cashflows of edgeCases) {
        const result = irr(cashflows);
        expect(result).not.toBeNaN();
      }
    });
  });
});
