import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Info } from "lucide-react-native";
import {
  calculateInvestment,
  formatCurrency,
  formatNumber,
  type SupportedLocale,
} from "@investio/shared";
import { NumField } from "../components/NumField";
import { GrowthChart } from "../components/GrowthChart";
import { MilestonesList } from "../components/MilestonesList";
import { InflationToggle } from "../components/InflationToggle";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { Logo } from "../components/Logo";
import { useTheme } from "../hooks/useTheme";
import { useColors } from "../hooks/useColors";

export default function CalculatorScreen() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language?.startsWith("en") ? "en" : "cs") as SupportedLocale;
  const { theme, toggle } = useTheme();
  const colors = useColors(theme);
  const insets = useSafeAreaInsets();

  // Input state — same defaults as web
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
    .filter((p): p is NonNullable<typeof p> => !!p);

  const fmt = (n: number) => formatCurrency(n, locale);
  const fmtNum = (n: number) => formatNumber(n, locale);
  const fmtPct = (n: number) =>
    new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Number.isFinite(n) ? n : 0);

  const numFieldColors = {
    foreground: colors.foreground,
    mutedForeground: colors.mutedForeground,
    card: colors.card,
    border: colors.border,
    brand: colors.brand,
    surface: colors.surface,
  };

  const suffix = locale === "cs" ? "Kč" : "$";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Logo />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LanguageToggle />
            <ThemeToggle theme={theme} onToggle={toggle} iconColor={colors.foreground} />
          </View>
        </View>

        {/* Inputs card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme === "dark" ? 0.3 : 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 2 }}>
            {t("form.title")}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginBottom: 20 }}>
            {t("form.subtitle")}
          </Text>

          <View style={{ gap: 16 }}>
            <NumField
              label={t("form.initialDeposit")}
              value={initial}
              onChange={setInitial}
              locale={locale}
              suffix={suffix}
              step={1000}
              colors={numFieldColors}
            />
            <NumField
              label={t("form.monthlyContribution")}
              value={monthly}
              onChange={setMonthly}
              locale={locale}
              suffix={suffix}
              step={500}
              colors={numFieldColors}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
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
            <View
              style={{
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                gap: 14,
              }}
            >
              <InflationToggle
                label={t("form.enableInflation")}
                value={inflationEnabled}
                onChange={setInflationEnabled}
                colors={{
                  mutedForeground: colors.mutedForeground,
                  brand: colors.brand,
                  background: colors.background,
                  muted: colors.surface,
                }}
              />
              {inflationEnabled && (
                <NumField
                  label={t("form.expectedInflation")}
                  value={inflation}
                  onChange={setInflation}
                  locale={locale}
                  suffix={t("units.pct")}
                  step={0.1}
                  colors={numFieldColors}
                />
              )}
            </View>

            {/* Withdrawal rate */}
            <View
              style={{
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: 11,
                    fontWeight: "500",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  {t("form.withdrawalRate")}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("form.withdrawalRateInfo")}
                  style={{ minWidth: 24, minHeight: 24, justifyContent: "center", alignItems: "center" }}
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
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 6 }}>
                {t("form.withdrawalRateTooltip")}
              </Text>
            </View>
          </View>
        </View>

        {/* Result cards */}
        <View style={{ flexDirection: inflationEnabled ? "row" : "column", gap: 12, marginBottom: 16 }}>
          {/* Nominal value card */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
            }}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
              {t("results.nominalLabel")}
            </Text>
            <Text
              style={{ color: colors.foreground, fontSize: 26, fontWeight: "700", fontFamily: "JetBrainsMono_400Regular" }}
              maxFontSizeMultiplier={1.4}
            >
              {fmt(result.finalNominal)}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
              <Text style={{ color: colors.brand, fontSize: 12 }}>▲</Text>
              <Text style={{ color: colors.brand, fontSize: 12 }}>
                {fmt(profit)} {t("results.profitSuffix")}
              </Text>
            </View>
          </View>

          {/* Real value card (inflation-adjusted) */}
          {inflationEnabled && (
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.brand + "4D",
                padding: 20,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  backgroundColor: colors.brand + "1A",
                  borderWidth: 1,
                  borderColor: colors.brand + "4D",
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ color: colors.brand, fontSize: 10 }}>
                  {t("results.inflationAdjustedBadge")}
                </Text>
              </View>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                {t("results.realLabel")}
              </Text>
              <Text
                style={{ color: colors.foreground, fontSize: 26, fontWeight: "700", fontFamily: "JetBrainsMono_400Regular" }}
                maxFontSizeMultiplier={1.4}
              >
                {fmt(result.finalReal)}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 8 }}>
                {t("results.realDescription", { pct: fmtPct(inflation) })}
              </Text>
            </View>
          )}
        </View>

        {/* Passive income */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                {t("results.passiveIncomeTitle")}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                {t("results.passiveIncomeDescription", {
                  pct: fmtPct(withdrawalRate),
                  years,
                })}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: colors.brand, fontSize: 11 }}>
                {t("results.rule4Pct")}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, maxWidth: 160, textAlign: "right", marginTop: 2 }}>
                {t("results.rule4PctTooltip")}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: inflationEnabled ? "row" : "column", gap: 12 }}>
            {/* Monthly nominal */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                {t("results.monthlyNominal")}
              </Text>
              <Text
                style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", fontFamily: "JetBrainsMono_400Regular" }}
                maxFontSizeMultiplier={1.4}
              >
                {fmt(monthlyWithdrawalNominal)}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>
                {fmt(annualWithdrawalNominal)} {t("results.annuallySuffix")}
              </Text>
            </View>

            {/* Monthly real */}
            {inflationEnabled && (
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.brand + "4D",
                  padding: 14,
                }}
              >
                <Text style={{ color: colors.brand, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
                  {t("results.monthlyReal")}
                </Text>
                <Text
                  style={{ color: colors.foreground, fontSize: 20, fontWeight: "700", fontFamily: "JetBrainsMono_400Regular" }}
                  maxFontSizeMultiplier={1.4}
                >
                  {fmt(monthlyWithdrawalReal)}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>
                  {fmt(annualWithdrawalReal)} {t("results.annuallySuffix")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Chart */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <View>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600" }}>
                {t("chart.title")}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                {inflationEnabled ? t("chart.descriptionWithInflation") : t("chart.descriptionWithoutInflation")}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand }} />
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{t("chart.legendNominal")}</Text>
              </View>
              {inflationEnabled && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.mutedForeground }} />
                  <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{t("chart.legendReal")}</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.mutedForeground + "4D" }} />
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{t("chart.legendContributions")}</Text>
              </View>
            </View>
          </View>

          <GrowthChart
            series={result.series}
            inflationEnabled={inflationEnabled}
            locale={locale}
            colors={{
              brand: colors.brand,
              mutedForeground: colors.mutedForeground,
              border: colors.border,
              card: colors.card,
              foreground: colors.foreground,
              surface: colors.surface,
            }}
          />
        </View>

        {/* Milestone breakdown */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
            {t("breakdown.year")}
          </Text>
          <MilestonesList
            milestones={milestones}
            inflationEnabled={inflationEnabled}
            locale={locale}
            colors={{
              foreground: colors.foreground,
              mutedForeground: colors.mutedForeground,
              brand: colors.brand,
              card: colors.card,
              border: colors.border,
            }}
          />
        </View>

        {/* Footer / methodology link */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 16,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 18, marginBottom: 8 }}>
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </Text>
          <Pressable
            onPress={() => router.push("/methodology")}
            accessibilityRole="link"
            accessibilityLabel={t("header.methodology")}
          >
            <Text style={{ color: colors.brand, fontSize: 12, textDecorationLine: "underline", marginBottom: 8 }}>
              {t("header.methodology")}
            </Text>
          </Pressable>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 18 }}>
            {t("footer.methodology")}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
