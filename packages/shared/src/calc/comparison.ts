import type { CompoundResult } from "./compound";
import type { RealEstateResult } from "./realEstate";

export type TimeSeriesPoint = { month: number; value: number };

export type ScenarioComputed =
  | {
      kind: "compound";
      horizonYears: number;
      initialCapital: number;
      result: CompoundResult;
    }
  | {
      kind: "real_estate";
      horizonYears: number;
      initialCapital: number;
      result: RealEstateResult;
    };

export type ComparisonResult = {
  horizonYears: number;
  normalizedInitialCapital: number;
  a: { finalValue: number; totalROI: number; timeSeries: TimeSeriesPoint[] };
  b: { finalValue: number; totalROI: number; timeSeries: TimeSeriesPoint[] };
  difference: {
    finalValueDelta: number;
    finalValueDeltaPct: number;
    winnerKey: "a" | "b" | "tie";
  };
};

function extractTimeSeries(
  scenario: ScenarioComputed,
  upToMonth: number
): TimeSeriesPoint[] {
  if (scenario.kind === "compound") {
    return scenario.result.timeSeries
      .filter((p) => p.month <= upToMonth)
      .map((p) => ({ month: p.month, value: p.value }));
  }

  // For real estate: wealth = equity + cumulative cashflow
  return scenario.result.timeSeries
    .filter((p) => p.month <= upToMonth)
    .map((p) => ({
      month: p.month,
      value: p.equity + p.cumulativeCashflow,
    }));
}

function getFinalValue(scenario: ScenarioComputed, atMonth: number): number {
  if (scenario.kind === "compound") {
    const entry = scenario.result.timeSeries.find((p) => p.month === atMonth);
    return entry?.value ?? scenario.result.finalValue;
  }

  // Real estate final value = equity + cumulative cashflow at that month
  const entry = scenario.result.timeSeries.find((p) => p.month === atMonth);
  if (!entry) {
    return (
      scenario.result.finalEquity + scenario.result.totalCashflow
    );
  }
  return entry.equity + entry.cumulativeCashflow;
}

/**
 * Compare two computed scenarios normalized to a common horizon and initial capital.
 *
 * Common horizon = min(a.horizonYears, b.horizonYears)
 * Common initial capital = opts.normalizedInitialCapital ?? max(a.initialCapital, b.initialCapital)
 * ROI = (finalValue / initialCapital) - 1
 * Real estate finalValue = finalEquity + cumulativeCashflow
 */
export function compareScenarios(
  a: ScenarioComputed,
  b: ScenarioComputed,
  opts: { normalizedInitialCapital?: number; currency?: string } = {}
): ComparisonResult {
  const horizonYears = Math.min(a.horizonYears, b.horizonYears);
  const normalizedInitialCapital =
    opts.normalizedInitialCapital ?? Math.max(a.initialCapital, b.initialCapital);

  const commonMonth = horizonYears * 12;

  const aFinalValue = getFinalValue(a, commonMonth);
  const bFinalValue = getFinalValue(b, commonMonth);

  const aROI = (aFinalValue / normalizedInitialCapital) - 1;
  const bROI = (bFinalValue / normalizedInitialCapital) - 1;

  const aTimeSeries = extractTimeSeries(a, commonMonth);
  const bTimeSeries = extractTimeSeries(b, commonMonth);

  const finalValueDelta = aFinalValue - bFinalValue;
  const finalValueDeltaPct =
    bFinalValue !== 0 ? finalValueDelta / Math.abs(bFinalValue) : 0;

  const TIE_THRESHOLD = 0.001; // 0.1% difference treated as tie
  let winnerKey: "a" | "b" | "tie";
  if (Math.abs(finalValueDeltaPct) < TIE_THRESHOLD) {
    winnerKey = "tie";
  } else if (aFinalValue > bFinalValue) {
    winnerKey = "a";
  } else {
    winnerKey = "b";
  }

  return {
    horizonYears,
    normalizedInitialCapital,
    a: { finalValue: aFinalValue, totalROI: aROI, timeSeries: aTimeSeries },
    b: { finalValue: bFinalValue, totalROI: bROI, timeSeries: bTimeSeries },
    difference: { finalValueDelta, finalValueDeltaPct, winnerKey },
  };
}
