import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import { useColors } from "../hooks/useColors";

export default function MethodologyScreen() {
  const { theme } = useTheme();
  const colors = useColors(theme);
  const { t } = useTranslation();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["bottom", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          {t("footer.methodology")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
  },
});
