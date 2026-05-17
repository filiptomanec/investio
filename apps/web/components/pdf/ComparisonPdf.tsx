/**
 * ComparisonPdf — @react-pdf/renderer document for side-by-side scenario comparison.
 *
 * Chart embed strategy: Option B (table-based time series).
 * See CompoundPdf.tsx for full rationale.
 *
 * Layout:
 *   Page 1: Winner badge + side-by-side inputs (A | B) + diff table
 *   Page 2: Comparative annual time series table
 */

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { ComparisonResult } from "@investio/shared/calc";
import type { ScenarioInput, CompoundInput, RealEstateInput } from "@investio/shared/schemas";
import { formatCurrency, formatPercent, formatDate } from "@investio/shared/formatters";

import { styles, BRAND_TEAL, BRAND_AMBER, SLATE_600 } from "./pdf-styles";

type AppLocale = "cs" | "en";

interface PdfLabels {
  title: string;
  generatedOn: string;
  sections: {
    inputs: string;
    results: string;
    chart: string;
    comparisonA: string;
    comparisonB: string;
    diff: string;
  };
  fields: {
    winner: string;
    finalValueA: string;
    finalValueB: string;
    roiA: string;
    roiB: string;
    delta: string;
    horizonYears: string;
  };
  table: {
    year: string;
    scenarioA: string;
    scenarioB: string;
    delta: string;
  };
  winnerA: string;
  winnerB: string;
  tie: string;
  disclaimer: string;
}

interface ComparisonPdfProps {
  inputA: ScenarioInput;
  inputB: ScenarioInput;
  comparison: ComparisonResult;
  locale: AppLocale;
  labels: PdfLabels;
}

function buildComparisonRows(comparison: ComparisonResult): Array<{
  year: number;
  aValue: number;
  bValue: number;
  delta: number;
}> {
  const aMap = new Map(comparison.a.timeSeries.map((p) => [p.month, p.value]));
  const bMap = new Map(comparison.b.timeSeries.map((p) => [p.month, p.value]));
  const maxMonth = comparison.horizonYears * 12;
  const rows: Array<{ year: number; aValue: number; bValue: number; delta: number }> = [];

  for (let m = 12; m <= maxMonth; m += 12) {
    const aVal = aMap.get(m) ?? 0;
    const bVal = bMap.get(m) ?? 0;
    rows.push({ year: m / 12, aValue: aVal, bValue: bVal, delta: aVal - bVal });
  }
  // Also include final month if not a clean year boundary
  const lastMonth = maxMonth;
  if (lastMonth % 12 !== 0) {
    const aVal = aMap.get(lastMonth) ?? 0;
    const bVal = bMap.get(lastMonth) ?? 0;
    rows.push({
      year: Math.round((lastMonth / 12) * 10) / 10,
      aValue: aVal,
      bValue: bVal,
      delta: aVal - bVal,
    });
  }

  return rows;
}

function getScenarioSummary(
  input: ScenarioInput,
  locale: AppLocale,
  fmt: (v: number) => string,
  pct: (v: number) => string
): Array<{ label: string; value: string }> {
  if (input.type === "compound") {
    const c = input as CompoundInput;
    return [
      { label: locale === "cs" ? "Typ" : "Type", value: locale === "cs" ? "Složené úročení" : "Compound interest" },
      { label: locale === "cs" ? "Počáteční částka" : "Initial amount", value: fmt(c.initialAmount) },
      { label: locale === "cs" ? "Měsíční vklad" : "Monthly contribution", value: fmt(c.monthlyContribution) },
      { label: locale === "cs" ? "Roční výnos" : "Annual return", value: pct(c.annualReturnPct) },
      { label: locale === "cs" ? "Horizont" : "Horizon", value: `${c.horizonYears}` },
    ];
  }
  const re = input as RealEstateInput;
  return [
    { label: locale === "cs" ? "Typ" : "Type", value: locale === "cs" ? "Nemovitost" : "Real estate" },
    { label: locale === "cs" ? "Kupní cena" : "Purchase price", value: fmt(re.purchasePrice) },
    { label: locale === "cs" ? "Vlastní kapitál" : "Down payment", value: fmt(re.downPayment) },
    { label: locale === "cs" ? "Měsíční nájem" : "Monthly rent", value: fmt(re.monthlyRent) },
    { label: locale === "cs" ? "Horizont" : "Horizon", value: `${re.horizonYears}` },
  ];
}

