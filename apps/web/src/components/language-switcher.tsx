import { useTranslation } from "react-i18next";
import { STORAGE_KEY, supportedLocales, type Locale } from "@investio/i18n";
import { hapticLight } from "@/lib/native";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (
    supportedLocales.includes(i18n.language as Locale) ? i18n.language : "cs"
  ) as Locale;
  const next: Locale = current === "cs" ? "en" : "cs";

  const onClick = () => {
    // Haptic feedback on iOS (no-op on web)
    hapticLight();
    void i18n.changeLanguage(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* localStorage unavailable — ignore */
      }
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("header.toggleLanguage")}
      className="h-9 inline-flex items-center justify-center rounded-md px-2.5 text-[13px] font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={current === "cs" ? "text-foreground" : "text-muted-foreground"}>CS</span>
      <span className="mx-1 text-muted-foreground/50">/</span>
      <span className={current === "en" ? "text-foreground" : "text-muted-foreground"}>EN</span>
    </button>
  );
}
