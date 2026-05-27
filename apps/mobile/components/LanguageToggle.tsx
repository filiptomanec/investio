import { Pressable, View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { selectionFeedback } from "../lib/haptics";
import { changeLanguage } from "../hooks/useLanguageBootstrap";
import type { Locale } from "@investio/i18n";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = (i18n.language?.startsWith("en") ? "en" : "cs") as Locale;

  const handleToggle = () => {
    selectionFeedback();
    const next: Locale = current === "cs" ? "en" : "cs";
    void changeLanguage(next);
  };

  return (
    <Pressable
      onPress={handleToggle}
      accessibilityRole="button"
      accessibilityLabel="Change language"
      accessibilityHint={current === "cs" ? "Switch to English" : "Přepnout na češtinu"}
      style={{ minWidth: 44, minHeight: 44 }}
      className="items-center justify-center"
    >
      <View className="flex-row rounded-lg border border-border overflow-hidden">
        <View
          className={`px-2 py-1 ${current === "cs" ? "bg-brand" : "bg-card"}`}
        >
          <Text
            className={`text-xs font-medium ${current === "cs" ? "text-background" : "text-muted-foreground"}`}
          >
            CS
          </Text>
        </View>
        <View
          className={`px-2 py-1 ${current === "en" ? "bg-brand" : "bg-card"}`}
        >
          <Text
            className={`text-xs font-medium ${current === "en" ? "text-background" : "text-muted-foreground"}`}
          >
            EN
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
