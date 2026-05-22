/**
 * Real estate calculator — T-015 (bolder mobile pass).
 *
 * Layout:
 *   1. Page title + subtitle
 *   2. Hero gradient card — avgMonthlyCashflow (big number) + IRR pill + 4-grid
 *      of secondary metrics
 *   3. Cashflow chart card
 *   4. Equity chart card with legend
 *   5. 5 accordion sections (Koupě / Financování / Příjmy / Náklady / Horizont)
 *   6. Disclaimer
 *   7. Sticky bottom CTA — pill, accent glow
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
import { CartesianChart, Area, Line } from "victory-native";

import { calculateRealEstate } from "@investio/shared";
import { formatCurrency, formatPercent } from "@investio/shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useTheme, heroGradient, radii, typo, space } from "@/lib/theme";

const DEFAULTS = {
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
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
function safePct(raw: string, fallback: number): number {
  const n = parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? n / 100 : fallback;
}

export default function RealEstateScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.colors;
  const hero = heroGradient(theme);
  // We still query reduce-motion to keep parity with web — when we wire
  // chart animations we'll consume this. Today: just no-op listener.
  const [, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
  }, []);

  // Form strings
  const [purchasePriceStr, setPurchasePriceStr] = useState(
    String(DEFAULTS.purchasePrice)
  );
  const [downPaymentStr, setDownPaymentStr] = useState(
    String(DEFAULTS.downPayment)
  );
  const [mortgageRateStr, setMortgageRateStr] = useState("4.5");
  const [mortgageTermStr, setMortgageTermStr] = useState(
    String(DEFAULTS.mortgage.termYears)
  );
  const [monthlyRentStr, setMonthlyRentStr] = useState(
    String(DEFAULTS.monthlyRent)
  );
  const [monthlyExpensesStr, setMonthlyExpensesStr] = useState(
    String(DEFAULTS.monthlyExpenses)
  );
  const [vacancyStr, setVacancyStr] = useState("5");
  const [maintenanceStr, setMaintenanceStr] = useState("5");
  const [appreciationStr, setAppreciationStr] = useState("3");
  const [rentGrowthStr, setRentGrowthStr] = useState("2");
  const [taxStr, setTaxStr] = useState("15");
  const [horizonStr, setHorizonStr] = useState(String(DEFAULTS.horizonYears));

  const calcInput = {
    type: "real_estate" as const,
    purchasePrice: safeFloat(purchasePriceStr, DEFAULTS.purchasePrice),
    downPayment: safeFloat(downPaymentStr, DEFAULTS.downPayment),
    mortgage: {
      annualRatePct: safePct(mortgageRateStr, DEFAULTS.mortgage.annualRatePct),
      termYears: Math.max(
        1,
        Math.min(
          40,
          Math.round(safeFloat(mortgageTermStr, DEFAULTS.mortgage.termYears))
        )
      ),
    },
    monthlyRent: safeFloat(monthlyRentStr, DEFAULTS.monthlyRent),
    monthlyExpenses: safeFloat(monthlyExpensesStr, DEFAULTS.monthlyExpenses),
    vacancyRatePct: safePct(vacancyStr, DEFAULTS.vacancyRatePct),
    maintenancePctOfRent: safePct(
      maintenanceStr,
      DEFAULTS.maintenancePctOfRent
    ),
    annualAppreciationPct: safePct(
      appreciationStr,
      DEFAULTS.annualAppreciationPct
    ),
    annualRentGrowthPct: safePct(rentGrowthStr, DEFAULTS.annualRentGrowthPct),
    incomeTaxPct: safePct(taxStr, DEFAULTS.incomeTaxPct),
    horizonYears: Math.max(
      1,
      Math.min(30, Math.round(safeFloat(horizonStr, DEFAULTS.horizonYears)))
    ),
  };

  const validInput =
    calcInput.downPayment <= calcInput.purchasePrice
      ? calcInput
      : { ...calcInput, downPayment: calcInput.purchasePrice };

  const deferredInput = useDeferredValue(validInput);
  const result = calculateRealEstate(deferredInput);

  const cashflowData = downsampleSeries(result.timeSeries, 100);
  const equityData = downsampleEquity(result.timeSeries, 100);

  const handleSave = useCallback(() => {
    console.log("TODO: save real-estate scenario", deferredInput);
  }, [deferredInput]);

  const positiveCashflow = result.averageMonthlyCashflow >= 0;
  const cashflowColor = positiveCashflow ? hero.foreground : c.destructive;

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
            {t("calc.realEstate.title")}
          </Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            {t("calc.realEstate.subtitle")}
          </Text>

          {/* Hero metrics */}
          <View
            style={[
              styles.hero,
              { backgroundColor: hero.background, borderRadius: radii.card },
            ]}
            accessibilityRole="summary"
          >
            <View
              style={[
                styles.heroHalo,
                { backgroundColor: hero.haloColor, opacity: 0.35 },
              ]}
              pointerEvents="none"
            />
            <Text style={[styles.heroLabel, { color: hero.mutedForeground }]}>
              {t("calc.realEstate.results.averageMonthlyCashflow")}
            </Text>
            <Text
              style={[typo.heroNumber, { color: cashflowColor }]}
              accessibilityLabel={`Průměrný měsíční cashflow: ${formatCurrency(
                result.averageMonthlyCashflow,
                "CZK",
                "cs"
              )}`}
            >
              {positiveCashflow ? "+" : ""}
              {formatCurrency(result.averageMonthlyCashflow, "CZK", "cs")}
            </Text>

            {/* IRR + breakeven pills */}
            <View style={styles.heroPillsRow}>
              <View
                style={[
                  styles.heroPill,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.teal[800] : theme.teal[200],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.heroPillLabel,
                    { color: hero.mutedForeground },
                  ]}
                >
                  IRR
                </Text>
                <Text
                  style={[
                    styles.heroPillValue,
                    { color: hero.foreground },
                  ]}
                >
                  {result.irr !== null
                    ? formatPercent(result.irr, "cs")
                    : "—"}
                </Text>
              </View>
              <View
                style={[
                  styles.heroPill,
                  {
                    backgroundColor:
                      theme.mode === "dark" ? theme.teal[800] : theme.teal[200],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.heroPillLabel,
                    { color: hero.mutedForeground },
                  ]}
                >
                  {t("calc.realEstate.results.breakEvenMonth")}
                </Text>
                <Text
                  style={[
                    styles.heroPillValue,
                    { color: hero.foreground },
                  ]}
                >
                  {result.breakEvenMonth !== null
                    ? `${result.breakEvenMonth}. m.`
                    : "—"}
                </Text>
              </View>
            </View>
          </View>

          {/* Secondary metrics grid */}
          <View style={styles.metricsGrid}>
            <MetricCell
              label={t("calc.realEstate.results.grossYield")}
              value={formatPercent(result.grossYield, "cs")}
            />
            <MetricCell
              label={t("calc.realEstate.results.netYield")}
              value={formatPercent(result.netYield, "cs")}
            />
            <MetricCell
              label={t("calc.realEstate.results.finalEquity")}
              value={formatCurrency(result.finalEquity, "CZK", "cs")}
            />
            <MetricCell
              label={t("calc.realEstate.results.monthlyPayment")}
              value={formatCurrency(result.monthlyPayment, "CZK", "cs")}
            />
          </View>

          {/* Cashflow chart */}
          <Card tone="accent" radius={radii.panel} style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: c.foreground }]}>
              {t("calc.realEstate.chart.cashflow")}
            </Text>
            <View style={styles.chartContainer} accessibilityRole="image">
              <CashflowChart data={cashflowData} />
            </View>
          </Card>

          {/* Equity chart */}
          <Card tone="accent" radius={radii.panel} style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: c.foreground }]}>
              {t("calc.realEstate.chart.equity")}
            </Text>
            <View style={styles.chartContainer} accessibilityRole="image">
              <EquityChart data={equityData} />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: c.chart[1] }]}
                />
                <Text
                  style={[styles.legendLabel, { color: c.mutedForeground }]}
                >
                  {t("calc.realEstate.chart.propertyValue")}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: c.chart[3] }]}
                />
                <Text
                  style={[styles.legendLabel, { color: c.mutedForeground }]}
                >
                  {t("calc.realEstate.chart.equity")}
                </Text>
              </View>
            </View>
          </Card>

          {/* Sections */}
          <Text
            style={[typo.eyebrow, { color: c.mutedForeground, marginTop: 6 }]}
          >
            {t("mobile.inputsSection")}
          </Text>

          <Accordion
            title={t("calc.realEstate.sections.purchase")}
            defaultOpen={true}
          >
            <Input
              label={t("calc.realEstate.fields.purchasePrice")}
              value={purchasePriceStr}
              onChangeText={setPurchasePriceStr}
              keyboardType="numeric"
              unit="Kč"
            />
            <Input
              label={t("calc.realEstate.fields.downPayment")}
              value={downPaymentStr}
              onChangeText={setDownPaymentStr}
              keyboardType="numeric"
              unit="Kč"
              error={
                safeFloat(downPaymentStr, 0) > safeFloat(purchasePriceStr, 1)
                  ? "Vlastní kapitál nesmí překročit kupní cenu"
                  : null
              }
            />
            <Input
              label={t("calc.realEstate.fields.annualAppreciationPct")}
              value={appreciationStr}
              onChangeText={setAppreciationStr}
              keyboardType="decimal-pad"
              unit="%"
            />
          </Accordion>

          <Accordion
            title={t("calc.realEstate.sections.financing")}
            defaultOpen={false}
          >
            <Input
              label={t("calc.realEstate.fields.rate")}
              value={mortgageRateStr}
              onChangeText={setMortgageRateStr}
              keyboardType="decimal-pad"
              unit="%"
            />
            <Input
              label={t("calc.realEstate.fields.term")}
              value={mortgageTermStr}
              onChangeText={setMortgageTermStr}
              keyboardType="number-pad"
              unit="let"
            />
          </Accordion>

          <Accordion
            title={t("calc.realEstate.sections.income")}
            defaultOpen={false}
          >
            <Input
              label={t("calc.realEstate.fields.monthlyRent")}
              value={monthlyRentStr}
              onChangeText={setMonthlyRentStr}
              keyboardType="numeric"
              unit="Kč"
            />
            <Input
              label={t("calc.realEstate.fields.vacancyRatePct")}
              value={vacancyStr}
              onChangeText={setVacancyStr}
              keyboardType="decimal-pad"
              unit="%"
            />
            <Input
              label={t("calc.realEstate.fields.annualRentGrowthPct")}
              value={rentGrowthStr}
              onChangeText={setRentGrowthStr}
              keyboardType="decimal-pad"
              unit="%"
            />
          </Accordion>

          <Accordion
            title={t("calc.realEstate.sections.costs")}
            defaultOpen={false}
          >
            <Input
              label={t("calc.realEstate.fields.monthlyExpenses")}
              value={monthlyExpensesStr}
              onChangeText={setMonthlyExpensesStr}
              keyboardType="numeric"
              unit="Kč"
            />
            <Input
              label={t("calc.realEstate.fields.incomeTaxPct")}
              value={taxStr}
              onChangeText={setTaxStr}
              keyboardType="decimal-pad"
              unit="%"
            />
            <Input
              label="Údržba (% z nájmu)"
              value={maintenanceStr}
              onChangeText={setMaintenanceStr}
              keyboardType="decimal-pad"
              unit="%"
            />
          </Accordion>

          <Accordion
            title={t("calc.realEstate.sections.horizon")}
            defaultOpen={false}
          >
            <Input
              label={t("calc.compound.fields.horizonYears")}
              value={horizonStr}
              onChangeText={setHorizonStr}
              keyboardType="number-pad"
              unit="let"
            />
          </Accordion>

          <Text style={[styles.disclaimer, { color: c.mutedForeground }]}>
            {t("calc.realEstate.disclaimer")}
          </Text>

          <View style={styles.saveButtonSpacer} />
        </ScrollView>

        <View
          style={[
            styles.stickyBar,
            { backgroundColor: c.background, borderTopColor: c.border },
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

// ── Subcomponents ───────────────────────────────────────────────────────────

function MetricCell({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <View
      style={[
        styles.metricCell,
        {
          backgroundColor: c.muted,
          borderRadius: radii.input,
        },
      ]}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={[styles.metricLabel, { color: c.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.metricValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

interface CashflowPoint extends Record<string, unknown> {
  month: number;
  netCashflow: number;
}

function CashflowChart({ data }: { data: CashflowPoint[] }) {
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
      yKeys={["netCashflow"]}
      domainPadding={{ top: 20 }}
    >
      {({ points, chartBounds }) => (
        <Area
          points={points.netCashflow}
          y0={chartBounds.bottom}
          color={c.chart[1]}
          opacity={0.75}
        />
      )}
    </CartesianChart>
  );
}

interface EquityPoint extends Record<string, unknown> {
  month: number;
  propertyValue: number;
  equity: number;
}

function EquityChart({ data }: { data: EquityPoint[] }) {
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
      yKeys={["propertyValue", "equity"]}
      domainPadding={{ top: 20 }}
    >
      {({ points, chartBounds }) => (
        <>
          <Area
            points={points.propertyValue}
            y0={chartBounds.bottom}
            color={c.chart[1]}
            opacity={0.3}
          />
          <Line points={points.equity} color={c.chart[3]} strokeWidth={2} />
        </>
      )}
    </CartesianChart>
  );
}

// Suppress unused-import warning for Badge — we expose it through the IRR pill
// pattern but inline JSX uses inline styles. Kept import for future use.
void Badge;

// ── Helpers ─────────────────────────────────────────────────────────────────

function downsampleSeries(
  series: Array<{ month: number; netCashflow: number }>,
  maxPoints: number
): CashflowPoint[] {
  if (series.length === 0) return [];
  const step = Math.max(1, Math.floor(series.length / maxPoints));
  const result: CashflowPoint[] = [];
  for (let i = 0; i < series.length; i += step) {
    const pt = series[i];
    if (pt)
      result.push({
        month: pt.month,
        netCashflow: pt.netCashflow,
      } as CashflowPoint);
  }
  return result;
}

function downsampleEquity(
  series: Array<{ month: number; propertyValue: number; equity: number }>,
  maxPoints: number
): EquityPoint[] {
  if (series.length === 0) return [];
  const step = Math.max(1, Math.floor(series.length / maxPoints));
  const result: EquityPoint[] = [];
  for (let i = 0; i < series.length; i += step) {
    const pt = series[i];
    if (pt)
      result.push({
        month: pt.month,
        propertyValue: pt.propertyValue,
        equity: pt.equity,
      } as EquityPoint);
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
  heroPillsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  heroPillLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroPillValue: {
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  // Metrics grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCell: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: 14,
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

  // Charts
  chartCard: {
    gap: 10,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  chartContainer: {
    height: 180,
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

  disclaimer: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 8,
  },
  saveButtonSpacer: { height: 96 },
  stickyBar: {
    padding: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
});
