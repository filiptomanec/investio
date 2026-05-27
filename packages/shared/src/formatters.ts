// Locale-aware number / currency formatting.
// Currency is decoupled from locale so EN-speakers can keep CZK if they want.

export type SupportedLocale = "cs" | "en";
export type SupportedCurrency = "CZK" | "EUR" | "USD";

const intlLocaleMap: Record<SupportedLocale, string> = {
  cs: "cs-CZ",
  en: "en-US",
};

// Default currency per locale. Override per call when needed.
export function currencyForLocale(locale: SupportedLocale): SupportedCurrency {
  return locale === "cs" ? "CZK" : "USD";
}

export function formatCurrency(
  amount: number,
  locale: SupportedLocale,
  currency: SupportedCurrency = currencyForLocale(locale),
): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(intlLocaleMap[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale: SupportedLocale): string {
  const v = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(intlLocaleMap[locale], {
    maximumFractionDigits: 0,
  }).format(v);
}
