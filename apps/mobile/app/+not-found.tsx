import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import { useColors } from "../hooks/useColors";

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const colors = useColors(theme);
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t("errors.notFoundTitle")}
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          {t("errors.notFoundDescription")}
        </Text>
        <Pressable
          onPress={() => router.replace("/")}
          accessibilityRole="button"
          style={[styles.btn, { backgroundColor: colors.brand }]}
        >
          <Text style={[styles.btnText, { color: "#ffffff" }]}>
            {t("errors.notFoundBack")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
