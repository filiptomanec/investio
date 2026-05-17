// TODO(T-007): full implementation — locale-aware CZ + EN formatting

/**
 * Format a number as currency.
 * Stub — full locale-aware implementation (CZK/EUR/USD) arrives in T-007.
 */
export function formatCurrency(
  value: number,
  currency = "CZK",
  locale = "cs-CZ"
): string {
  // TODO(T-007): support currency switching (CZK/EUR/USD) per user preference
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as a percentage.
 * Stub — T-007 adds precision control + locale variants.
 */
export function formatPercent(
  value: number,
  locale = "cs-CZ",
  decimals = 2
): string {
  // TODO(T-007): add optional decimals param + locale awareness for EN/CZ
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a Date as a localized date string.
 * Stub — T-007 adds format options (short/long/month-year).
 */
export function formatDate(
  date: Date | string,
  locale = "cs-CZ"
): string {
  // TODO(T-007): add format options (short/long/month-year)
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
