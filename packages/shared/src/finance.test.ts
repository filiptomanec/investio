import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { calculateInvestment } from "./finance";
import { solveMonthlyForTargetIncome } from "./finance";
import { fetchCzechInflation } from "./inflation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Relative error: |a - b| / |b| (or 0 when both are 0). */
function relErr(a: number, b: number): number {
  if (b === 0) return Math.abs(a);
  return Math.abs(a - b) / Math.abs(b);
}

/** Closed-form future value for constant monthly contributions.
 *  FV = initial*(1+rm)^N + monthly*[((1+rm)^N - 1) / rm]
 *  where rm = (1+r)^(1/12) - 1, N = years*12
 */
function closedFormFV(
  initial: number,
  monthly: number,
  annualRatePct: number,
  years: number,
): number {
  const r = annualRatePct / 100;
  const N = Math.round(years * 12);
  const rm = Math.pow(1 + r, 1 / 12) - 1;
  if (rm === 0) return initial + monthly * N;
  const growth = Math.pow(1 + rm, N);
  return initial * growth + monthly * ((growth - 1) / rm);
}

// ---------------------------------------------------------------------------
// calculateInvestment — basic compound interest
// ---------------------------------------------------------------------------

describe("calculateInvestment — basic compound interest", () => {
  it("returns FV = 0 when initial and monthly are both zero", () => {
    const result = calculateInvestment({
      initial: 0,
      monthly: 0,
      annualRatePct: 7,
      years: 20,
      inflationPct: 0,
    });
    expect(result.finalNominal).toBe(0);
  });

  it("matches closed-form FV: initial=100 000, monthly=0, rate=7%, 20 years", () => {
    const expected = closedFormFV(100_000, 0, 7, 20);
    const result = calculateInvestment({
      initial: 100_000,
      monthly: 0,
      annualRatePct: 7,
      years: 20,
      inflationPct: 0,
    });
    // APY matches: 100000 * (1.07)^20 ≈ 386 968
    expect(Math.round(expected)).toBe(386_968);
    expect(relErr(result.finalNominal, expected)).toBeLessThan(1e-9);
  });

  it("matches closed-form FV: initial=0, monthly=5 000, rate=7%, 20 years", () => {
    const expected = closedFormFV(0, 5_000, 7, 20);
    const result = calculateInvestment({
      initial: 0,
      monthly: 5_000,
      annualRatePct: 7,
      years: 20,
      inflationPct: 0,
    });
    // ≈ 2 537 682
    expect(Math.round(expected)).toBe(2_537_682);
    expect(relErr(result.finalNominal, expected)).toBeLessThan(1e-9);
  });

  it("matches closed-form FV: initial=100 000, monthly=5 000, rate=7%, 20 years", () => {
    const expected = closedFormFV(100_000, 5_000, 7, 20);
    const result = calculateInvestment({
      initial: 100_000,
      monthly: 5_000,
      annualRatePct: 7,
      years: 20,
      inflationPct: 0,
    });
    // ≈ 2 924 650 (matches dev server)
    expect(Math.round(expected)).toBe(2_924_650);
    expect(relErr(result.finalNominal, expected)).toBeLessThan(1e-9);
  });
});

// ---------------------------------------------------------------------------
// calculateInvestment — inflation-adjusted real value
// ---------------------------------------------------------------------------

describe("calculateInvestment — real value (inflation adjustment)", () => {
  it("computes finalReal = finalNominal / (1 + inflation)^years when inflation=3.2%, 20 years", () => {
    const result = calculateInvestment({
      initial: 100_000,
      monthly: 5_000,
      annualRatePct: 7,
      years: 20,
      inflationPct: 3.2,
    });
    const expectedReal = result.finalNominal / Math.pow(1.032, 20);
    expect(relErr(result.finalReal, expectedReal)).toBeLessThan(1e-9);
  });

  it("finalReal equals finalNominal when inflation is 0", () => {
    const result = calculateInvestment({
      initial: 50_000,
      monthly: 3_000,
      annualRatePct: 5,
      years: 10,
      inflationPct: 0,
    });
    expect(relErr(result.finalReal, result.finalNominal)).toBeLessThan(1e-9);
  });
});

// ---------------------------------------------------------------------------
// calculateInvestment — increaseMonthlyWithInflation flag
// ---------------------------------------------------------------------------

