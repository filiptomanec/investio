import { View, Text } from "react-native";
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
    brand: string;
    card: string;
    border: string;
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
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {milestones.map((m, idx) => (
        <View
          key={m.year}
          style={{
            padding: 16,
            borderBottomWidth: idx < milestones.length - 1 ? 1 : 0,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
              {t("breakdown.yearOrdinal", { n: m.year })}
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: "JetBrainsMono_400Regular" }}>
              {fmt(m.nominal)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <View style={{ flex: 1, minWidth: "45%" }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                {t("breakdown.contributions")}
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 12, fontFamily: "JetBrainsMono_400Regular" }}>
                {fmt(m.contributions)}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: "45%" }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
                {t("breakdown.interest")}
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 12, fontFamily: "JetBrainsMono_400Regular" }}>
                {fmt(m.interest)}
              </Text>
            </View>
            {inflationEnabled && (
              <View style={{ flex: 1, minWidth: "45%" }}>
                <Text style={{ color: colors.brand, fontSize: 11 }}>
                  {t("breakdown.real")}
                </Text>
                <Text style={{ color: colors.brand, fontSize: 12, fontFamily: "JetBrainsMono_400Regular" }}>
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
