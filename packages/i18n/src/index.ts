// @investio/i18n — typed message exports
// Full i18n runtime integration (next-intl + i18next) arrives in T-009 / T-020

import cs from "../locales/cs.json";
import en from "../locales/en.json";

export { cs, en };

export type Messages = typeof cs;
export type Locale = "cs" | "en";

export const locales: Locale[] = ["cs", "en"];
export const defaultLocale: Locale = "cs";
