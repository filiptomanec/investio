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
import { Info } from "lucide-react-native";
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
  void formatNumber; // imported but may be used in future

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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Logo colors={colors} />
            <View style={styles.headerActions}>
              <LanguageToggle colors={numFieldColors} />
              <ThemeToggle theme={theme} onToggle={toggle} colors={colors} />
            </View>
          </View>

          {/* Input card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

              {/* Inflation section */}
              <View style={[styles.sectionDivider, { borderTopColor: colors.border }]}>
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

              {/* Withdrawal rate */}
              <View style={[styles.sectionDivider, { borderTopColor: colors.border }]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    {t("form.withdrawalRate").toUpperCase()}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("form.withdrawalRateInfo")}
                    accessibilityHint={t("form.withdrawalRateTooltip")}
                    style={{ marginLeft: 6 }}
                    onPress={() => {
                      /* tooltip shown via accessibilityHint on VoiceOver */
                    }}
                  >
                    <Info size={14} color={colors.mutedForeground} />
                  </Pressable>
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

          {/* Results — nominal */}
          <View style={styles.resultRow}>
            <View
              style={[
                styles.card,
                styles.resultCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
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

            {inflationEnabled && (
              <View
                style={[
                  styles.card,
                  styles.resultCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.brand + "50",
                  },
                ]}
              >
                <View style={styles.badgeRow}>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    {t("results.realLabel").toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.brand + "20", borderColor: colors.brand + "50" },
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
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {t("results.passiveIncomeTitle")}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
              {t("results.passiveIncomeDescription", {
                pct: fmtPct(withdrawalRate),
                years,
              })}
            </Text>

            <View style={[inflationEnabled ? styles.twoCol : styles.singleCol, { marginTop: 12 }]}>
              <View
                style={[
                  styles.withdrawalBox,
                  { flex: 1, backgroundColor: colors.surface, borderColor: colors.border },
                ]}
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

              {inflationEnabled && (
                <View
                  style={[
                    styles.withdrawalBox,
                    { flex: 1, backgroundColor: colors.surface, borderColor: colors.brand + "50" },
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
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {t("chart.title")}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
              {inflationEnabled
                ? t("chart.descriptionWithInflation")
                : t("chart.descriptionWithoutInflation")}
            </Text>
            <View style={{ marginTop: 16 }}>
              <GrowthChart
                series={result.series}
                inflationEnabled={inflationEnabled}
                locale={locale}
                colors={colors}
              />
            </View>
          </View>

          {/* Milestones card */}
          <View>
            <Text style={[styles.sectionHeader, { color: colors.foreground }]}>
              {t("breakdown.year")}
            </Text>
            <MilestonesList
              milestones={milestones}
              inflationEnabled={inflationEnabled}
              locale={locale}
              colors={colors}
            />
          </View>

          {/* Footer / Methodology link */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {t("footer.copyright", { year: new Date().getFullYear() })}
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
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 20,
  },
  fieldList: {
    gap: 16,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  singleCol: {
    flexDirection: "column",
  },
  sectionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    gap: 0,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
  },
  resultRow: {
    gap: 12,
  },
  resultCard: {
    // flexible width — fills resultRow which has gap
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "JetBrainsMono_400Regular",
    letterSpacing: -0.5,
  },
  statDesc: {
    fontSize: 11,
    marginTop: 6,
  },
  profitRow: {
    marginTop: 8,
  },
  profitText: {
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  withdrawalBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  withdrawalValue: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "JetBrainsMono_400Regular",
  },
  withdrawalAnnual: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
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
