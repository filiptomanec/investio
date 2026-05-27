/**
 * LanguageToggle — matches web's LanguageSwitcher exactly:
 *
 *   <button className="h-9 ... rounded-lg border border-border bg-card px-3
 *     text-xs font-semibold uppercase tracking-wider">
 *     <span className={current === "cs" ? "text-brand" : "text-muted-foreground"}>CS</span>
 *     <span className="mx-1.5 text-muted-foreground/40">/</span>
 *     <span className={current === "en" ? "text-brand" : "text-muted-foreground"}>EN</span>
 *   </button>
 *
 * Single Pressable with "CS / EN" inline text — active locale in brand color.
 */
import { Pressable, Text, StyleSheet } from "react-native";
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
    <Pressable
      onPress={() => void toggle()}
      accessibilityRole="button"
      accessibilityLabel={current === "cs" ? "Switch to English" : "Přepnout na češtinu"}
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* CS */}
      <Text
        style={[
          styles.lang,
          { color: current === "cs" ? colors.brand : colors.mutedForeground },
        ]}
      >
        CS
      </Text>
      {/* Separator — muted-foreground at 40% opacity */}
      <Text style={[styles.separator, { color: colors.mutedForeground }]}>
        {" / "}
      </Text>
      {/* EN */}
      <Text
        style={[
          styles.lang,
          { color: current === "en" ? colors.brand : colors.mutedForeground },
        ]}
      >
        EN
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    // web: h-9 = 36px, rounded-lg, border, px-3
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  lang: {
    // web: text-xs font-semibold uppercase tracking-wider
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    fontFamily: "Inter_600SemiBold",
  },
  separator: {
    fontSize: 11,
    opacity: 0.4,
  },
});
