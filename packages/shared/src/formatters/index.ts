/**
 * Locale-aware formatters using Intl APIs (zero-dependency).
 * Intl locale mapping: app "cs" → "cs-CZ", app "en" → "en-US".
 * Hermes (Expo SDK 53 / RN 0.81) fully supports Intl.NumberFormat.
 */

type AppLocale = "cs" | "en";

function toIntlLocale(locale: AppLocale): string {
  return locale === "cs" ? "cs-CZ" : "en-US";
}

/**
 * Format a number as currency.
 *
 * Examples:
 *   formatCurrency(12345, "CZK", "cs") → "12 345 Kč"
 *   formatCurrency(12345.67, "USD", "en") → "$12,346"
 *   formatCurrency(12345, "CZK", "en") → "CZK 12,345"
 */
export function formatCurrency(
  value: number,
  currency: "CZK" | "EUR" | "USD",
  locale: AppLocale
): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a decimal as a percentage.
 *
 * @param value - Decimal fraction (e.g. 0.05 = 5 %)
 * @param locale - App locale "cs" | "en"
 * @param fractionDigits - Number of decimal places (default 1)
 *
 * Examples:
 *   formatPercent(0.075, "cs") → "7,5 %"
 *   formatPercent(0.075, "en") → "7.5%"
 *   formatPercent(0.1, "cs", 0) → "10 %"
 */
export function formatPercent(
  value: number,
  locale: AppLocale,
  fractionDigits = 1
): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Format a Date as a long localized date string.
 *
 * Examples:
 *   formatDate(new Date("2025-01-15"), "cs") → "15. ledna 2025"
 *   formatDate(new Date("2025-01-15"), "en") → "January 15, 2025"
 */
export function formatDate(date: Date | string, locale: AppLocale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Format large numbers in compact notation for chart labels.
 *
 * Examples:
 *   formatCompact(1_200_000, "cs") → "1,2 mil."
 *   formatCompact(1_200_000, "en") → "1.2M"
 */
export function formatCompact(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