export function ComparisonPdf({ inputA, inputB, comparison, locale, labels }: ComparisonPdfProps) {
  const fmt = (v: number) => formatCurrency(v, "CZK", locale);
  const pct = (v: number) => formatPercent(v, locale, 1);
  const today = new Date();
  const dateStr = formatDate(today, locale);
  const generatedLabel = labels.generatedOn.replace("{date}", dateStr);

  const { difference, a, b } = comparison;
  const winnerText =
    difference.winnerKey === "a"
      ? labels.winnerA
      : difference.winnerKey === "b"
        ? labels.winnerB
        : labels.tie;

  const summaryA = getScenarioSummary(inputA, locale, fmt, pct);
  const summaryB = getScenarioSummary(inputB, locale, fmt, pct);
  const compRows = buildComparisonRows(comparison);

  return (
    <Document>
      {/* ============================================================
          Page 1: Summary + Diff
      ============================================================ */}
      <Page size="A4" style={styles.page}>
        {/* ---- Header ---- */}
        <View style={styles.header}>
          <Text style={styles.headerLogo}>Investio</Text>
          <View>
            <Text style={styles.headerTitle}>{labels.title}</Text>
            <Text style={styles.headerMeta}>{generatedLabel}</Text>
          </View>
        </View>

        {/* ---- Winner badge ---- */}
        <View style={styles.winnerBadge}>
          <Text style={styles.winnerBadgeLabel}>{labels.fields.winner}</Text>
          <Text style={styles.winnerBadgeValue}>{winnerText}</Text>
        </View>

        {/* ---- Side-by-side inputs ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.inputs}</Text>
          <View style={styles.twoColContainer}>
            {/* Column A */}
            <View style={styles.twoColLeft}>
              <Text style={[styles.colHeader, { color: BRAND_TEAL }]}>
                {labels.sections.comparisonA}
              </Text>
              {summaryA.map((row, i) => (
                <View
                  key={row.label}
                  style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={styles.tableLabel}>{row.label}</Text>
                  <Text style={styles.tableValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            {/* Column B */}
            <View style={styles.twoColRight}>
              <Text style={[styles.colHeader, { color: BRAND_AMBER }]}>
                {labels.sections.comparisonB}
              </Text>
              {summaryB.map((row, i) => (
                <View
                  key={row.label}
                  style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={styles.tableLabel}>{row.label}</Text>
                  <Text style={styles.tableValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---- Diff table ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.diff}</Text>
          {/* Horizon */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>
              {labels.fields.horizonYears}
            </Text>
            <Text style={styles.tableValue}>{comparison.horizonYears}</Text>
          </View>

          {/* Final values */}
          <View style={[styles.diffHeaderRow, { marginTop: 8 }]}>
            <Text style={styles.diffHeaderCellFirst}>&nbsp;</Text>
            <Text style={[styles.diffHeaderCell, { color: BRAND_TEAL }]}>
              {labels.sections.comparisonA}
            </Text>
            <Text style={[styles.diffHeaderCell, { color: BRAND_AMBER }]}>
              {labels.sections.comparisonB}
            </Text>
            <Text style={styles.diffHeaderCell}>{labels.fields.delta}</Text>
          </View>

          <View style={styles.diffRow}>
            <Text style={styles.diffCellFirst}>{labels.fields.finalValueA.replace(" A", "")}</Text>
            <Text style={styles.diffCell}>{fmt(a.finalValue)}</Text>
            <Text style={styles.diffCell}>{fmt(b.finalValue)}</Text>
            <Text
              style={[
                styles.diffCell,
                {
                  color:
                    difference.finalValueDelta >= 0 ? BRAND_TEAL : BRAND_AMBER,
                  fontFamily: "Helvetica-Bold",
                },
              ]}
            >
              {difference.finalValueDelta >= 0 ? "+" : ""}
              {fmt(difference.finalValueDelta)}
            </Text>
          </View>

          <View style={[styles.diffRow, styles.tsRowAlt]}>
            <Text style={styles.diffCellFirst}>
              {locale === "cs" ? "ROI" : "ROI"}
            </Text>
            <Text style={styles.diffCell}>
              {a.totalROI >= 0 ? "+" : ""}
              {pct(a.totalROI)}
            </Text>
            <Text style={styles.diffCell}>
              {b.totalROI >= 0 ? "+" : ""}
              {pct(b.totalROI)}
            </Text>
            <Text style={[styles.diffCell, { color: SLATE_600 }]}>—</Text>
          </View>
        </View>

        {/* ---- Footer ---- */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{labels.disclaimer}</Text>
        </View>
      </Page>

      {/* ============================================================
          Page 2: Annual time series A vs B
      ============================================================ */}
      <Page size="A4" style={styles.page}>
        {/* ---- Header (repeat) ---- */}
        <View style={styles.header}>
          <Text style={styles.headerLogo}>Investio</Text>
          <View>
            <Text style={styles.headerTitle}>{labels.title}</Text>
            <Text style={styles.headerMeta}>{generatedLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.chart}</Text>
          <View style={styles.tsTable}>
            <View style={styles.tsHeaderRow}>
              <Text style={styles.tsHeaderCellFirst}>{labels.table.year}</Text>
              <Text style={[styles.tsHeaderCell, { color: BRAND_TEAL }]}>
                {labels.table.scenarioA}
              </Text>
              <Text style={[styles.tsHeaderCell, { color: BRAND_AMBER }]}>
                {labels.table.scenarioB}
              </Text>
              <Text style={styles.tsHeaderCell}>{labels.table.delta}</Text>
            </View>
            {compRows.map((row, i) => (
              <View
                key={row.year}
                style={[styles.tsRow, i % 2 === 1 ? styles.tsRowAlt : {}]}
              >
                <Text style={styles.tsCellFirst}>{row.year}</Text>
                <Text style={[styles.tsCell, { color: BRAND_TEAL }]}>
                  {fmt(row.aValue)}
                </Text>
                <Text style={[styles.tsCell, { color: BRAND_AMBER }]}>
                  {fmt(row.bValue)}
                </Text>
                <Text
                  style={[
                    styles.tsCell,
                    {
                      color: row.delta >= 0 ? BRAND_TEAL : BRAND_AMBER,
                      fontFamily: "Helvetica-Bold",
                    },
                  ]}
                >
                  {row.delta >= 0 ? "+" : ""}
                  {fmt(row.delta)}
                </Text>
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

export type { ComparisonPdfProps };
