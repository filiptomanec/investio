/**
 * Real estate calculator — T-015.
 *
 * Layout:
 *   1. Hero metrics (monthlyCashflow, yield, IRR, equity, break-even)
 *   2. Cashflow chart + Equity build-up chart
 *   3. Input accordion sections: Koupě / Financování / Příjmy / Náklady / Horizont
 *   4. Disclaimer
 *   5. Sticky save CTA (stub)
 *
 * Chart: Victory Native XL CartesianChart + Area/Line.
 * Requires a dev build with @shopify/react-native-skia.
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
import { tokens } from "@investio/design-tokens";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";

const c = tokens.colors.light;

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
  const [reducedMotion, setReducedMotion] = useState(false);

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
        Math.min(40, Math.round(safeFloat(mortgageTermStr, DEFAULTS.mortgage.termYears)))
      ),
    },
    monthlyRent: safeFloat(monthlyRentStr, DEFAULTS.monthlyRent),
    monthlyExpenses: safeFloat(monthlyExpensesStr, DEFAULTS.monthlyExpenses),
    vacancyRatePct: safePct(vacancyStr, DEFAULTS.vacancyRatePct),
    maintenancePctOfRent: safePct(maintenanceStr, DEFAULTS.maintenancePctOfRent),
    annualAppreciationPct: safePct(appreciationStr, DEFAULTS.annualAppreciationPct),
    annualRentGrowthPct: safePct(rentGrowthStr, DEFAULTS.annualRentGrowthPct),
    incomeTaxPct: safePct(taxStr, DEFAULTS.incomeTaxPct),
    horizonYears: Math.max(
      1,
      Math.min(30, Math.round(safeFloat(horizonStr, DEFAULTS.horizonYears)))
    ),
  };

  // Guard: downPayment must not exceed purchasePrice
  const validInput =
    calcInput.downPayment <= calcInput.purchasePrice ? calcInput : {
      ...calcInput,
      downPayment: calcInput.purchasePrice,
    };

  const deferredInput = useDeferredValue(validInput);
  const result = calculateRealEstate(deferredInput);

  const cashflowData = downsampleSeries(result.timeSeries, 100);
  const equityData = downsampleEquity(result.timeSeries, 100);

  const handleSave = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("TODO: save real-estate scenario", deferredInput);
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
            {t("calc.realEstate.title")}
          </Text>
          <Text style={styles.screenSubtitle}>{t("calc.realEstate.subtitle")}</Text>

          {/* Hero metrics */}
          <Card style={styles.heroCard}>
            <Text style={styles.heroMainLabel}>
              {t("calc.realEstate.results.averageMonthlyCashflow")}
            </Text>
            <Text
              style={[
                styles.heroMainValue,
                result.averageMonthlyCashflow >= 0
                  ? styles.positiveValue
                  : styles.negativeValue,
              ]}
              accessibilityLabel={`Průměrný měsíční cashflow: ${formatCurrency(result.averageMonthlyCashflow, "CZK", "cs")}`}
            >
              {result.averageMonthlyCashflow >= 0 ? "+" : ""}
              {formatCurrency(result.averageMonthlyCashflow, "CZK", "cs")}
            </Text>

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
                label={t("calc.realEstate.results.irr")}
                value={
                  result.irr !== null
                    ? formatPercent(result.irr, "cs")
                    : t("calc.realEstate.results.irrUncomputable")
                }
              />
              <MetricCell
                label={t("calc.realEstate.results.finalEquity")}
                value={formatCurrency(result.finalEquity, "CZK", "cs")}
              />
              <MetricCell
                label={t("calc.realEstate.results.breakEvenMonth")}
                value={
                  result.breakEvenMonth !== null
                    ? `${result.breakEvenMonth}. měsíc`
                    : t("calc.realEstate.results.breakEvenNever")
                }
              />
              <MetricCell
                label={t("calc.realEstate.results.monthlyPayment")}
                value={formatCurrency(result.monthlyPayment, "CZK", "cs")}
              />
            </View>
          </Card>

          {/* Cashflow chart */}
          <Text style={styles.chartTitle}>{t("calc.realEstate.chart.cashflow")}</Text>
          <View style={styles.chartContainer} accessibilityRole="image">
            <CashflowChart data={cashflowData} />
          </View>

          {/* Equity chart */}
          <Text style={styles.chartTitle}>{t("calc.realEstate.chart.equity")}</Text>
          <View style={styles.chartContainer} accessibilityRole="image">
            <EquityChart data={equityData} />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c.chart[1] }]} />
              <Text style={styles.legendLabel}>{t("calc.realEstate.chart.propertyValue")}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c.chart[3] }]} />
              <Text style={styles.legendLabel}>{t("calc.realEstate.chart.equity")}</Text>
            </View>
          </View>

          {/* Input accordion sections */}
          <Text style={styles.sectionLabel}>VSTUPY</Text>

          <Accordion title={t("calc.realEstate.sections.purchase")} defaultOpen={true}>
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

          <Accordion title={t("calc.realEstate.sections.financing")} defaultOpen={false}>
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

          <Accordion title={t("calc.realEstate.sections.income")} defaultOpen={false}>
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

          <Accordion title={t("calc.realEstate.sections.costs")} defaultOpen={false}>
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

          <Accordion title={t("calc.realEstate.sections.horizon")} defaultOpen={false}>
            <Input
              label={t("calc.compound.fields.horizonYears")}
              value={horizonStr}
              onChangeText={setHorizonStr}
              keyboardType="number-pad"
              unit="let"
            />
          </Accordion>

          <Text style={styles.disclaimer}>{t("calc.realEstate.disclaimer")}</Text>

          <View style={styles.saveButtonSpacer} />
        </ScrollView>

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

