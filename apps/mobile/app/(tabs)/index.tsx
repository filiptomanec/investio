/**
 * Compound interest calculator — T-015 (bolder mobile pass).
 *
 * Layout (mobile-first):
 *   1. Page title + subtitle
 *   2. Hero result card — gradient teal bg, finalValue at 44px / 900, two
 *      breakdown cells underneath
 *   3. Chart panel (rounded 20, accent border) with legend pills
 *   4. Form inputs (rounded 14, focus halo)
 *   5. Advanced accordion (rounded 20)
 *   6. Sticky bottom CTA — full-width pill, accent glow
 *
 * Chart: Victory Native XL CartesianChart + Area.
 * Live recalc: useDeferredValue (React 18 low-priority).
 */

import { useCallback, useDeferredValue, useEffect, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { useTheme, heroGradient, radii, typo, space } from "@/lib/theme";

// Default inputs matching the S&P 500-like scenario from wireframes
const DEFAULTS = {
  initialAmount: 100000,
  monthlyContribution: 5000,
  annualReturnPct: 7,
  horizonYears: 30,
  contributionTiming: "end" as const,
};

function safeFloat(raw: string, fallback: number): number {
  const n = parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export default function CompoundScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.colors;
  const hero = heroGradient(theme);

  // Form state
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

  const calcInput = {
    type: "compound" as const,
    initialAmount: safeFloat(initialAmountStr, DEFAULTS.initialAmount),
    monthlyContribution: safeFloat(
      monthlyContributionStr,
      DEFAULTS.monthlyContribution
    ),
    annualReturnPct:
      safeFloat(annualReturnPctStr, DEFAULTS.annualReturnPct) / 100,
    horizonYears: Math.max(
      1,
      Math.min(
        50,
        Math.round(safeFloat(horizonYearsStr, DEFAULTS.horizonYears))
      )
    ),
    contributionTiming,
  };

  const deferredInput = useDeferredValue(calcInput);
  const result = calculateCompound(deferredInput);
  const chartData = downsampleSeries(result.timeSeries, 120);
  const gainsROI =
    result.totalContributions > 0
      ? result.totalGains / result.totalContributions
      : 0;

  const handleSave = useCallback(() => {
    // T-013 wires the save action via Supabase. For now: stub.
    console.log("TODO: save compound scenario", deferredInput);
  }, [deferredInput]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: c.background }]}
      edges={["top"]}
    >
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
          {/* Title */}
          <Text
            style={[typo.pageTitle, { color: c.foreground }]}
            accessibilityRole="header"
          >
            {t("calc.compound.title")}
          </Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            {t("calc.compound.subtitle")}
          </Text>

          {/* Hero result */}
          <View
            style={[
              styles.hero,
              { backgroundColor: hero.background, borderRadius: radii.card },
            ]}
            accessibilityRole="summary"
          >
            {/* Halo accent dot (top-right) */}
            <View
              style={[
                styles.heroHalo,
                { backgroundColor: hero.haloColor, opacity: 0.35 },
              ]}
              pointerEvents="none"
            />
            <Text style={[styles.heroLabel, { color: hero.mutedForeground }]}>
              {t("calc.compound.results.finalValue")}
            </Text>
            <Text
              style={[typo.heroNumber, { color: hero.foreground }]}
              accessibilityLabel={`${t(
                "calc.compound.results.finalValue"
              )}: ${formatCurrency(result.finalValue, "CZK", "cs")}`}
            >
              {formatCurrency(result.finalValue, "CZK", "cs")}
            </Text>
            <View style={styles.heroRow}>
              <View style={styles.heroCell}>
                <Text
                  style={[styles.heroCellLabel, { color: hero.mutedForeground }]}
                >
                  {t("calc.compound.results.totalContributions")}
                </Text>
                <Text
                  style={[styles.heroCellValue, { color: hero.foreground }]}
                >
                  {formatCurrency(result.totalContributions, "CZK", "cs")}
                </Text>
              </View>
              <View
                style={[
                  styles.heroDivider,
                  { backgroundColor: hero.foreground, opacity: 0.15 },
                ]}
              />
              <View style={styles.heroCell}>
                <Text
                  style={[styles.heroCellLabel, { color: hero.mutedForeground }]}
                >
                  {t("calc.compound.results.totalGains")}
                </Text>
                <Text
                  style={[styles.heroCellValue, { color: hero.foreground }]}
                >
                  +{formatCurrency(result.totalGains, "CZK", "cs")}
                </Text>
                <Text
                  style={[styles.heroROI, { color: hero.foreground, opacity: 0.85 }]}
                >
                  +{formatPercent(gainsROI, "cs")}
                </Text>
              </View>
            </View>
          </View>

          {/* Chart panel */}
          <Card tone="accent" radius={radii.panel} style={styles.chartCard}>
            <View
              style={styles.chartContainer}
              accessibilityLabel={`${t(
                "calc.compound.chart.contributions"
              )} and ${t("calc.compound.chart.gains")} chart`}
              accessibilityRole="image"
            >
              <ChartArea data={chartData} reducedMotion={reducedMotion} />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: c.chart[4] }]}
                />
                <Text style={[styles.legendLabel, { color: c.mutedForeground }]}>
                  {t("calc.compound.chart.contributions")}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: c.chart[1] }]}
                />
                <Text style={[styles.legendLabel, { color: c.mutedForeground }]}>
                  {t("calc.compound.chart.gains")}
                </Text>
              </View>
            </View>
          </Card>

          {/* Form */}
          <Text style={[typo.eyebrow, { color: c.mutedForeground, marginTop: 6 }]}>
            {t("mobile.inputsSection")}
          </Text>

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

          {/* Advanced */}
          <Accordion title={t("mobile.advancedSection")} defaultOpen={false}>
            <Text style={[styles.fieldLabel, { color: c.foreground }]}>
              {t("calc.compound.fields.contributionTiming.label")}
            </Text>
            <View style={styles.timingRow}>
              <Button
                variant={contributionTiming === "end" ? "primary" : "secondary"}
                size="sm"
                onPress={() => setContributionTiming("end")}
                style={styles.timingBtn}
                accessibilityLabel={t(
                  "calc.compound.fields.contributionTiming.end"
                )}
              >
                {t("calc.compound.fields.contributionTiming.end")}
              </Button>
              <Button
                variant={
                  contributionTiming === "begin" ? "primary" : "secondary"
                }
                size="sm"
                onPress={() => setContributionTiming("begin")}
                style={styles.timingBtn}
                accessibilityLabel={t(
                  "calc.compound.fields.contributionTiming.begin"
                )}
              >
                {t("calc.compound.fields.contributionTiming.begin")}
              </Button>
            </View>
          </Accordion>

          <Text style={[styles.disclaimer, { color: c.mutedForeground }]}>
            {t("calc.compound.disclaimer")}
          </Text>

          <View style={styles.saveButtonSpacer} />
        </ScrollView>

        {/* Sticky save CTA */}
        <View
          style={[
            styles.stickyBar,
            {
              backgroundColor: c.background,
              borderTopColor: c.border,
            },
          ]}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            glow
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

// ── Chart subcomponent ──────────────────────────────────────────────────────

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
  const theme = useTheme();
  const c = theme.colors;

  if (data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={[styles.chartEmptyText, { color: c.mutedForeground }]}>
          Vyplňte vstupy pro zobrazení grafu
        </Text>
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

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    padding: space.gutter,
    paddingBottom: 0,
    gap: space.betweenCards,
  },
  subtitle: {
    fontSize: 14,
    marginTop: -8,
    marginBottom: 4,
  },

  // Hero
  hero: {
    padding: space.card,
    overflow: "hidden",
    gap: 8,
  },
  heroHalo: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  heroCell: {
    flex: 1,
    gap: 2,
  },
  heroDivider: {
    width: 1,
    marginHorizontal: 14,
  },
  heroCellLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "600",
  },
  heroCellValue: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  heroROI: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Chart card
  chartCard: {
    gap: 8,
  },
  chartContainer: {
    height: 200,
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
    fontWeight: "500",
  },

  // Form
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  timingRow: {
    flexDirection: "row",
    gap: 8,
  },
  timingBtn: { flex: 1 },

  disclaimer: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
  saveButtonSpacer: { height: 96 },
  stickyBar: {
    padding: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
});
