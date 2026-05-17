import cs from "../locales/cs.json";
import en from "../locales/en.json";

export const messages = { cs, en } as const;
export type Locale = keyof typeof messages; // "cs" | "en"
export type Messages = typeof cs;
export const defaultLocale: Locale = "cs";
export const locales: readonly Locale[] = ["cs", "en"] as const;
