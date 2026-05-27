import { View, Text, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useColors } from "../hooks/useColors";

// Static methodology + privacy screen.
// Content mirrors the web's footer `footer.methodology` plus the
// `privacy.statement` line required for the App Store privacy nutrition label.
// The privacy statement is added as an inline string (no new i18n key needed per DESIGN.md §9.5).

export default function MethodologyScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = useColors(theme);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <Text
        style={{
          color: colors.foreground,
          fontSize: 20,
          fontWeight: "700",
          marginBottom: 16,
        }}
      >
        {t("header.methodology")}
      </Text>

      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 14,
            lineHeight: 22,
          }}
        >
          {t("footer.methodology")}
        </Text>
      </View>

      {/* Privacy statement — required for App Store privacy nutrition label */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.brand + "4D",
          padding: 16,
        }}
      >
        <Text
          style={{
            color: colors.brand,
            fontSize: 13,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {t("header.calculator") === "Kalkulačka" ? "Soukromí" : "Privacy"}
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 14,
            lineHeight: 22,
          }}
        >
          {t("header.calculator") === "Kalkulačka"
            ? "Investio neshromažďuje, neukládá ani nepřenáší žádné osobní údaje. Všechny výpočty probíhají na vašem zařízení."
            : "Investio doesn't collect, store, or transmit any personal data. All calculations run on your device."}
        </Text>
      </View>
    </ScrollView>
  );
}
