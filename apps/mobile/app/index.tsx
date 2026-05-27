/**
 * CalculatorScreen — mobile port of apps/web/src/routes/index.tsx
 *
 * Layout mirrors the web 1:1 within mobile idioms.
 */
import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  calculateInvestment,
  formatCurrency,
  formatNumber,
  type SupportedLocale,
} from "@investio/shared";
import { useTheme } from "../hooks/useTheme";
import { useColors } from "../hooks/useColors";
import { NumField } from "../components/NumField";
import { InflationToggle } from "../components/InflationToggle";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { Logo } from "../components/Logo";
import { GrowthChart } from "../components/GrowthChart";
import { MilestonesList } from "../components/MilestonesList";
import { InfoTooltip } from "../components/InfoTooltip";

export default function CalculatorScreen() {
  const { theme, toggle } = useTheme();
  const colors = useColors(theme);
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const locale = (i18n.language?.startsWith("en") ? "en" : "cs") as SupportedLocale;
  const fmt = (n: number) => formatCurrency(n, locale);
  const fmtPct = (n: number) =>
    new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Number.isFinite(n) ? n : 0);
  void formatNumber;

  const [initial, setInitial] = useState(100000);
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);
  const [inflation, setInflation] = useState(3.2);
  const [inflationEnabled, setInflationEnabled] = useState(true);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const effectiveInflation = inflationEnabled ? inflation : 0;

  const result = useMemo(
    () =>
      calculateInvestment({
        initial,
        monthly,
        annualRatePct: rate,
        years,
        inflationPct: effectiveInflation,
      }),
    [initial, monthly, rate, years, effectiveInflation],
  );

  const profit = result.finalNominal - result.totalContributions;

  const annualWithdrawalNominal = result.finalNominal * (withdrawalRate / 100);
  const monthlyWithdrawalNominal = annualWithdrawalNominal / 12;
  const annualWithdrawalReal = result.finalReal * (withdrawalRate / 100);
  const monthlyWithdrawalReal = annualWithdrawalReal / 12;

  const milestoneYears = [1, 5, 10, 15, 20, 25, 30, 40].filter((y) => y <= years);
  const milestones = milestoneYears
    .map((y) => result.series.find((s) => s.year === y))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const currencySuffix = locale === "cs" ? "Kč" : "$";
  const numFieldColors = {
    foreground: colors.foreground,
    mutedForeground: colors.mutedForeground,
    card: colors.card,
    border: colors.border,
    surface: colors.surface,
    brand: colors.brand,
  };

  // Border colors as rgba strings
  const borderColor = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  // brand at ~31% opacity for the inflation-related borders
  const brandBorder = colors.brand + "50";

  const tooltipColors = {
    mutedForeground: colors.mutedForeground,
    card: colors.card,
    border: colors.border,
    foreground: colors.foreground,
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header — web: flex justify-between items-center mb-10 */}
          <View style={styles.header}>
            <Logo colors={colors} />
            <View style={styles.headerActions}>
              <LanguageToggle colors={numFieldColors} />
              <ThemeToggle theme={theme} onToggle={toggle} colors={colors} />
            </View>
          </View>

          {/* Input card — web: bg-card p-6 rounded-2xl border shadow-xl */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: theme === "dark" ? 0.35 : 0.12,
                shadowRadius: 24,
                elevation: 12,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {t("form.title")}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
              {t("form.subtitle")}
            </Text>

            <View style={styles.fieldList}>
              <NumField
                label={t("form.initialDeposit")}
                value={initial}
                onChange={setInitial}
                locale={locale}
                suffix={currencySuffix}
                step={1000}
                colors={numFieldColors}
              />
              <NumField
                label={t("form.monthlyContribution")}
                value={monthly}
                onChange={setMonthly}
                locale={locale}
                suffix={currencySuffix}
                step={500}
                colors={numFieldColors}
              />

              {/* web: grid grid-cols-2 gap-4 */}
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <NumField
                    label={t("form.annualRate")}
                    value={rate}
                    onChange={(v) => setRate(Math.max(0, Math.min(100, v)))}
                    locale={locale}
                    suffix={t("units.pct")}
                    step={0.1}
                    colors={numFieldColors}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <NumField
                    label={t("form.duration")}
                    value={years}
                    onChange={(v) => setYears(Math.max(1, Math.min(60, Math.round(v))))}
                    locale={locale}
                    suffix={t("units.years")}
                    step={1}
                    colors={numFieldColors}
                  />
                </View>
              </View>

              {/* Inflation section — pt-4 border-t */}
              <View style={[styles.sectionDivider, { borderTopColor: borderColor }]}>
                <InflationToggle
                  enabled={inflationEnabled}
                  onToggle={() => setInflationEnabled((v) => !v)}
                  colors={{
                    mutedForeground: colors.mutedForeground,
                    brand: colors.brand,
                    muted: colors.surface,
                    background: colors.background,
                  }}
                />
                {/* Collapses when disabled — same as web conditional render */}
                {inflationEnabled && (
                  <View style={{ marginTop: 16 }}>
                    <NumField
                      label={t("form.expectedInflation")}
                      value={inflation}
                      onChange={setInflation}
                      locale={locale}
                      suffix={t("units.pct")}
                      step={0.1}
                      colors={numFieldColors}
                    />
                  </View>
                )}
              </View>

              {/* Withdrawal rate — pt-4 border-t, label + Info icon */}
              <View style={[styles.sectionDivider, { borderTopColor: borderColor }]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    {t("form.withdrawalRate").toUpperCase()}
                  </Text>
                  <View style={{ marginLeft: 6 }}>
                    <InfoTooltip
                      text={t("form.withdrawalRateTooltip")}
                      size={14}
                      colors={tooltipColors}
                      accessibilityLabel={t("form.withdrawalRateInfo")}
                    />
                  </View>
                </View>
                <NumField
                  label=""
                  value={withdrawalRate}
                  onChange={(v) => setWithdrawalRate(Math.max(0, Math.min(20, v)))}
                  locale={locale}
                  suffix={t("units.pctPerYear")}
                  step={0.1}
                  colors={numFieldColors}
                />
              </View>
            </View>
          </View>

          {/* Result cards — nominal + optional real, stacked */}
          <View style={styles.resultRow}>
            {/* Nominal */}
            <View style={[styles.card, styles.resultCard, { backgroundColor: colors.card, borderColor }]}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {t("results.nominalLabel").toUpperCase()}
              </Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {fmt(result.finalNominal)}
              </Text>
              <View style={styles.profitRow}>
                <Text style={[styles.profitText, { color: colors.brand }]}>
                  ▲ {fmt(profit)} {t("results.profitSuffix")}
                </Text>
              </View>
            </View>

            {/* Real — conditional, border-brand/30, badge top-right */}
            {inflationEnabled && (
              <View
                style={[
                  styles.card,
                  styles.resultCard,
                  { backgroundColor: colors.card, borderColor: brandBorder },
                ]}
              >
                <View style={styles.badgeRow}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    {t("results.realLabel").toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.brand + "1a", borderColor: brandBorder },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.brand }]}>
                      {t("results.inflationAdjustedBadge")}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {fmt(result.finalReal)}
                </Text>
                <Text style={[styles.statDesc, { color: colors.mutedForeground }]}>
                  {t("results.realDescription", { pct: fmtPct(inflation) })}
                </Text>
              </View>
            )}
          </View>

          {/* Passive income card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor }]}>
            <View style={styles.passiveHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {t("results.passiveIncomeTitle")}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.mutedForeground, marginBottom: 0 }]}>
                  {t("results.passiveIncomeDescription", { pct: fmtPct(withdrawalRate), years })}
                </Text>
              </View>
              <View style={styles.infoButton}>
                <InfoTooltip
                  text={t("results.rule4PctTooltip")}
                  size={14}
                  colors={tooltipColors}
                  accessibilityLabel={t("results.rule4Pct")}
                />
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  {t("results.rule4Pct")}
                </Text>
              </View>
            </View>

            <View style={[styles.singleCol, { marginTop: 16 }]}>
              {/* Nominal withdrawal sub-card — bg-surface rounded-xl */}
              <View
                style={[styles.withdrawalBox, { flex: 1, backgroundColor: colors.surface, borderColor }]}
              >
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  {t("results.monthlyNominal").toUpperCase()}
                </Text>
                <Text style={[styles.withdrawalValue, { color: colors.foreground }]}>
                  {fmt(monthlyWithdrawalNominal)}
                </Text>
                <Text style={[styles.withdrawalAnnual, { color: colors.mutedForeground }]}>
                  {fmt(annualWithdrawalNominal)} {t("results.annuallySuffix")}
                </Text>
              </View>

              {/* Real withdrawal sub-card — border-brand/30, label in brand color */}
              {inflationEnabled && (
                <View
                  style={[
                    styles.withdrawalBox,
                    { flex: 1, backgroundColor: colors.surface, borderColor: brandBorder },
                  ]}
                >
                  <Text style={[styles.statLabel, { color: colors.brand }]}>
                    {t("results.monthlyReal").toUpperCase()}
                  </Text>
                  <Text style={[styles.withdrawalValue, { color: colors.foreground }]}>
                    {fmt(monthlyWithdrawalReal)}
                  </Text>
                  <Text style={[styles.withdrawalAnnual, { color: colors.mutedForeground }]}>
                    {fmt(annualWithdrawalReal)} {t("results.annuallySuffix")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Chart card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor }]}>
            <View style={styles.chartHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {t("chart.title")}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.mutedForeground, marginBottom: 0 }]}>
                  {inflationEnabled
                    ? t("chart.descriptionWithInflation")
                    : t("chart.descriptionWithoutInflation")}
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 16 }}>
              <GrowthChart
                series={result.series}
                inflationEnabled={inflationEnabled}
                locale={locale}
                colors={colors}
              />
            </View>
          </View>

          {/* Milestone breakdown — stacked cards (web mobile breakpoint layout) */}
          <MilestonesList
            milestones={milestones}
            inflationEnabled={inflationEnabled}
            locale={locale}
            colors={colors}
          />

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {t("footer.copyright", { year: new Date().getFullYear() })} — {t("footer.methodology")}
            </Text>
            <Pressable
              onPress={() => router.push("/methodology")}
              accessibilityRole="link"
              accessibilityLabel={t("header.methodology")}
            >
              <Text style={[styles.footerLink, { color: colors.brand }]}>
                {t("header.methodology")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    // web: p-4 on mobile → 16px padding. gap-8 = 32px between grid rows → use 24px on mobile
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // web: rounded-2xl = base radius 0.875rem + 8px → ~22px. p-6 = 24px. border.
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
  },
  // web: text-lg font-semibold mb-1
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  // web: text-xs text-muted-foreground mb-6
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 24,
  },
  // web: space-y-5 = 20px vertical gap
  fieldList: {
    gap: 20,
  },
  // web: grid grid-cols-2 gap-4 = 16px gap
  twoCol: {
    flexDirection: "row",
    gap: 16,
  },
  singleCol: {
    flexDirection: "column",
  },
  // web: pt-4 border-t border-border
  sectionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  // web: flex items-center gap-1.5 mb-2
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  // web: text-[11px] font-medium uppercase tracking-wider
  fieldLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    fontFamily: "Inter_500Medium",
  },
  // Results section
  resultRow: {
    gap: 16,
  },
  resultCard: {},
  // web: text-[11px] font-medium uppercase tracking-wider mb-1
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.9,
    marginBottom: 6,
    fontFamily: "Inter_500Medium",
  },
  // web: text-3xl font-bold font-mono
  statValue: {
    fontSize: 30,
    fontWeight: "700",
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: -0.5,
  },
  statDesc: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  profitRow: {
    marginTop: 8,
  },
  // web: text-xs text-brand — ▲ profit
  profitText: {
    fontSize: 12,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  // web: text-[10px] px-2 py-0.5 rounded border
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  // Passive income
  passiveHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 2,
  },
  infoLabel: {
    fontSize: 11,
  },
  // web: bg-surface rounded-xl p-4 border
  withdrawalBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  // web: text-2xl font-bold font-mono
  withdrawalValue: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: -0.3,
  },
  // web: text-xs text-muted-foreground mt-1
  withdrawalAnnual: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  // Footer
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 11,
    lineHeight: 18,
  },
  footerLink: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
