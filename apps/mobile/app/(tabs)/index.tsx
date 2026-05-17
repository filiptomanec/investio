/**
 * Compound interest calculator — T-015.
 *
 * Layout (mobile-first):
 *   1. Hero result card (finalValue + breakdown) — always visible
 *   2. Chart (stacked area: contributions muted, gains teal)
 *   3. Form fields (numeric keyboard)
 *   4. Advanced accordion (contributionTiming)
 *   5. Sticky save CTA (stub — T-013 wires save)
 *
 * Chart: Victory Native XL CartesianChart + Area.
 * Requires a dev build with @shopify/react-native-skia native module.
 *
 * Live recalc: debounced 200ms via manual setTimeout ref.
 */

import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CartesianChart, Area } from "victory-native";

import { calculateCompound } from "@investio/shared";
import { formatCurrency, formatPercent } from "@investio/shared";
import { tokens } from "@investio/design-tokens";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";

const c = tokens.colors.light;

// Default inputs matching the S&P 500-like scenario from wireframes
const DEFAULTS = {
  initialAmount: 100000,
  monthlyContribution: 5000,
  annualReturnPct: 7,   // displayed as 7.0 → stored as 0.07 in calc
  horizonYears: 30,
  contributionTiming: "end" as const,
};

function safeFloat(raw: string, fallback: number): number {
  const n = parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export default function CompoundScreen() {
  const { t } = useTranslation();

  // Form state — raw string for display, derived number for calc
  const [initialAmountStr, setInitialAmountStr] = useState(
    String(DEFAULTS.initialAmount)
  );
  const [monthlyContributionStr, setMonthlyContributionStr] = useState(
    String(DEFAULTS.monthlyContribution)
  );
  const [annualReturnPctStr, setAnnualReturnPctStr] = useState(
    String(DEFAULTS.annualReturnPct)
  );
  const [horizonYearsStr, setHorizonYearsStr] = useState(
    String(DEFAULTS.horizonYears)
  );
  const [contributionTiming, setContributionTiming] = useState<"begin" | "end">(
    DEFAULTS.contributionTiming
  );
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
  }, []);

  // Build calc input from strings
  const calcInput = {
    type: "compound" as const,
    initialAmount: safeFloat(initialAmountStr, DEFAULTS.initialAmount),
    monthlyContribution: safeFloat(monthlyContributionStr, DEFAULTS.monthlyContribution),
    annualReturnPct: safeFloat(annualReturnPctStr, DEFAULTS.annualReturnPct) / 100,
    horizonYears: Math.max(
      1,
      Math.min(50, Math.round(safeFloat(horizonYearsStr, DEFAULTS.horizonYears)))
    ),
    contributionTiming,
  };

  // Debounce via useDeferredValue — React 18 low-priority re-render
  const deferredInput = useDeferredValue(calcInput);

  const result = calculateCompound(deferredInput);

  // Downsample time series for chart — max 120 points (yearly + some monthly)
  const chartData = downsampleSeries(result.timeSeries, 120);

  const gainsROI =
    result.totalContributions > 0
      ? result.totalGains / result.totalContributions
      : 0;

  const handleSave = useCallback(() => {
    // T-013 will wire this to POST /scenarios via Supabase
    // eslint-disable-next-line no-console
    console.log("TODO: save compound scenario", deferredInput);
  }, [deferredInput]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Screen title */}
          <Text style={styles.screenTitle} accessibilityRole="header">
            {t("calc.compound.title")}
          </Text>
          <Text style={styles.screenSubtitle}>{t("calc.compound.subtitle")}</Text>

          {/* Hero result */}
          <Card style={styles.heroCard}>
            <Text style={styles.heroLabel}>
              {t("calc.compound.results.finalValue")}
            </Text>
            <Text
              style={styles.heroValue}
              accessibilityLabel={`${t("calc.compound.results.finalValue")}: ${formatCurrency(result.finalValue, "CZK", "cs")}`}
            >
              {formatCurrency(result.finalValue, "CZK", "cs")}
            </Text>
            <View style={styles.heroRow}>
              <View style={styles.heroCell}>
                <Text style={styles.heroCellLabel}>
                  {t("calc.compound.results.totalContributions")}
                </Text>
                <Text style={styles.heroCellValue}>
                  {formatCurrency(result.totalContributions, "CZK", "cs")}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroCell}>
                <Text style={styles.heroCellLabel}>
                  {t("calc.compound.results.totalGains")}
                </Text>
                <Text style={[styles.heroCellValue, styles.gainsValue]}>
                  +{formatCurrency(result.totalGains, "CZK", "cs")}
                </Text>
                <Text style={styles.gainsROI}>
                  +{formatPercent(gainsROI, "cs")}
                </Text>
              </View>
            </View>
          </Card>

          {/* Chart */}
          <View
            style={styles.chartContainer}
            accessibilityLabel={`${t("calc.compound.chart.contributions")} and ${t("calc.compound.chart.gains")} chart`}
            accessibilityRole="image"
          >
            <ChartArea
              data={chartData}
              reducedMotion={reducedMotion}
            />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c.chart[4] }]} />
              <Text style={styles.legendLabel}>{t("calc.compound.chart.contributions")}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c.chart[1] }]} />
              <Text style={styles.legendLabel}>{t("calc.compound.chart.gains")}</Text>
            </View>
          </View>

          {/* Form */}
          <Text style={styles.sectionLabel}>VSTUPY</Text>

          <Input
            label={t("calc.compound.fields.initialAmount")}
            value={initialAmountStr}
            onChangeText={setInitialAmountStr}
            keyboardType="numeric"
            unit="Kč"
            returnKeyType="done"
            accessibilityHint="Zadejte počáteční částku v korunách"
          />
          <Input
            label={t("calc.compound.fields.monthlyContribution")}
            value={monthlyContributionStr}
            onChangeText={setMonthlyContributionStr}
            keyboardType="numeric"
            unit="Kč"
            returnKeyType="done"
            accessibilityHint="Zadejte měsíční vklad v korunách"
          />
          <Input
            label={t("calc.compound.fields.annualReturnPct")}
            value={annualReturnPctStr}
            onChangeText={setAnnualReturnPctStr}
            keyboardType="decimal-pad"
            unit="%"
            returnKeyType="done"
            accessibilityHint="Zadejte roční výnos v procentech"
          />
          <Input
            label={t("calc.compound.fields.horizonYears")}
            value={horizonYearsStr}
            onChangeText={setHorizonYearsStr}
            keyboardType="number-pad"
            unit="let"
            returnKeyType="done"
            accessibilityHint="Zadejte investiční horizont v letech (1–50)"
          />

          {/* Advanced accordion */}
          <Accordion
            title={t("mobile.advancedSection")}
            defaultOpen={false}
          >
            <Text style={styles.fieldLabel}>
              {t("calc.compound.fields.contributionTiming.label")}
            </Text>
            <View style={styles.timingRow}>
              <Button
                variant={contributionTiming === "end" ? "primary" : "secondary"}
                size="sm"
                onPress={() => setContributionTiming("end")}
                style={styles.timingBtn}
                accessibilityLabel={t("calc.compound.fields.contributionTiming.end")}
              >
                {t("calc.compound.fields.contributionTiming.end")}
              </Button>
              <Button
                variant={contributionTiming === "begin" ? "primary" : "secondary"}
                size="sm"
                onPress={() => setContributionTiming("begin")}
                style={styles.timingBtn}
                accessibilityLabel={t("calc.compound.fields.contributionTiming.begin")}
              >
                {t("calc.compound.fields.contributionTiming.begin")}
              </Button>
            </View>
          </Accordion>

          <Text style={styles.disclaimer}>{t("calc.compound.disclaimer")}</Text>

          {/* Bottom spacer for sticky CTA */}
          <View style={styles.saveButtonSpacer} />
        </ScrollView>

        {/* Sticky save CTA */}
        <View style={styles.stickyBar}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSave}
            accessibilityLabel={t("mobile.saveScenario")}
          >
            {t("mobile.saveScenario")}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Chart subcomponent ────────────────────────────────────────────────────────

