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
  return harden(
    new Intl.NumberFormat(intlLocaleMap[locale], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value),
  );
}

export function formatNumber(value: number, locale: SupportedLocale): string {
  const v = Number.isFinite(value) ? value : 0;
  return harden(
    new Intl.NumberFormat(intlLocaleMap[locale], {
      maximumFractionDigits: 0,
    }).format(v),
  );
}

// Make a locale-formatted number/currency string layout-safe:
//   - Promote every regular space (U+0020) to a non-breaking space, so digit
//     groups and the currency symbol never wrap onto a new line.
//   - Insert a Word Joiner (U+2060) between K and č in "Kč". With Tailwind's
//     `break-words` (overflow-wrap: break-word) on narrow columns the browser
//     would otherwise split the currency symbol at the K|č boundary, leaving
//     a lone "K" at end of line. The Word Joiner is a zero-width "no break
//     here" marker that prevents that split.
function harden(s: string): string {
  return s.replace(/ /g, " ").replace(/Kč/g, "K⁠č");
}
