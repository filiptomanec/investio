/**
 * i18next initialization for Expo / React Native.
 *
 * Import this module at the top of app/_layout.tsx (before first render)
 * so the i18next instance is ready before any component calls useTranslation().
 *
 * Locale detection order:
 *   1. expo-localization device locale (languageCode only — "cs", "en", …)
 *   2. Fallback to "cs" (primary market)
 *   3. If device locale is not supported, fall back to "cs"
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { messages, locales, defaultLocale } from "@investio/i18n";
import type { Locale } from "@investio/i18n";

const deviceLanguage = getLocales()[0]?.languageCode ?? defaultLocale;
const detectedLocale: Locale = (locales as readonly string[]).includes(
  deviceLanguage ?? ""
)
  ? (deviceLanguage as Locale)
  : defaultLocale;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: detectedLocale,
    fallbackLng: defaultLocale,
    resources: {
      cs: { translation: messages.cs },
      en: { translation: messages.en },
    },
    // i18next key separator — use "." for nested keys (e.g. "common.appName")
    keySeparator: ".",
    // Namespace used when no namespace is specified
    defaultNS: "translation",
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
  });
}

export default i18n;
