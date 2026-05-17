/**
 * CompoundPdf — @react-pdf/renderer document for compound interest scenario.
 *
 * Chart embed strategy: Option B (table-based time series).
 * Recharts SVG extraction into react-pdf <Svg> requires imperative DOM ref
 * traversal through ResponsiveContainer (which renders in a portal and does
 * not expose the SVG element via forwardRef). Reliably capturing the SVG
 * at the moment of PDF generation would require either a hidden-render pass
 * or dom-to-image libraries — adding unnecessary complexity and a canvas
 * security surface. Option B (structured table of annual snapshots) provides
 * identical data readability in PDF form and is fully reliable. Documented
 * in PR description per ticket requirement.
 */

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { CompoundResult } from "@investio/shared/calc";
import type { CompoundInput } from "@investio/shared/schemas";
import { formatCurrency, formatPercent, formatDate } from "@investio/shared/formatters";

import { styles, BRAND_TEAL, BRAND_AMBER } from "./pdf-styles";

type AppLocale = "cs" | "en";

interface PdfLabels {
  title: string;
  generatedOn: string;
  sections: {
    inputs: string;
    results: string;
    chart: string;
  };
  fields: {
    initialAmount: string;
    monthlyContribution: string;
    annualReturnPct: string;
    horizonYears: string;
    contributionTiming: string;
    finalValue: string;
    totalContributions: string;
    totalGains: string;
  };
  table: {
    year: string;
    contributions: string;
    value: string;
    gains: string;
  };
  contributionTimingBegin: string;
  contributionTimingEnd: string;
  disclaimer: string;
}

interface CompoundPdfProps {
  input: CompoundInput;
  result: CompoundResult;
  locale: AppLocale;
  labels: PdfLabels;
}

function buildAnnualRows(timeSeries: CompoundResult["timeSeries"]): Array<{
  year: number;
  month: number;
  contributions: number;
  value: number;
  gains: number;
}> {
  // Take yearly snapshots (month 12, 24, 36...) + final month
  const yearlyMonths = new Set<number>();
  const maxMonth = timeSeries[timeSeries.length - 1]?.month ?? 0;
  for (let m = 12; m <= maxMonth; m += 12) {
    yearlyMonths.add(m);
  }
  yearlyMonths.add(maxMonth);

  return timeSeries
    .filter((p) => yearlyMonths.has(p.month))
    .map((p) => ({
      year: Math.round(p.month / 12),
      month: p.month,
      contributions: p.contributions,
      value: p.value,
      gains: Math.max(0, p.value - p.contributions),
    }));
}

export function CompoundPdf({ input, result, locale, labels }: CompoundPdfProps) {
  const fmt = (v: number) => formatCurrency(v, "CZK", locale);
  const pct = (v: number) => formatPercent(v, locale, 1);
  const today = new Date();
  const dateStr = formatDate(today, locale);
  const generatedLabel = labels.generatedOn.replace("{date}", dateStr);

  const annualRows = buildAnnualRows(result.timeSeries);
  const gainsPct = result.totalContributions > 0
    ? result.totalGains / result.totalContributions
    : 0;

  const timingLabel =
    input.contributionTiming === "begin"
      ? labels.contributionTimingBegin
      : labels.contributionTimingEnd;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ---- Header ---- */}
        <View style={styles.header}>
          <Text style={styles.headerLogo}>Investio</Text>
          <View>
            <Text style={styles.headerTitle}>{labels.title}</Text>
            <Text style={styles.headerMeta}>{generatedLabel}</Text>
          </View>
        </View>

        {/* ---- Inputs section ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.inputs}</Text>
          {[
            { label: labels.fields.initialAmount, value: fmt(input.initialAmount) },
            { label: labels.fields.monthlyContribution, value: fmt(input.monthlyContribution) },
            { label: labels.fields.annualReturnPct, value: pct(input.annualReturnPct) },
            { label: labels.fields.horizonYears, value: `${input.horizonYears}` },
            { label: labels.fields.contributionTiming, value: timingLabel },
          ].map((row, i) => (
            <View
              key={row.label}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.tableLabel}>{row.label}</Text>
              <Text style={styles.tableValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* ---- Hero result ---- */}
        <View style={styles.heroBox}>
          <Text style={styles.heroLabel}>{labels.fields.finalValue}</Text>
          <Text style={styles.heroValue}>{fmt(result.finalValue)}</Text>
        </View>

        {/* ---- Results section ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.results}</Text>
          <View style={styles.resultsGrid}>
            <View style={styles.resultCell}>
              <Text style={styles.resultCellLabel}>{labels.fields.totalContributions}</Text>
              <Text style={styles.resultCellValue}>{fmt(result.totalContributions)}</Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultCellLabel}>{labels.fields.totalGains}</Text>
              <Text style={styles.resultCellValuePositive}>
                {fmt(result.totalGains)} (+{pct(gainsPct)})
              </Text>
            </View>
          </View>
        </View>

        {/* ---- Time series table ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.chart}</Text>
          <View style={styles.tsTable}>
            {/* Header */}
            <View style={styles.tsHeaderRow}>
              <Text style={styles.tsHeaderCellFirst}>{labels.table.year}</Text>
              <Text style={styles.tsHeaderCell}>{labels.table.contributions}</Text>
              <Text style={styles.tsHeaderCell}>{labels.table.gains}</Text>
              <Text style={styles.tsHeaderCell}>{labels.table.value}</Text>
            </View>
            {/* Rows */}
            {annualRows.map((row, i) => (
              <View
                key={row.month}
                style={[styles.tsRow, i % 2 === 1 ? styles.tsRowAlt : {}]}
              >
                <Text style={styles.tsCellFirst}>{row.year}</Text>
                <Text style={styles.tsCell}>{fmt(row.contributions)}</Text>
                <Text style={[styles.tsCell, { color: BRAND_TEAL }]}>{fmt(row.gains)}</Text>
                <Text style={[styles.tsCell, { fontFamily: "Helvetica-Bold" }]}>{fmt(row.value)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ---- Footer ---- */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{labels.disclaimer}</Text>
        </View>
      </Page>
    </Document>
  );
}

export type { CompoundPdfProps };
