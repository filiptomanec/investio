/**
 * Parity check screen — T-014 proof-of-concept.
 *
 * Demonstrates that Metro can resolve all shared workspace packages:
 *   @investio/shared  — calculateCompound + formatCurrency
 *   @investio/i18n    — useTranslation (react-i18next)
 *
 * This is a DEV/DEBUG screen, not part of the app navigation shell.
 * Access it at route /parity-check.
 */

import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { calculateCompound } from "@investio/shared";
import { formatCurrency } from "@investio/shared";
import { tokens } from "@investio/design-tokens";

// Fixed inputs matching the ticket spec
const PARITY_INPUT = {
  type: "compound" as const,
  initialAmount: 10000,
  monthlyContribution: 100,
  annualReturnPct: 0.07,
  horizonYears: 10,
  contributionTiming: "end" as const,
};

export default function ParityCheckScreen() {
  const { t } = useTranslation();

  const result = calculateCompound(PARITY_INPUT);

  const fvFormatted = formatCurrency(result.finalValue, "CZK", "cs");
  const contribFormatted = formatCurrency(result.totalContributions, "CZK", "cs");
  const gainsFormatted = formatCurrency(result.totalGains, "CZK", "cs");

  const title = `${t("common.appName")} — FV: ${fvFormatted}`;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: tokens.colors.light.background }]}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        accessibilityLabel="Parity check screen"
      >
        {/* Title — combines appName + formatted FV exactly as the ticket specifies */}
        <Text
          style={[styles.title, { color: tokens.colors.light.foreground }]}
          accessibilityRole="header"
        >
          {title}
        </Text>

        <Text
          style={[styles.sectionLabel, { color: tokens.colors.light.mutedForeground }]}
        >
          calculateCompound inputs
        </Text>

        <View
          style={[styles.card, { backgroundColor: tokens.colors.light.card, borderColor: tokens.colors.light.border }]}
        >
          <Row label="initialAmount" value="10 000 Kč" />
          <Row label="monthlyContribution" value="100 Kč" />
          <Row label="annualReturnPct" value="7.0 %" />
          <Row label="horizonYears" value="10 let" />
          <Row label="contributionTiming" value="end" />
        </View>

        <Text
          style={[styles.sectionLabel, { color: tokens.colors.light.mutedForeground }]}
        >
          calculateCompound result
        </Text>

        <View
          style={[styles.card, { backgroundColor: tokens.colors.light.card, borderColor: tokens.colors.light.border }]}
        >
          <Row label="finalValue" value={fvFormatted} highlight />
          <Row label="totalContributions" value={contribFormatted} />
          <Row label="totalGains" value={gainsFormatted} />
          <Row label="timeSeries.length" value={`${result.timeSeries.length} months`} />
        </View>

        <Text
          style={[styles.sectionLabel, { color: tokens.colors.light.mutedForeground }]}
        >
          i18n check
        </Text>

        <View
          style={[styles.card, { backgroundColor: tokens.colors.light.card, borderColor: tokens.colors.light.border }]}
        >
          <Row label='t("common.appName")' value={t("common.appName")} />
          <Row label='t("auth.signIn")' value={t("auth.signIn")} />
          <Row label='t("calc.compound.title")' value={t("calc.compound.title")} />
        </View>

        <Text
          style={[styles.hint, { color: tokens.colors.light.mutedForeground }]}
        >
          T-014 parity proof. Remove this screen before public release.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Internal helper ─────────────────────────────────────────────────────────

interface RowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function Row({ label, value, highlight = false }: RowProps) {
  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.rowLabel, { color: tokens.colors.light.mutedForeground }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          {
            color: highlight
              ? tokens.colors.light.primary
              : tokens.colors.light.foreground,
          },
          // fontWeight must be a RN-accepted literal, not a widened string
          highlight ? styles.rowValueHighlight : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 8,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  rowLabel: {
    fontSize: 13,
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    flexShrink: 0,
    maxWidth: "55%",
    textAlign: "right",
  },
  rowValueHighlight: {
    fontWeight: "600",
  },
  hint: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 16,
  },
});