// ── Subcomponents ─────────────────────────────────────────────────────────────

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCell} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

// Victory Native XL requires data to satisfy Record<string, unknown>
interface CashflowPoint extends Record<string, unknown> {
  month: number;
  netCashflow: number;
}

function CashflowChart({ data }: { data: CashflowPoint[] }) {
  if (data.length === 0) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>Vyplňte vstupy pro zobrazení grafu</Text>
      </View>
    );
  }

  return (
    <CartesianChart data={data} xKey="month" yKeys={["netCashflow"]} domainPadding={{ top: 20 }}>
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

// Victory Native XL requires data to satisfy Record<string, unknown>
interface EquityPoint extends Record<string, unknown> {
  month: number;
  propertyValue: number;
  equity: number;
}

function EquityChart({ data }: { data: EquityPoint[] }) {
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
          <Line
            points={points.equity}
            color={c.chart[3]}
            strokeWidth={2}
          />
        </>
      )}
    </CartesianChart>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function downsampleSeries(
  series: Array<{ month: number; netCashflow: number }>,
  maxPoints: number
): CashflowPoint[] {
  if (series.length === 0) return [];
  const step = Math.max(1, Math.floor(series.length / maxPoints));
  const result: CashflowPoint[] = [];
  for (let i = 0; i < series.length; i += step) {
    const pt = series[i];
    // `as CashflowPoint` is safe — the object satisfies the interface
    if (pt) result.push({ month: pt.month, netCashflow: pt.netCashflow } as CashflowPoint);
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
      // `as EquityPoint` is safe — the object satisfies the interface
      result.push({
        month: pt.month,
        propertyValue: pt.propertyValue,
        equity: pt.equity,
      } as EquityPoint);
  }
  return result;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 0, gap: 12 },
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

  // Hero
  heroCard: { gap: 10 },
  heroMainLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: c.mutedForeground,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  heroMainValue: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  positiveValue: { color: c.success },
  negativeValue: { color: c.destructive },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  metricCell: {
    minWidth: "46%",
    flex: 1,
    backgroundColor: c.muted,
    borderRadius: 6,
    padding: 10,
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: c.mutedForeground,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: c.foreground,
  },

  // Charts
  chartTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: c.foreground,
    marginBottom: -4,
  },
  chartContainer: {
    height: 180,
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

  // Form
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: c.mutedForeground,
    letterSpacing: 0.8,
    marginTop: 8,
  },

  disclaimer: {
    fontSize: 11,
    color: c.mutedForeground,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 8,
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
