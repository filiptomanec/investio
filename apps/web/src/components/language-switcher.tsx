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
      className="relative inline-grid h-9 grid-cols-2 items-center rounded-full bg-(--b-track) p-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--b-mint)"
    >
      <span
        aria-hidden="true"
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-(--b-pill) shadow-[0_1px_3px_rgb(0_0_0/0.12)] transition-[left] duration-300 ${
          current === "cs" ? "left-1" : "left-1/2"
        }`}
      />
      <span
        className={`relative px-2.5 ${current === "cs" ? "text-(--b-ink)" : "text-(--b-muted)"}`}
      >
        CS
      </span>
      <span
        className={`relative px-2.5 ${current === "en" ? "text-(--b-ink)" : "text-(--b-muted)"}`}
      >
        EN
      </span>
    </button>
  );
}
