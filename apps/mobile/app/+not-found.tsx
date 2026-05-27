import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useColors } from "../hooks/useColors";

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = useColors(theme);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Text style={{ color: colors.foreground, fontSize: 72, fontWeight: "700", marginBottom: 16 }}>
        404
      </Text>
      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "600", marginBottom: 8, textAlign: "center" }}>
        {t("errors.notFoundTitle")}
      </Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center", marginBottom: 32 }}>
        {t("errors.notFoundDescription")}
      </Text>
      <Pressable
        onPress={() => router.replace("/")}
        accessibilityRole="button"
        style={{
          backgroundColor: colors.brand,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 10,
          minWidth: 44,
          minHeight: 44,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.background, fontWeight: "600", fontSize: 14 }}>
          {t("errors.notFoundBack")}
        </Text>
      </Pressable>
    </View>
  );
}