describe("calculateInvestment — increaseMonthlyWithInflation", () => {
  it("year-by-year monthly contribution tracks baseMonthly * (1 + i)^year", () => {
    const baseMonthly = 5_000;
    const inflationPct = 3.2;
    const i = inflationPct / 100;
    const years = 5;

    const result = calculateInvestment({
      initial: 0,
      monthly: baseMonthly,
      annualRatePct: 7,
      years,
      inflationPct,
      increaseMonthlyWithInflation: true,
    });

    // Verify by simulating the same loop independently
    const rm = Math.pow(1.07, 1 / 12) - 1;
    let balance = 0;
    let currentMonthly = baseMonthly;
    for (let m = 1; m <= years * 12; m++) {
      balance = balance * (1 + rm) + currentMonthly;
      if (m % 12 === 0) {
        const year = m / 12;
        // The contribution in this year should equal baseMonthly * (1+i)^(year-1)
        // (year 1 uses base, year 2 uses base*(1+i), etc.)
        const expectedContribThisYear = baseMonthly * Math.pow(1 + i, year - 1);
        expect(relErr(currentMonthly, expectedContribThisYear)).toBeLessThan(
          1e-9,
        );
        if (year < years) {
          currentMonthly = currentMonthly * (1 + i);
        }
      }
    }
    // The final balances must match
    expect(relErr(result.finalNominal, balance)).toBeLessThan(1e-9);
  });

  it("produces higher finalNominal than non-inflated contributions", () => {
    const base = {
      initial: 0,
      monthly: 5_000,
      annualRatePct: 7,
      years: 10,
      inflationPct: 3.2,
    };
    const withInflation = calculateInvestment({
      ...base,
      increaseMonthlyWithInflation: true,
    });
    const withoutInflation = calculateInvestment({
      ...base,
      increaseMonthlyWithInflation: false,
    });
    expect(withInflation.finalNominal).toBeGreaterThan(withoutInflation.finalNominal);
  });
});

// ---------------------------------------------------------------------------
// calculateInvestment — edge cases
// ---------------------------------------------------------------------------

