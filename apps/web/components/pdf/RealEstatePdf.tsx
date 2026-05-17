/**
 * RealEstatePdf — @react-pdf/renderer document for real estate scenario.
 *
 * Chart embed strategy: Option B (table-based time series).
 * See CompoundPdf.tsx for full rationale.
 *
 * 2-page layout:
 *   Page 1: Inputs (5 sections) + key results
 *   Page 2: Annual time series table (cashflow + equity)
 */

import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { RealEstateResult } from "@investio/shared/calc";
import type { RealEstateInput } from "@investio/shared/schemas";
import { formatCurrency, formatPercent, formatDate } from "@investio/shared/formatters";

import { styles, BRAND_TEAL, DANGER_RED, SUCCESS_GREEN } from "./pdf-styles";

type AppLocale = "cs" | "en";

interface PdfLabels {
  title: string;
  generatedOn: string;
  sections: {
    inputs: string;
    results: string;
    chart: string;
    purchase: string;
    financing: string;
    income: string;
    costs: string;
    horizon: string;
  };
  fields: {
    purchasePrice: string;
    downPayment: string;
    mortgageRate: string;
    mortgageTerm: string;
    monthlyRent: string;
    monthlyExpenses: string;
    vacancyRate: string;
    rentGrowth: string;
    appreciation: string;
    incomeTax: string;
    horizonYears: string;
    monthlyPayment: string;
    avgMonthlyCashflow: string;
    grossYield: string;
    netYield: string;
    irr: string;
    breakEven: string;
    finalEquity: string;
    totalCashflow: string;
  };
  table: {
    year: string;
    netCashflow: string;
    equity: string;
    propertyValue: string;
  };
  irrUncomputable: string;
  breakEvenNever: string;
  disclaimer: string;
}

interface RealEstatePdfProps {
  input: RealEstateInput;
  result: RealEstateResult;
  locale: AppLocale;
  labels: PdfLabels;
}

function buildAnnualRows(timeSeries: RealEstateResult["timeSeries"]): Array<{
  year: number;
  month: number;
  netCashflow: number;
  equity: number;
  propertyValue: number;
}> {
  const maxMonth = timeSeries[timeSeries.length - 1]?.month ?? 0;
  const yearlyMonths = new Set<number>();
  for (let m = 12; m <= maxMonth; m += 12) {
    yearlyMonths.add(m);
  }
  yearlyMonths.add(maxMonth);

  return timeSeries
    .filter((p) => yearlyMonths.has(p.month))
    .map((p) => ({
      year: Math.round(p.month / 12),
      month: p.month,
      netCashflow: p.netCashflow,
      equity: p.equity,
      propertyValue: p.propertyValue,
    }));
}

