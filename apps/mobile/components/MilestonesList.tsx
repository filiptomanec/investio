import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { YearPoint } from "@investio/shared";
import { formatCurrency } from "@investio/shared";
import type { SupportedLocale } from "@investio/shared";

interface MilestonesListProps {
  milestones: YearPoint[];
  inflationEnabled: boolean;
  locale: SupportedLocale;
  colors: {
    foreground: string;
    mutedForeground: string;
    card: string;
    border: string;
    brand: string;
    surface: string;
  };
}

export function MilestonesList({
  milestones,
  inflationEnabled,
  locale,
  colors,
}: MilestonesListProps) {
  const { t } = useTranslation();
  const fmt = (n: number) => formatCurrency(n, locale);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {milestones.map((m, idx) => (
        <View
          key={m.year}
          style={[
            styles.row,
            { borderTopColor: colors.border },
            idx === 0 && { borderTopWidth: 0 },
          ]}
        >
          <View style={styles.yearCol}>
            <Text style={[styles.yearLabel, { color: colors.foreground }]}>
              {t("breakdown.yearOrdinal", { n: m.year })}
            </Text>
          </View>
          <View style={styles.valCols}>
            <View style={styles.valueRow}>
              <Text style={[styles.colLabel, { color: colors.mutedForeground }]}>
                {t("breakdown.contributions")}
              </Text>
              <Text style={[styles.value, { color: colors.foreground }]}>
                {fmt(m.contributions)}
              </Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={[styles.colLabel, { color: colors.mutedForeground }]}>
                {t("breakdown.interest")}
              </Text>
              <Text style={[styles.value, { color: colors.foreground }]}>
                {fmt(m.interest)}
              </Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={[styles.colLabel, { color: colors.mutedForeground }]}>
                {t("breakdown.nominal")}
              </Text>
              <Text style={[styles.value, { color: colors.foreground }]}>
                {fmt(m.nominal)}
              </Text>
            </View>
            {inflationEnabled && (
              <View style={styles.valueRow}>
                <Text style={[styles.colLabel, { color: colors.brand }]}>
                  {t("breakdown.real")}
                </Text>
                <Text style={[styles.value, { color: colors.brand }]}>
                  {fmt(m.real)}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  yearCol: {
    width: 60,
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  yearLabel: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  valCols: {
    flex: 1,
    gap: 4,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  colLabel: {
    fontSize: 11,
    fontWeight: "400",
  },
  value: {
    fontSize: 12,
    fontFamily: "JetBrainsMono_400Regular",
  },
});
