import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import cs from "./messages/cs.json";
import en from "./messages/en.json";

export type Locale = "cs" | "en";

export const supportedLocales: Locale[] = ["cs", "en"];
export const defaultLocale: Locale = "cs";

export const STORAGE_KEY = "investio-lang";

// Read the persisted locale synchronously so the very first render already
// uses the correct language. On the server `localStorage` is undefined, so
// we fall back to `defaultLocale`. On the client this prevents a flash where
// useLanguageSync's async changeLanguage() fires after first paint and causes
// a partially-translated render (mixed CS/EN labels).
function detectInitialLocale(): Locale {
  if (typeof localStorage === "undefined") return defaultLocale;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (supportedLocales.includes(stored as Locale)) return stored as Locale;
    const browserLang = (navigator?.language ?? "").toLowerCase();
    if (browserLang.startsWith("cs") || browserLang.startsWith("sk")) return "cs";
    if (browserLang) return "en";
  } catch {
    // localStorage unavailable (e.g. private browsing with strict settings)
  }
  return defaultLocale;
}

export const i18n: I18nInstance = i18next.createInstance();

void i18n.use(initReactI18next).init({
  lng: detectInitialLocale(),
  fallbackLng: defaultLocale,
  supportedLngs: supportedLocales,
  resources: {
    cs: { translation: cs },
    en: { translation: en },
  },
  interpolation: {
    // React already escapes — i18next's escaping would double-encode.
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Re-export the JSON shape so apps can type-check translation keys if they
// want to wire up a strict useTranslation<Resources> overload later.
export type Messages = typeof cs;

export { cs, en };