describe("calculateInvestment — edge cases", () => {
  it("series length equals years + 1 (year 0 included)", () => {
    const result = calculateInvestment({
      initial: 0,
      monthly: 1_000,
      annualRatePct: 7,
      years: 10,
      inflationPct: 0,
    });
    expect(result.series.length).toBe(11); // year 0 through year 10
  });

  it("years = 0 returns series of length 1 with finalNominal equal to initial", () => {
    const result = calculateInvestment({
      initial: 50_000,
      monthly: 5_000,
      annualRatePct: 7,
      years: 0,
      inflationPct: 0,
    });
    expect(result.series.length).toBe(1);
    expect(result.finalNominal).toBe(50_000);
    expect(result.totalContributions).toBe(50_000);
  });

  it("rate = 0 accumulates contributions without growth (simple sum)", () => {
    const initial = 1_000;
    const monthly = 500;
    const years = 10;
    const result = calculateInvestment({
      initial,
      monthly,
      annualRatePct: 0,
      years,
      inflationPct: 0,
    });
    const expected = initial + monthly * years * 12;
    expect(relErr(result.finalNominal, expected)).toBeLessThan(1e-9);
  });

  it("totalInterest = finalNominal - totalContributions", () => {
    const result = calculateInvestment({
      initial: 100_000,
      monthly: 5_000,
      annualRatePct: 7,
      years: 20,
      inflationPct: 0,
    });
    expect(
      relErr(result.totalInterest, result.finalNominal - result.totalContributions),
    ).toBeLessThan(1e-9);
  });

  it("year 0 data point has interest = 0 and nominal = initial", () => {
    const result = calculateInvestment({
      initial: 12_345,
      monthly: 500,
      annualRatePct: 7,
      years: 5,
      inflationPct: 0,
    });
    const year0 = result.series[0];
    expect(year0.year).toBe(0);
    expect(year0.nominal).toBe(12_345);
    expect(year0.interest).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// solveMonthlyForTargetIncome — algebra verification
// ---------------------------------------------------------------------------

describe("solveMonthlyForTargetIncome — algebra", () => {
  it("requiredRealPortfolio = (targetMonthlyToday * 12) / (withdrawalRatePct / 100)", () => {
    const result = solveMonthlyForTargetIncome({
      targetMonthlyToday: 40_000,
      years: 25,
      annualRatePct: 7,
      inflationPct: 3.2,
      withdrawalRatePct: 4,
      initial: 0,
    });
    const expected = (40_000 * 12) / 0.04;
    expect(relErr(result.requiredRealPortfolio, expected)).toBeLessThan(1e-9);
  });

  it("requiredNominalPortfolio = requiredRealPortfolio * (1 + inflation)^years", () => {
    const result = solveMonthlyForTargetIncome({
      targetMonthlyToday: 40_000,
      years: 25,
      annualRatePct: 7,
      inflationPct: 3.2,
      withdrawalRatePct: 4,
      initial: 0,
    });
    const expected = result.requiredRealPortfolio * Math.pow(1.032, 25);
    expect(relErr(result.requiredNominalPortfolio, expected)).toBeLessThan(1e-9);
  });
});

// ---------------------------------------------------------------------------
// solveMonthlyForTargetIncome — round-trip test
// ---------------------------------------------------------------------------

describe("solveMonthlyForTargetIncome — round-trip", () => {
  it("feeding requiredMonthly back into calculateInvestment yields requiredNominalPortfolio (within 0.01%)", () => {
    const input = {
      targetMonthlyToday: 40_000,
      years: 25,
      annualRatePct: 7,
      inflationPct: 3.2,
      withdrawalRatePct: 4,
      initial: 0,
    };
    const { requiredMonthly, requiredNominalPortfolio } =
      solveMonthlyForTargetIncome(input);

    const verification = calculateInvestment({
      initial: 0,
      monthly: requiredMonthly,
      annualRatePct: input.annualRatePct,
      years: input.years,
      inflationPct: input.inflationPct,
    });

    expect(relErr(verification.finalNominal, requiredNominalPortfolio)).toBeLessThan(
      1e-4, // 0.01%
    );
  });

  it("round-trip works with non-zero initial deposit", () => {
    const input = {
      targetMonthlyToday: 50_000,
      years: 30,
      annualRatePct: 8,
      inflationPct: 2.5,
      withdrawalRatePct: 3.5,
      initial: 200_000,
    };
    const { requiredMonthly, requiredNominalPortfolio } =
      solveMonthlyForTargetIncome(input);

    const verification = calculateInvestment({
      initial: input.initial,
      monthly: requiredMonthly,
      annualRatePct: input.annualRatePct,
      years: input.years,
      inflationPct: input.inflationPct,
    });

    expect(relErr(verification.finalNominal, requiredNominalPortfolio)).toBeLessThan(
      1e-4,
    );
  });
});

// ---------------------------------------------------------------------------
// solveMonthlyForTargetIncome — concrete dev-server sanity numbers
// ---------------------------------------------------------------------------

describe("solveMonthlyForTargetIncome — concrete sanity check", () => {
  it("target=40 000, years=25, rate=7%, inflation=3.2%, withdrawal=4%, initial=0 → known values", () => {
    const result = solveMonthlyForTargetIncome({
      targetMonthlyToday: 40_000,
      years: 25,
      annualRatePct: 7,
      inflationPct: 3.2,
      withdrawalRatePct: 4,
      initial: 0,
    });

    // requiredRealPortfolio = 40000*12 / 0.04 = 12 000 000
    expect(Math.round(result.requiredRealPortfolio)).toBe(12_000_000);
    // requiredNominalPortfolio ≈ 26 373 859
    expect(Math.round(result.requiredNominalPortfolio)).toBe(26_373_859);
    // requiredMonthly ≈ 33 681
    expect(Math.round(result.requiredMonthly)).toBe(33_681);
  });
});

// ---------------------------------------------------------------------------
// solveMonthlyForTargetIncome — edge cases
// ---------------------------------------------------------------------------

describe("solveMonthlyForTargetIncome — edge cases", () => {
  it("withdrawalRate = 0 → requiredRealPortfolio = 0", () => {
    const result = solveMonthlyForTargetIncome({
      targetMonthlyToday: 40_000,
      years: 25,
      annualRatePct: 7,
      inflationPct: 3.2,
      withdrawalRatePct: 0,
      initial: 0,
    });
    expect(result.requiredRealPortfolio).toBe(0);
    expect(result.requiredNominalPortfolio).toBe(0);
  });

  it("initial deposit that already overshoots target → requiredMonthly < 0", () => {
    // A massive initial deposit that already grows past the target
    const result = solveMonthlyForTargetIncome({
      targetMonthlyToday: 10_000,
      years: 25,
      annualRatePct: 7,
      inflationPct: 3.2,
      withdrawalRatePct: 4,
      initial: 50_000_000, // vastly overshoots any target
    });
    expect(result.requiredMonthly).toBeLessThan(0);
  });

  it("years = 0 → requiredMonthly = 0 (nothing to contribute)", () => {
    const result = solveMonthlyForTargetIncome({
      targetMonthlyToday: 40_000,
      years: 0,
      annualRatePct: 7,
      inflationPct: 3.2,
      withdrawalRatePct: 4,
      initial: 0,
    });
    expect(result.requiredMonthly).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// fetchCzechInflation — mock fetch
// ---------------------------------------------------------------------------

describe("fetchCzechInflation", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Build a mock World Bank response (newest-first, as the API returns). */
  function makeWBResponse(
    rows: Array<{ date: string; value: number | null }>,
  ): Response {
    const payload = [{ page: 1, total: rows.length }, rows];
    return {
      ok: true,
      json: async () => payload,
    } as unknown as Response;
  }

  it("returns oldest-first samples sorted by year", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeWBResponse([
        { date: "2023", value: 10.7 },
        { date: "2022", value: 15.1 },
        { date: "2021", value: 3.8 },
      ]),
    );

    const result = await fetchCzechInflation(3);
    expect(result.samples.map((s) => s.year)).toEqual([2021, 2022, 2023]);
  });

  it("filters out null-value rows", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeWBResponse([
        { date: "2023", value: 10.7 },
        { date: "2022", value: null },
        { date: "2021", value: 3.8 },
        { date: "2020", value: null },
        { date: "2019", value: 2.8 },
      ]),
    );

    const result = await fetchCzechInflation(3);
    // Null rows dropped; take most recent 3 non-null: 2023, 2021, 2019
    expect(result.samples.every((s) => s.pct !== null)).toBe(true);
    expect(result.samples.length).toBe(3);
    // Sorted oldest-first
    expect(result.samples[0].year).toBe(2019);
    expect(result.samples[2].year).toBe(2023);
  });

  it("slices to most recent `years` entries (API returns newest-first)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeWBResponse([
        { date: "2023", value: 10.7 },
        { date: "2022", value: 15.1 },
        { date: "2021", value: 3.8 },
        { date: "2020", value: 2.9 },
        { date: "2019", value: 2.8 },
      ]),
    );

    const result = await fetchCzechInflation(2);
    // Only the 2 most recent: 2023, 2022 → sorted oldest-first
    expect(result.samples.length).toBe(2);
    expect(result.samples[0].year).toBe(2022);
    expect(result.samples[1].year).toBe(2023);
  });

  it("computes simple average correctly", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeWBResponse([
        { date: "2023", value: 10.0 },
        { date: "2022", value: 8.0 },
        { date: "2021", value: 6.0 },
      ]),
    );

    const result = await fetchCzechInflation(3);
    expect(relErr(result.averagePct, 8.0)).toBeLessThan(1e-9);
  });

  it("throws on non-OK HTTP response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    await expect(fetchCzechInflation(5)).rejects.toThrow("503");
  });

  it("throws when payload is not an array", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ error: "unexpected" }),
    } as unknown as Response);

    await expect(fetchCzechInflation(5)).rejects.toThrow(
      /unexpected payload/i,
    );
  });

  it("throws when payload[1] is not an array", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [{ page: 1 }, "not-an-array"],
    } as unknown as Response);

    await expect(fetchCzechInflation(5)).rejects.toThrow(
      /unexpected payload/i,
    );
  });

  it("throws when all rows have null values (zero usable samples)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeWBResponse([
        { date: "2023", value: null },
        { date: "2022", value: null },
      ]),
    );

    await expect(fetchCzechInflation(5)).rejects.toThrow(
      /no inflation samples/i,
    );
  });

  it("pct values are numeric (not string) after parsing", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeWBResponse([{ date: "2023", value: 10.7 }]),
    );

    const result = await fetchCzechInflation(1);
    expect(typeof result.samples[0].pct).toBe("number");
    expect(typeof result.samples[0].year).toBe("number");
  });
});
