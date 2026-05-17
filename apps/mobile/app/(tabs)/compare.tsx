/**
 * Comparison screen — T-015.
 *
 * Mobile layout (vertical stack per wireframe — no side-by-side on 375px):
 *   1. Header with scenario names + common horizon
 *   2. Overlay line chart (A teal / B amber)
 *   3. Winner banner
 *   4. Scenario A accordion (inputs + result)
 *   5. Scenario B accordion (inputs + result)
 *   6. Disclaimer
 *
 * Defaults: pre-built scenarios A (compound S&P-like) + B (real-estate-like)
 * matching the wireframe examples. Full scenario picker is a post-MVP enhancement.
 *
 * Chart: Victory Native XL CartesianChart + Line (2 series overlay).
 */

import { useDeferredValue, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CartesianChart, Line } from "victory-native";

import {
  calculateCompound,
  calculateRealEstate,
  compareScenarios,
  formatCurrency,
  formatPercent,
} from "@investio/shared";
import type { ScenarioComputed } from "@investio/shared";
import { tokens } from "@investio/design-tokens";
import { Card } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

const c = tokens.colors.light;

// Default scenario A: compound S&P 500-like
const DEFAULT_A_INPUT = {
  type: "compound" as const,
  initialAmount: 1300000,
  monthlyContribution: 5000,
  annualReturnPct: 0.07,
  horizonYears: 25,
  contributionTiming: "end" as const,
};

// Default scenario B: real estate Prague apartment
const DEFAULT_B_INPUT = {
  type: "real_estate" as const,
  purchasePrice: 6500000,
  downPayment: 1300000,
  mortgage: { annualRatePct: 0.045, termYears: 25 },
  monthlyRent: 22000,
  monthlyExpenses: 3000,
  vacancyRatePct: 0.05,
  maintenancePctOfRent: 0.05,
  annualAppreciationPct: 0.03,
  annualRentGrowthPct: 0.02,
  incomeTaxPct: 0.15,
  horizonYears: 25,
};

