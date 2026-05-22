/**
 * Comparison screen — T-015 (bolder mobile pass).
 *
 * Layout (vertical stack, mobile-first):
 *   1. Page title
 *   2. Two scenario header pills (A teal / B amber) with names
 *   3. Overlay chart card (rounded 20)
 *   4. Winner banner — bolder primary-tinted card
 *   5. Scenario A + B accordions with inputs + result rows
 *   6. Disclaimer
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
import { Card } from "@/components/ui/card";
import { Accordion } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useTheme, radii, typo, space, glowShadow } from "@/lib/theme";

const DEFAULT_A_INPUT = {
  type: "compound" as const,
  initialAmount: 1300000,
  monthlyContribution: 5000,
  annualReturnPct: 0.07,
  horizonYears: 25,
  contributionTiming: "end" as const,
};

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
  const theme = useTheme();
  const c = theme.colors;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
  }, []);

  // Scenario A controls (compound)
  const [aInitialStr, setAInitialStr] = useState(
    String(DEFAULT_A_INPUT.initialAmount)
  );
  const [aContribStr, setAContribStr] = useState(
    String(DEFAULT_A_INPUT.monthlyContribution)
  );
  const [aReturnStr, setAReturnStr] = useState("7");
  const [aHorizonStr, setAHorizonStr] = useState(
    String(DEFAULT_A_INPUT.horizonYears)
  );

  // Scenario B controls (real estate)
  const [bPriceStr, setBPriceStr] = useState(
    String(DEFAULT_B_INPUT.purchasePrice)
  );
  const [bDownStr, setBDownStr] = useState(
    String(DEFAULT_B_INPUT.downPayment)
  );
  const [bRentStr, setBRentStr] = useState(String(DEFAULT_B_INPUT.monthlyRent));
  const [bHorizonStr, setBHorizonStr] = useState(
    String(DEFAULT_B_INPUT.horizonYears)
  );

  const aInput = {
    ...DEFAULT_A_INPUT,
    initialAmount: safeFloat(aInitialStr, DEFAULT_A_INPUT.initialAmount),
    monthlyContribution: safeFloat(
      aContribStr,
      DEFAULT_A_INPUT.monthlyContribution
    ),
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
  const chartA = downsampleTimeSeries(comparison.a.timeSeries, 60);
  const chartB = downsampleTimeSeries(comparison.b.timeSeries, 60);
  const chartData = mergeForChart(chartA, chartB);

  const winner = comparison.difference.winnerKey;
  const winnerLabel =
    winner === "a"
      ? t("mobile.winnerA")
      : winner === "b"
        ? t("mobile.winnerB")
        : t("mobile.tie");

  const aColor = c.chart[1];
  const bColor = c.chart[2];

  void reducedMotion;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[typo.pageTitle, { color: c.foreground }]}
          accessibilityRole="header"
        >
          {t("comparison.title")}
        </Text>

        {/* Scenario header pills */}
        <View style={styles.headerStack}>
          <ScenarioHeaderRow
            color={aColor}
            letter="A"
            label={`${t("mobile.scenarioA")} — ${t(
              "dashboard.filter.compound"
            )}`}
          />
          <ScenarioHeaderRow
            color={bColor}
            letter="B"
            label={`${t("mobile.scenarioB")} — ${t(
              "dashboard.filter.realEstate"
            )}`}
          />
          <Text style={[styles.horizonNote, { color: c.mutedForeground }]}>
            {t("mobile.horizonLabel")}: {comparison.horizonYears} let
          </Text>
        </View>

        {/* Overlay chart */}
        <Card tone="accent" radius={radii.panel} style={styles.chartCard}>
          <View style={styles.chartContainer} accessibilityRole="image">
            <ComparisonChart
              data={chartData}
              colorA={aColor}
              colorB={bColor}
              empty={c.mutedForeground}
            />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: aColor }]} />
              <Text style={[styles.legendLabel, { color: c.mutedForeground }]}>
                {t("mobile.scenarioA")}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bColor }]} />
              <Text style={[styles.legendLabel, { color: c.mutedForeground }]}>
                {t("mobile.scenarioB")}
              </Text>
            </View>
          </View>
        </Card>

        {/* Winner banner */}
        <View
          style={[
            styles.winner,
            {
              backgroundColor:
                theme.mode === "dark" ? theme.teal[900] : theme.teal[50],
              borderColor:
                theme.mode === "dark" ? theme.teal[600] : theme.teal[300],
              borderRadius: radii.card,
              ...(winner !== "tie" ? glowShadow(theme, 0.3) : {}),
            },
          ]}
        >
          <Text
            style={[
              styles.winnerLabel,
              {
                color:
                  theme.mode === "dark" ? theme.teal[100] : theme.teal[900],
              },
            ]}
          >
            {winnerLabel}
          </Text>
          {winner !== "tie" ? (
            <>
              <Text
                style={[
                  styles.winnerDiff,
                  {
                    color:
                      theme.mode === "dark"
                        ? theme.teal[100]
                        : theme.teal[800],
                  },
                ]}
              >
                {t("mobile.finalValueDiff")}:{" "}
                <Text style={styles.winnerDiffStrong}>
                  {formatCurrency(
                    Math.abs(comparison.difference.finalValueDelta),
                    "CZK",
                    "cs"
                  )}
                </Text>
              </Text>
              <Text
                style={[
                  styles.winnerDiffPct,
                  {
                    color:
                      theme.mode === "dark"
                        ? theme.teal[200]
                        : theme.teal[700],
                  },
                ]}
              >
                (
                {formatPercent(
                  Math.abs(comparison.difference.finalValueDeltaPct),
                  "cs"
                )}
                )
              </Text>
            </>
          ) : null}
        </View>

        {/* Scenario A detail */}
        <Accordion
          title={`${t("mobile.scenarioA")} — Detail`}
          defaultOpen={true}
        >
          <ResultRow
            label={t("calc.compound.results.finalValue")}
            value={formatCurrency(comparison.a.finalValue, "CZK", "cs")}
          />
          <ResultRow
            label="ROI"
            value={`+${formatPercent(comparison.a.totalROI, "cs")}`}
          />
          <Input
            label={t("calc.compound.fields.initialAmount")}
            value={aInitialStr}
            onChangeText={setAInitialStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label={t("calc.compound.fields.monthlyContribution")}
            value={aContribStr}
            onChangeText={setAContribStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label={t("calc.compound.fields.annualReturnPct")}
            value={aReturnStr}
            onChangeText={setAReturnStr}
            keyboardType="decimal-pad"
            unit="%"
          />
          <Input
            label={t("calc.compound.fields.horizonYears")}
            value={aHorizonStr}
            onChangeText={setAHorizonStr}
            keyboardType="number-pad"
            unit="let"
          />
        </Accordion>

        {/* Scenario B detail */}
        <Accordion
          title={`${t("mobile.scenarioB")} — Detail`}
          defaultOpen={false}
        >
          <ResultRow
            label={t("calc.compound.results.finalValue")}
            value={formatCurrency(comparison.b.finalValue, "CZK", "cs")}
          />
          <ResultRow
            label="ROI"
            value={`+${formatPercent(comparison.b.totalROI, "cs")}`}
          />
          <Input
            label={t("calc.realEstate.fields.purchasePrice")}
            value={bPriceStr}
            onChangeText={setBPriceStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label={t("calc.realEstate.fields.downPayment")}
            value={bDownStr}
            onChangeText={setBDownStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label={t("calc.realEstate.fields.monthlyRent")}
            value={bRentStr}
            onChangeText={setBRentStr}
            keyboardType="numeric"
            unit="Kč"
          />
          <Input
            label={t("calc.compound.fields.horizonYears")}
            value={bHorizonStr}
            onChangeText={setBHorizonStr}
            keyboardType="number-pad"
            unit="let"
          />
        </Accordion>

        <Text style={[styles.disclaimer, { color: c.mutedForeground }]}>
          {t("mobile.comparisonDisclaimer")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Subcomponents ───────────────────────────────────────────────────────────

function ScenarioHeaderRow({
  color,
  letter,
  label,
}: {
  color: string;
  letter: string;
  label: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.headerRow}>
      <View style={[styles.scenarioPill, { backgroundColor: color }]}>
        <Text style={styles.scenarioPillText}>{letter}</Text>
      </View>
      <Text
        style={[styles.headerLabel, { color: theme.colors.foreground }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultLabel, { color: theme.colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.resultValue, { color: theme.colors.primary }]}>
        {value}
      </Text>
    </View>
  );
}

interface MergedPoint extends Record<string, unknown> {
  month: number;
  valueA: number;
  valueB: number;
}

function ComparisonChart({
  data,
  colorA,
  colorB,
  empty,
}: {
  data: MergedPoint[];
  colorA: string;
  colorB: string;
  empty: string;
}) {
  if (data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={[styles.chartEmptyText, { color: empty }]}>
          Vyplňte vstupy pro zobrazení grafu
        </Text>
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
          <Line points={points.valueA} color={colorA} strokeWidth={2.5} />
          <Line points={points.valueB} color={colorB} strokeWidth={2.5} />
        </>
      )}
    </CartesianChart>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function mergeForChart(
  seriesA: Array<{ month: number; value: number }>,
  seriesB: Array<{ month: number; value: number }>
): MergedPoint[] {
  if (seriesA.length === 0 || seriesB.length === 0) return [];
  const maxMonth = Math.min(
    seriesA[seriesA.length - 1]?.month ?? 0,
    seriesB[seriesB.length - 1]?.month ?? 0
  );
  const mapB = new Map(seriesB.map((p) => [p.month, p.value]));
  const result: MergedPoint[] = [];
  for (const pt of seriesA) {
    if (pt.month > maxMonth) break;
    const vB = mapB.get(pt.month);
    if (vB !== undefined) {
      result.push({
        month: pt.month,
        valueA: pt.value,
        valueB: vB,
      } as MergedPoint);
    }
  }
  return result;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: space.gutter, gap: space.betweenCards },

  headerStack: { gap: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scenarioPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scenarioPillText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  headerLabel: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
    flex: 1,
  },
  horizonNote: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 4,
  },

  // Chart
  chartCard: {
    gap: 10,
  },
  chartContainer: {
    height: 220,
    overflow: "hidden",
    borderRadius: radii.sm,
  },
  chartEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chartEmptyText: {
    fontSize: 13,
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
    fontWeight: "600",
  },

  // Winner
  winner: {
    padding: 20,
    borderWidth: 1.5,
    gap: 4,
  },
  winnerLabel: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  winnerDiff: {
    fontSize: 14,
    fontWeight: "500",
  },
  winnerDiffStrong: {
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  winnerDiffPct: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Result rows in accordions
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultValue: {
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  disclaimer: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 24,
  },
});
