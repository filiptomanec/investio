import type { SupportedLocale } from "@investio/shared";

// Shared Recharts styling for the ledger look: no axis lines or ticks marks,
// 12px grey labels, faint horizontal gridlines only, a plain tooltip box.

export const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  vertical: false,
  stroke: "var(--color-border)",
} as const;

export const tooltipContentStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 6,
  fontSize: 12,
  padding: "8px 10px",
  color: "var(--color-foreground)",
  fontVariantNumeric: "tabular-nums",
  boxShadow: "0 4px 16px rgb(0 0 0 / 0.08)",
} as const;

export const tooltipLabelStyle = {
  color: "var(--color-muted-foreground)",
  marginBottom: 2,
} as const;

// "1,2 mil.", "500 tis." in Czech; "1.2M", "500K" in English.
export function compactFormatter(locale: SupportedLocale) {
  const nf = new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  });
  return (v: number) => nf.format(v).replace(/\u00a0/g, " ");
}

// Year ticks on one even step that lands on the last year when it can:
// 0/5/10/…/30 rather than Recharts' 0/8/16/30.
export function yearTicks(years: number): number[] {
  const steps = [1, 2, 5, 10];
  const step =
    steps.find((st) => years / st <= 6 && years % st === 0) ??
    steps.find((st) => years / st <= 6) ??
    10;
  const ticks: number[] = [];
  for (let y = 0; y <= years; y += step) ticks.push(y);
  return ticks;
}
