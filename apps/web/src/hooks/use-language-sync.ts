import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { defaultLocale, STORAGE_KEY, supportedLocales, type Locale } from "@investio/i18n";

function readPersistedLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return supportedLocales.includes(raw as Locale) ? (raw as Locale) : null;
  } catch {
    return null;
  }
}

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;
  const lang = navigator.language?.toLowerCase();
  if (!lang) return defaultLocale;
  if (lang.startsWith("cs") || lang.startsWith("sk")) return "cs";
  return "en";
}

/**
 * Client-side language bootstrap. On first mount it reads the persisted
 * preference (or falls back to the browser language) and tells i18next to
 * switch. Keeps SSR free of `window`/`navigator` access.
 *
 * Also keeps `document.documentElement.lang` in sync so that screen readers
 * and search engines always see the correct language code.
 */
export function useLanguageSync(): void {
  const { i18n } = useTranslation();

  useEffect(() => {
    const persisted = readPersistedLocale();
    const target = persisted ?? detectBrowserLocale();
    if (i18n.language !== target) {
      void i18n.changeLanguage(target);
    }
  }, [i18n]);

  // Sync html[lang] whenever the active language changes.
  useEffect(() => {
    const lang = supportedLocales.includes(i18n.language as Locale)
      ? i18n.language
      : defaultLocale;
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [i18n.language]);
}
