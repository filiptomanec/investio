import { useTranslation } from "react-i18next";
import { STORAGE_KEY, supportedLocales, type Locale } from "@investio/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (supportedLocales.includes(i18n.language as Locale)
    ? i18n.language
    : "cs") as Locale;
  const next: Locale = current === "cs" ? "en" : "cs";

  const onClick = () => {
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
      className="h-9 inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted transition-colors"
    >
      <span className={current === "cs" ? "text-brand" : "text-muted-foreground"}>CS</span>
      <span className="mx-1.5 text-muted-foreground/40">/</span>
      <span className={current === "en" ? "text-brand" : "text-muted-foreground"}>EN</span>
    </button>
  );
}