export function RealEstatePdf({ input, result, locale, labels }: RealEstatePdfProps) {
  const fmt = (v: number) => formatCurrency(v, "CZK", locale);
  const pct = (v: number) => formatPercent(v, locale, 1);
  const today = new Date();
  const dateStr = formatDate(today, locale);
  const generatedLabel = labels.generatedOn.replace("{date}", dateStr);

  const annualRows = buildAnnualRows(result.timeSeries);
  const irrDisplay = result.irr !== null ? pct(result.irr) : labels.irrUncomputable;
  const breakEvenDisplay =
    result.breakEvenMonth !== null
      ? `${labels.fields.breakEven} ${result.breakEvenMonth}`
      : labels.breakEvenNever;

  return (
    <Document>
      {/* ============================================================
          Page 1: Inputs + Results
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

        {/* ---- Purchase inputs ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.purchase}</Text>
          {[
            { label: labels.fields.purchasePrice, value: fmt(input.purchasePrice) },
            { label: labels.fields.downPayment, value: fmt(input.downPayment) },
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

        {/* ---- Financing inputs ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.financing}</Text>
          {[
            { label: labels.fields.mortgageRate, value: pct(input.mortgage.annualRatePct) },
            { label: labels.fields.mortgageTerm, value: `${input.mortgage.termYears}` },
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

        {/* ---- Income inputs ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.income}</Text>
          {[
            { label: labels.fields.monthlyRent, value: fmt(input.monthlyRent) },
            { label: labels.fields.vacancyRate, value: pct(input.vacancyRatePct) },
            { label: labels.fields.rentGrowth, value: pct(input.annualRentGrowthPct) },
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

        {/* ---- Costs inputs ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.costs}</Text>
          {[
            { label: labels.fields.monthlyExpenses, value: fmt(input.monthlyExpenses) },
            { label: labels.fields.appreciation, value: pct(input.annualAppreciationPct) },
            { label: labels.fields.incomeTax, value: pct(input.incomeTaxPct) },
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

        {/* ---- Horizon ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.horizon}</Text>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>{labels.fields.horizonYears}</Text>
            <Text style={styles.tableValue}>{input.horizonYears}</Text>
          </View>
        </View>

        {/* ---- Hero: final equity ---- */}
        <View style={styles.heroBox}>
          <Text style={styles.heroLabel}>{labels.fields.finalEquity}</Text>
          <Text style={styles.heroValue}>{fmt(result.finalEquity)}</Text>
        </View>

        {/* ---- Results grid ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{labels.sections.results}</Text>
          <View style={styles.resultsGrid}>
            <View style={styles.resultCell}>
              <Text style={styles.resultCellLabel}>{labels.fields.monthlyPayment}</Text>
              <Text style={styles.resultCellValue}>{fmt(result.monthlyPayment)}</Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultCellLabel}>{labels.fields.avgMonthlyCashflow}</Text>
              <Text
                style={
                  result.averageMonthlyCashflow >= 0
                    ? styles.resultCellValuePositive
                    : styles.resultCellValueNegative
                }
              >
                {fmt(result.averageMonthlyCashflow)}
              </Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultCellLabel}>{labels.fields.grossYield}</Text>
              <Text style={styles.resultCellValue}>{pct(result.grossYield)}</Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultCellLabel}>{labels.fields.netYield}</Text>
              <Text style={styles.resultCellValue}>{pct(result.netYield)}</Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultCellLabel}>{labels.fields.irr}</Text>
              <Text
                style={
                  result.irr !== null && result.irr > 0
                    ? styles.resultCellValuePositive
                    : styles.resultCellValue
                }
              >
                {irrDisplay}
              </Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultCellLabel}>{labels.fields.breakEven}</Text>
              <Text style={styles.resultCellValue}>{breakEvenDisplay}</Text>
            </View>
            <View style={styles.resultCell}>
              <Text style={styles.resultCellLabel}>{labels.fields.totalCashflow}</Text>
              <Text
                style={
                  result.totalCashflow >= 0
                    ? styles.resultCellValuePositive
                    : styles.resultCellValueNegative
                }
              >
                {fmt(result.totalCashflow)}
              </Text>
            </View>
          </View>
        </View>

        {/* ---- Footer ---- */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{labels.disclaimer}</Text>
        </View>
      </Page>

      {/* ============================================================
          Page 2: Annual time series
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
              <Text style={styles.tsHeaderCell}>{labels.table.netCashflow}</Text>
              <Text style={styles.tsHeaderCell}>{labels.table.equity}</Text>
              <Text style={styles.tsHeaderCell}>{labels.table.propertyValue}</Text>
            </View>
            {annualRows.map((row, i) => (
              <View
                key={row.month}
                style={[styles.tsRow, i % 2 === 1 ? styles.tsRowAlt : {}]}
              >
                <Text style={styles.tsCellFirst}>{row.year}</Text>
                <Text
                  style={[
                    styles.tsCell,
                    { color: row.netCashflow >= 0 ? SUCCESS_GREEN : DANGER_RED },
                  ]}
                >
                  {fmt(row.netCashflow)}
                </Text>
                <Text style={[styles.tsCell, { color: BRAND_TEAL }]}>
                  {fmt(row.equity)}
                </Text>
                <Text style={[styles.tsCell, { fontFamily: "Helvetica-Bold" }]}>
                  {fmt(row.propertyValue)}
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

export type { RealEstatePdfProps };