function safeFloat(raw: string, fallback: number): number {
  const n = parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export default function CompareScreen() {
  const { t } = useTranslation();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
  }, []);

  // Scenario A controls (compound)
  const [aInitialStr, setAInitialStr] = useState(String(DEFAULT_A_INPUT.initialAmount));
  const [aContribStr, setAContribStr] = useState(String(DEFAULT_A_INPUT.monthlyContribution));
  const [aReturnStr, setAReturnStr] = useState("7");
  const [aHorizonStr, setAHorizonStr] = useState(String(DEFAULT_A_INPUT.horizonYears));

  // Scenario B controls (real estate)
  const [bPriceStr, setBPriceStr] = useState(String(DEFAULT_B_INPUT.purchasePrice));
  const [bDownStr, setBDownStr] = useState(String(DEFAULT_B_INPUT.downPayment));
  const [bRentStr, setBRentStr] = useState(String(DEFAULT_B_INPUT.monthlyRent));
  const [bHorizonStr, setBHorizonStr] = useState(String(DEFAULT_B_INPUT.horizonYears));

  const aInput = {
    ...DEFAULT_A_INPUT,
    initialAmount: safeFloat(aInitialStr, DEFAULT_A_INPUT.initialAmount),
    monthlyContribution: safeFloat(aContribStr, DEFAULT_A_INPUT.monthlyContribution),
    annualReturnPct: safeFloat(aReturnStr, 7) / 100,
    horizonYears: Math.max(
      1,
      Math.min(50, Math.round(safeFloat(aHorizonStr, DEFAULT_A_INPUT.horizonYears)))
    ),
  };

  const bInput = {
    ...DEFAULT_B_INPUT,
    purchasePrice: safeFloat(bPriceStr, DEFAULT_B_INPUT.purchasePrice),
    downPayment: safeFloat(bDownStr, DEFAULT_B_INPUT.downPayment),
    monthlyRent: safeFloat(bRentStr, DEFAULT_B_INPUT.monthlyRent),
    horizonYears: Math.max(
      1,
      Math.min(30, Math.round(safeFloat(bHorizonStr, DEFAULT_B_INPUT.horizonYears)))
    ),
  };

  const deferredA = useDeferredValue(aInput);
  const deferredB = useDeferredValue(bInput);

  const resultA = calculateCompound(deferredA);
  const resultB = calculateRealEstate(deferredB);

  const scenarioA: ScenarioComputed = {
    kind: "compound",
    horizonYears: deferredA.horizonYears,
    initialCapital: deferredA.initialAmount,
    result: resultA,
  };

  const scenarioB: ScenarioComputed = {
    kind: "real_estate",
    horizonYears: deferredB.horizonYears,
    initialCapital: deferredB.downPayment,
    result: resultB,
  };

  const comparison = compareScenarios(scenarioA, scenarioB);

  // Downsample to ~60 points for chart overlay (2 lines = 120 total points)
  const chartA = downsampleTimeSeries(comparison.a.timeSeries, 60);
  const chartB = downsampleTimeSeries(comparison.b.timeSeries, 60);

  // Merge into single array for CartesianChart (both series on same x)
  const chartData = mergeForChart(chartA, chartB);

  const winner = comparison.difference.winnerKey;
  const winnerLabel =
    winner === "a"
      ? t("mobile.winnerA")
      : winner === "b"
      ? t("mobile.winnerB")
      : t("mobile.tie");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle} accessibilityRole="header">
          {t("comparison.title")}
        </Text>

        {/* Scenario names header */}
        <View style={styles.headerRow}>
          <View style={[styles.scenarioPill, { backgroundColor: c.chart[1] }]}>
            <Text style={styles.scenarioPillText}>A</Text>
          </View>
          <Text style={styles.headerLabel} numberOfLines={1}>
            {t("mobile.scenarioA")} — Složené úročení
          </Text>
        </View>
        <View style={styles.headerRow}>
          <View style={[styles.scenarioPill, { backgroundColor: c.chart[2] }]}>
            <Text style={styles.scenarioPillText}>B</Text>
          </View>
          <Text style={styles.headerLabel} numberOfLines={1}>
            {t("mobile.scenarioB")} — Nemovitost
          </Text>
        </View>
        <Text style={styles.horizonNote}>
          {t("mobile.horizonLabel")}: {comparison.horizonYears} let
        </Text>

        {/* Overlay chart */}
        <View style={styles.chartContainer} accessibilityRole="image">
          <ComparisonChart data={chartData} />
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: c.chart[1] }]} />
            <Text style={styles.legendLabel}>Scénář A (teal)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: c.chart[2] }]} />
            <Text style={styles.legendLabel}>Scénář B (amber)</Text>
          </View>
        </View>

        {/* Winner banner */}
        <Card
          style={[
            styles.winnerCard,
            winner !== "tie"
              ? { borderColor: c.primary, borderWidth: 2 }
              : undefined,
          ]}
        >
          <Text style={styles.winnerLabel}>{winnerLabel}</Text>
          {winner !== "tie" ? (
            <>
              <Text style={styles.winnerDiff}>
                {t("mobile.finalValueDiff")}:{" "}
                {formatCurrency(
                  Math.abs(comparison.difference.finalValueDelta),
                  "CZK",
                  "cs"
                )}
              </Text>
              <Text style={styles.winnerDiffPct}>
                ({formatPercent(Math.abs(comparison.difference.finalValueDeltaPct), "cs")})
              </Text>
            </>
          ) : null}
        </Card>

        {/* Scenario A detail */}
        <Accordion title={`${t("mobile.scenarioA")} — Detail`} defaultOpen={true}>
          <Text style={styles.resultRow}>
            Finální hodnota:{" "}
            <Text style={styles.resultVal}>
              {formatCurrency(comparison.a.finalValue, "CZK", "cs")}
            </Text>
          </Text>
          <Text style={styles.resultRow}>
            ROI:{" "}
            <Text style={styles.resultVal}>
              +{formatPercent(comparison.a.totalROI, "cs")}
            </Text>
          </Text>
          <Input
            label="Počáteční kapitál"
            value={aInitialStr}
            onChangeText={setAInitialStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label="Měsíční vklad"
            value={aContribStr}
            onChangeText={setAContribStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label="Roční výnos"
            value={aReturnStr}
            onChangeText={setAReturnStr}
            keyboardType="decimal-pad"
            unit="%"
          />
          <Input
            label="Horizont"
            value={aHorizonStr}
            onChangeText={setAHorizonStr}
            keyboardType="number-pad"
            unit="let"
          />
        </Accordion>

        {/* Scenario B detail */}
        <Accordion title={`${t("mobile.scenarioB")} — Detail`} defaultOpen={false}>
          <Text style={styles.resultRow}>
            Finální hodnota (equity + cf):{" "}
            <Text style={styles.resultVal}>
              {formatCurrency(comparison.b.finalValue, "CZK", "cs")}
            </Text>
          </Text>
          <Text style={styles.resultRow}>
            ROI:{" "}
            <Text style={styles.resultVal}>
              +{formatPercent(comparison.b.totalROI, "cs")}
            </Text>
          </Text>
          <Input
            label="Kupní cena"
            value={bPriceStr}
            onChangeText={setBPriceStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label="Vlastní kapitál"
            value={bDownStr}
            onChangeText={setBDownStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label="Měsíční nájem"
            value={bRentStr}
            onChangeText={setBRentStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label="Horizont"
            value={bHorizonStr}
            onChangeText={setBHorizonStr}
            keyboardType="number-pad"
            unit="let"
          />
        </Accordion>

        <Text style={styles.disclaimer}>
          Nemovitost: finální hodnota = equity + kumulativní cashflow.
          Složené úročení nezahrnuje daň z prodeje. Oba scénáře normalizovány na společný horizont.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

// Victory Native XL requires data to satisfy Record<string, unknown>
interface MergedPoint extends Record<string, unknown> {
  month: number;
  valueA: number;
  valueB: number;
}

function ComparisonChart({ data }: { data: MergedPoint[] }) {
  if (data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>Vyplňte vstupy pro zobrazení grafu</Text>
      </View>
    );
  }

  return (
    <CartesianChart
      data={data}
      xKey="month"
      yKeys={["valueA", "valueB"]}
      domainPadding={{ top: 20 }}
    >
      {({ points }) => (
        <>
          <Line
            points={points.valueA}
            color={c.chart[1]}
            strokeWidth={2}
          />
          <Line
            points={points.valueB}
            color={c.chart[2]}
            strokeWidth={2}
          />
        </>
      )}
    </CartesianChart>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function downsampleTimeSeries(
  series: Array<{ month: number; value: number }>,
  maxPoints: number
): Array<{ month: number; value: number }> {
  if (series.length === 0) return [];
  const step = Math.max(1, Math.floor(series.length / maxPoints));
  const result: Array<{ month: number; value: number }> = [];
  for (let i = 0; i < series.length; i += step) {
    const pt = series[i];
    if (pt) result.push(pt);
  }
  return result;
}

/**
 * Merge two time series (may have different lengths) into a single array
 * keyed by month, with valueA and valueB. Uses linear interpolation for
 * missing months.
 */
function mergeForChart(
  seriesA: Array<{ month: number; value: number }>,
  seriesB: Array<{ month: number; value: number }>
): MergedPoint[] {
  if (seriesA.length === 0 || seriesB.length === 0) return [];

  const maxMonth = Math.min(
    seriesA[seriesA.length - 1]?.month ?? 0,
    seriesB[seriesB.length - 1]?.month ?? 0
  );

  const mapA = new Map(seriesA.map((p) => [p.month, p.value]));
  const mapB = new Map(seriesB.map((p) => [p.month, p.value]));

  const result: MergedPoint[] = [];
  // Use A months as the spine
  for (const pt of seriesA) {
    if (pt.month > maxMonth) break;
    const vB = mapB.get(pt.month);
    if (vB !== undefined) {
      // `as MergedPoint` is safe — the object satisfies the interface shape
      result.push({ month: pt.month, valueA: pt.value, valueB: vB } as MergedPoint);
    }
  }
  return result;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  scroll: { padding: 16, gap: 12 },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: c.foreground,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scenarioPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scenarioPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: c.foreground,
  },
  horizonNote: {
    fontSize: 12,
    color: c.mutedForeground,
    marginBottom: 4,
  },
  chartContainer: {
    height: 220,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
  },
  chartEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chartEmptyText: {
    fontSize: 13,
    color: c.mutedForeground,
    textAlign: "center",
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: c.mutedForeground,
  },
  winnerCard: {
    gap: 4,
    borderColor: c.primary,
  },
  winnerLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: c.primary,
  },
  winnerDiff: {
    fontSize: 14,
    color: c.foreground,
  },
  winnerDiffPct: {
    fontSize: 12,
    color: c.mutedForeground,
  },
  resultRow: {
    fontSize: 14,
    color: c.foreground,
  },
  resultVal: {
    fontWeight: "700",
    color: c.primary,
  },
  disclaimer: {
    fontSize: 11,
    color: c.mutedForeground,
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 24,
  },
});
