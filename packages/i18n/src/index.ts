import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import cs from "./messages/cs.json";
import en from "./messages/en.json";

export type Locale = "cs" | "en";

export const supportedLocales: Locale[] = ["cs", "en"];
export const defaultLocale: Locale = "cs";

export const STORAGE_KEY = "investio-lang";

export const i18n: I18nInstance = i18next.createInstance();

void i18n.use(initReactI18next).init({
  lng: defaultLocale,
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
