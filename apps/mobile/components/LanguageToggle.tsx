import { Pressable, View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../hooks/useLanguageBootstrap";
import type { Locale } from "@investio/i18n";

interface LanguageToggleProps {
  colors: {
    foreground: string;
    mutedForeground: string;
    card: string;
    border: string;
    brand: string;
    surface?: string;
  };
}

export function LanguageToggle({ colors }: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const current = (i18n.language?.startsWith("en") ? "en" : "cs") as Locale;

  async function toggle() {
    const next: Locale = current === "cs" ? "en" : "cs";
    await changeLanguage(next);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {(["cs", "en"] as Locale[]).map((lang) => (
        <Pressable
          key={lang}
          onPress={() => void (lang !== current && toggle())}
          accessibilityRole="button"
          accessibilityLabel={lang === "cs" ? "Čeština" : "English"}
          style={[
            styles.pill,
            lang === current && { backgroundColor: colors.brand },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: lang === current ? "#ffffff" : colors.mutedForeground },
            ]}
          >
            {lang.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    gap: 0,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