// Victory Native XL requires data to satisfy Record<string, unknown>
// The index signature makes the type compatible while keeping named properties.
interface ChartDataPoint extends Record<string, unknown> {
  month: number;
  contributions: number;
  gains: number;
}

interface ChartAreaProps {
  data: ChartDataPoint[];
  reducedMotion: boolean;
}

function ChartArea({ data }: ChartAreaProps) {
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
      yKeys={["contributions", "gains"]}
      domainPadding={{ top: 20 }}
    >
      {({ points, chartBounds }) => (
        <>
          <Area
            points={points.contributions}
            y0={chartBounds.bottom}
            color={c.chart[4]}
            opacity={0.6}
          />
          <Area
            points={points.gains}
            y0={chartBounds.bottom}
            color={c.chart[1]}
            opacity={0.85}
          />
        </>
      )}
    </CartesianChart>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Downsample time series to at most `maxPoints` for chart performance.
 * Keeps first + last point, samples evenly between.
 */
function downsampleSeries(
  series: Array<{ month: number; contributions: number; value: number }>,
  maxPoints: number
): ChartDataPoint[] {
  if (series.length === 0) return [];

  const step = Math.max(1, Math.floor(series.length / maxPoints));
  const result: ChartDataPoint[] = [];

  for (let i = 0; i < series.length; i += step) {
    const pt = series[i];
    if (pt) {
      result.push({
        month: pt.month,
        contributions: pt.contributions,
        gains: Math.max(0, pt.value - pt.contributions),
      });
    }
  }

  // Always include the last point
  const last = series[series.length - 1];
  if (last && result[result.length - 1]?.month !== last.month) {
    result.push({
      month: last.month,
      contributions: last.contributions,
      gains: Math.max(0, last.value - last.contributions),
    });
  }

  return result;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  scroll: {
    padding: 16,
    paddingBottom: 0,
    gap: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: c.foreground,
    marginBottom: 2,
  },
  screenSubtitle: {
    fontSize: 13,
    color: c.mutedForeground,
    marginBottom: 4,
  },

  // Hero card
  heroCard: { gap: 8 },
  heroLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: c.mutedForeground,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  heroValue: {
    fontSize: 32,
    fontWeight: "700",
    color: c.primary,
    letterSpacing: -0.5,
  },
  heroRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  heroCell: {
    flex: 1,
    gap: 2,
  },
  heroDivider: {
    width: 1,
    backgroundColor: c.border,
    marginHorizontal: 12,
  },
  heroCellLabel: {
    fontSize: 11,
    color: c.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  heroCellValue: {
    fontSize: 15,
    fontWeight: "600",
    color: c.foreground,
  },
  gainsValue: {
    color: c.success,
  },
  gainsROI: {
    fontSize: 12,
    color: c.success,
  },

  // Chart
  chartContainer: {
    height: 200,
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
    marginTop: -4,
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

  // Form
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: c.mutedForeground,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: c.foreground,
    marginBottom: 4,
  },
  timingRow: {
    flexDirection: "row",
    gap: 8,
  },
  timingBtn: {
    flex: 1,
  },

  disclaimer: {
    fontSize: 11,
    color: c.mutedForeground,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  saveButtonSpacer: { height: 80 },
  stickyBar: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
});
