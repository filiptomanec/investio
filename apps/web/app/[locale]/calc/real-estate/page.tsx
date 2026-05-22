"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Save } from "lucide-react";
import { ExportPdfButton } from "@/components/pdf/ExportPdfButton";
import { RealEstatePdf } from "@/components/pdf/RealEstatePdf";
import { buildPdfFilename } from "@/lib/pdf";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { RealEstateInputBaseSchema } from "@investio/shared/schemas";
import { calculateRealEstate } from "@investio/shared/calc";
import type { RealEstateResult } from "@investio/shared/calc";
import { formatCurrency, formatPercent, formatCompact } from "@investio/shared/formatters";
import type { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormValues = z.infer<typeof RealEstateInputBaseSchema>;
type AppLocale = "cs" | "en";

// ---------------------------------------------------------------------------
// Default values — realistic Czech scenario
// ---------------------------------------------------------------------------

const DEFAULT_VALUES: FormValues = {
  type: "real_estate",
  purchasePrice: 6_000_000,
  downPayment: 1_500_000,
  mortgage: {
    annualRatePct: 0.045,
    termYears: 30,
  },
  monthlyRent: 22_000,
  monthlyExpenses: 3_500,
  vacancyRatePct: 0.05,
  maintenancePctOfRent: 0.05,
  annualAppreciationPct: 0.03,
  annualRentGrowthPct: 0.02,
  incomeTaxPct: 0.15,
  horizonYears: 20,
  exitMonth: undefined,
};

// ---------------------------------------------------------------------------
// Number input helper: parse locale-agnostic numeric strings
// ---------------------------------------------------------------------------

function parseNumericInput(raw: string): number {
  // Remove spaces (CZ thousands separator) and replace comma with dot
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

// ---------------------------------------------------------------------------
// Chart downsampling — only render every Nth data point for performance
// ---------------------------------------------------------------------------

function downsample<T>(data: T[], maxPoints: number): T[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
}

// ---------------------------------------------------------------------------
// Compact Y axis formatter
// ---------------------------------------------------------------------------

function makeYAxisFormatter(locale: AppLocale) {
  return (value: number) => formatCompact(value, locale);
}

// ---------------------------------------------------------------------------
// Cashflow chart tooltip
// ---------------------------------------------------------------------------

interface CashflowTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string | number;
  locale: AppLocale;
  t: ReturnType<typeof useTranslations>;
}

function CashflowTooltip({ active, payload, label, locale, t }: CashflowTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const month = typeof label === "number" ? label : parseInt(String(label), 10);
  const year = Math.ceil(month / 12);
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs tabular-nums">
      <p className="font-semibold text-foreground mb-2">
        Měsíc {month} / Rok {year}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-foreground">{formatCurrency(entry.value, "CZK", locale)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equity chart tooltip
// ---------------------------------------------------------------------------

interface EquityTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string | number;
  locale: AppLocale;
}

function EquityTooltip({ active, payload, label, locale }: EquityTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const month = typeof label === "number" ? label : parseInt(String(label), 10);
  const year = Math.ceil(month / 12);
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-xs tabular-nums">
      <p className="font-semibold text-foreground mb-2">
        Měsíc {month} / Rok {year}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-foreground">{formatCurrency(entry.value, "CZK", locale)}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormField component
// ---------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  unit?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

function FormField({ label, unit, error, hint, children, htmlFor }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        {children}
        {unit && (
          <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none select-none">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p
          role="alert"
          className="text-xs text-destructive"
          id={htmlFor ? `${htmlFor}-error` : undefined}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NumberInput component
// ---------------------------------------------------------------------------

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  "aria-describedby"?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, hasError, ...props }, ref) => (
    <input
      ref={ref}
      type="number"
      className={cn(
        "w-full rounded-lg border border-input bg-background px-3 py-2 pr-12 text-sm tabular-nums",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
        "transition-colors duration-150",
        hasError && "border-destructive focus:ring-destructive",
        className
      )}
      {...props}
    />
  )
);
NumberInput.displayName = "NumberInput";

// ---------------------------------------------------------------------------
// ResultItem component
// ---------------------------------------------------------------------------

interface ResultItemProps {
  label: string;
  value: string;
  highlighted?: boolean;
  positive?: boolean;
  negative?: boolean;
}

function ResultItem({ label, value, highlighted, positive, negative }: ResultItemProps) {
  return (
    <div className={cn(
      "flex flex-col gap-1 p-4 rounded-2xl border",
      highlighted
        ? "border-primary/30 bg-primary/[0.06]"
        : positive
        ? "border-success/20 bg-success/[0.04]"
        : negative
        ? "border-destructive/20 bg-destructive/[0.04]"
        : "border-border bg-muted/40"
    )}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={cn(
        "text-base font-bold text-finance",
        positive && "text-success",
        negative && "text-destructive",
        !positive && !negative && "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function RealEstatePage() {
  const t = useTranslations("calc.realEstate");
  const tPdf = useTranslations("pdf");
  const locale = useLocale() as AppLocale;

  const {
    register,
    control,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<FormValues>({
    // Cast required: pnpm resolves react-hook-form to two separate instances
    // (one in apps/web, one transitively via @investio/shared) causing
    // duplicate Resolver type definitions that are structurally equivalent
    // but nominally incompatible. The runtime behavior is identical.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(RealEstateInputBaseSchema) as any,
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  // Debounced result state
  const [result, setResult] = useState<RealEstateResult>(() =>
    calculateRealEstate(DEFAULT_VALUES)
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch all form values for live recalc
  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = RealEstateInputBaseSchema.safeParse(watchedValues);
      if (parsed.success) {
        try {
          setResult(calculateRealEstate(parsed.data));
        } catch {
          // calculation errors (e.g. invalid state mid-edit) are silently ignored
        }
      }
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watchedValues]);

  // Chart data — downsample for performance
  const chartData = useMemo(() => downsample(result.timeSeries, 120), [result.timeSeries]);

  const yAxisFormatter = useMemo(() => makeYAxisFormatter(locale), [locale]);

  // X axis tick formatter — show year labels at 5y intervals
  const xAxisFormatter = useCallback((month: number) => {
    if (month % 60 === 0) return `Rok ${month / 12}`;
    return "";
  }, []);

  // Results formatting
  const fmt = useCallback(
    (v: number) => formatCurrency(v, "CZK", locale),
    [locale]
  );

  const fmtPct = useCallback(
    (v: number) => formatPercent(v, locale, 1),
    [locale]
  );

  const irrDisplay = result.irr !== null
    ? fmtPct(result.irr)
    : t("results.irrUncomputable");

  const breakEvenDisplay = result.breakEvenMonth !== null
    ? `${t("results.breakEvenMonth")} ${result.breakEvenMonth}`
    : t("results.breakEvenNever");

  const downPaymentPct = useMemo(() => {
    const pp = getValues("purchasePrice");
    const dp = getValues("downPayment");
    if (!pp || pp === 0) return "0,0 %";
    return formatPercent(dp / pp, locale, 1);
  }, [getValues, locale, watchedValues]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TooltipProvider>
      <main id="main" className="relative min-h-screen overflow-hidden bg-background">
        {/* Atmosphere */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-halo-teal" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-noise mix-blend-overlay" />

        {/* Header */}
        <div className="relative border-b border-border/70 bg-card/60 backdrop-blur-sm">
          <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                Kalkulačka
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                {t("title")}
              </h1>
              <p className="text-base text-muted-foreground mt-2 max-w-2xl">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger
                  disabled
                  aria-disabled="true"
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed select-none"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {locale === "cs" ? "Uložit" : "Save"}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("saveTooltip")}</p>
                </TooltipContent>
              </Tooltip>
              <ExportPdfButton
                label={tPdf("exportButton")}
                filename={buildPdfFilename("real-estate")}
                documentFactory={() => {
                  const currentValues = getValues();
                  return (
                    <RealEstatePdf
                      input={currentValues}
                      result={result}
                      locale={locale}
                      labels={{
                        title: tPdf("title.realEstate"),
                        generatedOn: tPdf("generatedOn"),
                        sections: {
                          inputs: tPdf("sections.inputs"),
                          results: tPdf("sections.results"),
                          chart: tPdf("sections.chart"),
                          purchase: t("sections.purchase"),
                          financing: t("sections.financing"),
                          income: t("sections.income"),
                          costs: t("sections.costs"),
                          horizon: t("sections.horizon"),
                        },
                        fields: {
                          purchasePrice: t("fields.purchasePrice"),
                          downPayment: t("fields.downPayment"),
                          mortgageRate: t("fields.rate"),
                          mortgageTerm: t("fields.term"),
                          monthlyRent: t("fields.monthlyRent"),
                          monthlyExpenses: t("fields.monthlyExpenses"),
                          vacancyRate: t("fields.vacancyRatePct"),
                          rentGrowth: t("fields.annualRentGrowthPct"),
                          appreciation: t("fields.annualAppreciationPct"),
                          incomeTax: t("fields.incomeTaxPct"),
                          horizonYears: tPdf("fields.horizonYears"),
                          monthlyPayment: t("results.monthlyPayment"),
                          avgMonthlyCashflow: t("results.averageMonthlyCashflow"),
                          grossYield: t("results.grossYield"),
                          netYield: t("results.netYield"),
                          irr: t("results.irr"),
                          breakEven: t("results.breakEvenMonth"),
                          finalEquity: t("results.finalEquity"),
                          totalCashflow: t("results.totalCashflow"),
                        },
                        table: {
                          year: tPdf("table.year"),
                          netCashflow: tPdf("table.netCashflow"),
                          equity: tPdf("table.equity"),
                          propertyValue: tPdf("table.propertyValue"),
                        },
                        irrUncomputable: t("results.irrUncomputable"),
                        breakEvenNever: t("results.breakEvenNever"),
                        disclaimer: tPdf("disclaimer"),
                      }}
                    />
                  );
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative max-w-screen-xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">
          {/* Two-column layout on desktop */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* --- Form panel --- */}
            <section
              aria-label="Vstupy kalkulačky"
              className="w-full lg:w-[400px] lg:shrink-0"
            >
              <div className="rounded-3xl border border-border bg-card p-5 md:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-4">
                  Vstupy
                </p>
                <form noValidate>
                  <Accordion
                    type="multiple"
                    defaultValue={["purchase", "financing", "income", "costs", "horizon"]}
                    className="w-full"
                  >
                    {/* ---- Koupě ---- */}
                    <AccordionItem value="purchase">
                      <AccordionTrigger className="text-base font-semibold">
                        {t("sections.purchase")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-4 pt-2">
                          <FormField
                            label={t("fields.purchasePrice")}
                            unit="Kč"
                            htmlFor="purchasePrice"
                            error={errors.purchasePrice?.message}
                          >
                            <NumberInput
                              id="purchasePrice"
                              hasError={!!errors.purchasePrice}
                              aria-describedby={errors.purchasePrice ? "purchasePrice-error" : undefined}
                              step={100000}
                              min={0}
                              {...register("purchasePrice", { valueAsNumber: true })}
                            />
                          </FormField>

                          <FormField
                            label={t("fields.downPayment")}
                            unit="Kč"
                            htmlFor="downPayment"
                            hint={downPaymentPct}
                            error={errors.downPayment?.message}
                          >
                            <NumberInput
                              id="downPayment"
                              hasError={!!errors.downPayment}
                              aria-describedby={errors.downPayment ? "downPayment-error" : undefined}
                              step={100000}
                              min={0}
                              {...register("downPayment", { valueAsNumber: true })}
                            />
                          </FormField>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* ---- Financování ---- */}
                    <AccordionItem value="financing">
                      <AccordionTrigger className="text-base font-semibold">
                        {t("sections.financing")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-4 pt-2">
                          <FormField
                            label={t("fields.rate")}
                            unit="%"
                            htmlFor="mortgage.annualRatePct"
                            error={errors.mortgage?.annualRatePct?.message}
                          >
                            <NumberInput
                              id="mortgage.annualRatePct"
                              hasError={!!errors.mortgage?.annualRatePct}
                              step={0.001}
                              min={0}
                              max={0.5}
                              {...register("mortgage.annualRatePct", { valueAsNumber: true })}
                            />
                          </FormField>

                          <FormField
                            label={t("fields.term")}
                            unit="let"
                            htmlFor="mortgage.termYears"
                            error={errors.mortgage?.termYears?.message}
                          >
                            <NumberInput
                              id="mortgage.termYears"
                              hasError={!!errors.mortgage?.termYears}
                              step={1}
                              min={1}
                              max={40}
                              {...register("mortgage.termYears", { valueAsNumber: true })}
                            />
                          </FormField>

                          <FormField
                            label={t("fields.exitMonth")}
                            unit="měs."
                            htmlFor="exitMonth"
                            hint="Volitelné – měsíc prodeje nemovitosti"
                            error={errors.exitMonth?.message}
                          >
                            <NumberInput
                              id="exitMonth"
                              hasError={!!errors.exitMonth}
                              step={1}
                              min={1}
                              placeholder="Konec horizontu"
                              {...register("exitMonth", {
                                setValueAs: (v) => {
                                  if (v === "" || v === null || v === undefined) return undefined;
                                  const n = parseInt(String(v), 10);
                                  return isNaN(n) ? undefined : n;
                                },
                              })}
                            />
                          </FormField>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* ---- Příjmy ---- */}
                    <AccordionItem value="income">
                      <AccordionTrigger className="text-base font-semibold">
                        {t("sections.income")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-4 pt-2">
                          <FormField
                            label={t("fields.monthlyRent")}
                            unit="Kč"
                            htmlFor="monthlyRent"
                            error={errors.monthlyRent?.message}
                          >
                            <NumberInput
                              id="monthlyRent"
                              hasError={!!errors.monthlyRent}
                              step={500}
                              min={0}
                              {...register("monthlyRent", { valueAsNumber: true })}
                            />
                          </FormField>

                          <FormField
                            label={t("fields.vacancyRatePct")}
                            unit="%"
                            htmlFor="vacancyRatePct"
                            error={errors.vacancyRatePct?.message}
                          >
                            <NumberInput
                              id="vacancyRatePct"
                              hasError={!!errors.vacancyRatePct}
                              step={0.01}
                              min={0}
                              max={1}
                              {...register("vacancyRatePct", { valueAsNumber: true })}
                            />
                          </FormField>

                          <FormField
                            label={t("fields.annualRentGrowthPct")}
                            unit="%"
                            htmlFor="annualRentGrowthPct"
                            error={errors.annualRentGrowthPct?.message}
                          >
                            <NumberInput
                              id="annualRentGrowthPct"
                              hasError={!!errors.annualRentGrowthPct}
                              step={0.005}
                              min={-0.2}
                              max={0.2}
                              {...register("annualRentGrowthPct", { valueAsNumber: true })}
                            />
                          </FormField>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* ---- Náklady ---- */}
                    <AccordionItem value="costs">
                      <AccordionTrigger className="text-base font-semibold">
                        {t("sections.costs")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-4 pt-2">
                          <FormField
                            label={t("fields.monthlyExpenses")}
                            unit="Kč"
                            htmlFor="monthlyExpenses"
                            error={errors.monthlyExpenses?.message}
                          >
                            <NumberInput
                              id="monthlyExpenses"
                              hasError={!!errors.monthlyExpenses}
                              step={100}
                              min={0}
                              {...register("monthlyExpenses", { valueAsNumber: true })}
                            />
                          </FormField>

                          <FormField
                            label="Údržba (% nájmu)"
                            unit="%"
                            htmlFor="maintenancePctOfRent"
                            error={errors.maintenancePctOfRent?.message}
                          >
                            <NumberInput
                              id="maintenancePctOfRent"
                              hasError={!!errors.maintenancePctOfRent}
                              step={0.01}
                              min={0}
                              max={1}
                              {...register("maintenancePctOfRent", { valueAsNumber: true })}
                            />
                          </FormField>

                          <FormField
                            label={t("fields.annualAppreciationPct")}
                            unit="%"
                            htmlFor="annualAppreciationPct"
                            error={errors.annualAppreciationPct?.message}
                          >
                            <NumberInput
                              id="annualAppreciationPct"
                              hasError={!!errors.annualAppreciationPct}
                              step={0.005}
                              min={-0.2}
                              max={0.5}
                              {...register("annualAppreciationPct", { valueAsNumber: true })}
                            />
                          </FormField>

                          <FormField
                            label={t("fields.incomeTaxPct")}
                            unit="%"
                            htmlFor="incomeTaxPct"
                            hint="CZ: 15 % (základní pásmo) nebo 23 % (vyšší pásmo)"
                            error={errors.incomeTaxPct?.message}
                          >
                            <NumberInput
                              id="incomeTaxPct"
                              hasError={!!errors.incomeTaxPct}
                              step={0.01}
                              min={0}
                              max={0.5}
                              {...register("incomeTaxPct", { valueAsNumber: true })}
                            />
                          </FormField>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* ---- Horizont ---- */}
                    <AccordionItem value="horizon">
                      <AccordionTrigger className="text-base font-semibold">
                        {t("sections.horizon")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-4 pt-2">
                          <FormField
                            label="Investiční horizont"
                            unit="let"
                            htmlFor="horizonYears"
                            error={errors.horizonYears?.message}
                          >
                            <NumberInput
                              id="horizonYears"
                              hasError={!!errors.horizonYears}
                              step={1}
                              min={1}
                              max={30}
                              {...register("horizonYears", { valueAsNumber: true })}
                            />
                          </FormField>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </div>
            </section>

            {/* --- Results + Charts panel --- */}
            <section
              aria-label="Výsledky a grafy"
              aria-live="polite"
              className="flex-1 flex flex-col gap-6 min-w-0"
            >
              {/* Results panel — visual hero card with inner accent glow */}
              <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-5 md:p-7 glow-accent-inner-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-5">
                  Výsledky
                </p>

                {/* Hero: average monthly cashflow */}
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {t("results.averageMonthlyCashflow")}
                    </p>
                    <p
                      className={cn(
                        "text-5xl md:text-6xl font-black text-finance",
                        result.averageMonthlyCashflow >= 0
                          ? "text-gradient-teal"
                          : "text-destructive"
                      )}
                      aria-live="polite"
                    >
                      {fmt(result.averageMonthlyCashflow)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                      result.irr !== null && result.irr > 0
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    )}>
                      IRR · {irrDisplay}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ResultItem
                    label={t("results.monthlyPayment")}
                    value={fmt(result.monthlyPayment)}
                  />
                  <ResultItem
                    label={t("results.grossYield")}
                    value={fmtPct(result.grossYield)}
                  />
                  <ResultItem
                    label={t("results.netYield")}
                    value={fmtPct(result.netYield)}
                  />
                  <ResultItem
                    label={t("results.breakEvenMonth")}
                    value={breakEvenDisplay}
                  />
                  <ResultItem
                    label={t("results.finalEquity")}
                    value={fmt(result.finalEquity)}
                    positive
                  />
                  <ResultItem
                    label={t("results.totalCashflow")}
                    value={fmt(result.totalCashflow)}
                    positive={result.totalCashflow > 0}
                    negative={result.totalCashflow < 0}
                  />
                </div>
              </div>

              {/* Chart 1: Monthly cashflow */}
              <div className="rounded-3xl border border-border bg-card p-5 md:p-7">
                <h2 className="text-sm font-semibold text-foreground mb-5">
                  {t("chart.cashflow")}
                </h2>
                <div className="h-64 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="month"
                        tickFormatter={xAxisFormatter}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={yAxisFormatter}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <RechartsTooltip
                        content={<CashflowTooltip locale={locale} t={t} />}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        iconType="circle"
                        iconSize={8}
                      />
                      {/* Positive area: effective rent */}
                      <Area
                        type="monotone"
                        dataKey="effectiveRent"
                        name={t("fields.monthlyRent")}
                        stackId="positive"
                        fill="hsl(var(--chart-1))"
                        stroke="hsl(var(--chart-1))"
                        fillOpacity={0.6}
                      />
                      {/* Negative areas: mortgage + expenses + tax */}
                      <Area
                        type="monotone"
                        dataKey="interest"
                        name="Úrok hypotéky"
                        stackId="negative"
                        fill="hsl(var(--chart-5))"
                        stroke="hsl(var(--chart-5))"
                        fillOpacity={0.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        name="Náklady"
                        stackId="negative"
                        fill="hsl(var(--chart-4))"
                        stroke="hsl(var(--chart-4))"
                        fillOpacity={0.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="tax"
                        name="Daň"
                        stackId="negative"
                        fill="hsl(var(--chart-2))"
                        stroke="hsl(var(--chart-2))"
                        fillOpacity={0.5}
                      />
                      {/* Net cashflow overlay line */}
                      <Line
                        type="monotone"
                        dataKey="netCashflow"
                        name={t("chart.netCashflow")}
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Equity build-up */}
              <div className="rounded-3xl border border-border bg-card p-5 md:p-7">
                <h2 className="text-sm font-semibold text-foreground mb-5">
                  {t("chart.equity")} & {t("chart.propertyValue")}
                </h2>
                <div className="h-64 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="month"
                        tickFormatter={xAxisFormatter}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={yAxisFormatter}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <RechartsTooltip
                        content={<EquityTooltip locale={locale} />}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        iconType="circle"
                        iconSize={8}
                      />
                      {/* Stacked area: equity + remainingBalance = propertyValue */}
                      <Area
                        type="monotone"
                        dataKey="equity"
                        name={t("chart.equity")}
                        stackId="equity"
                        fill="hsl(var(--chart-1))"
                        stroke="hsl(var(--chart-1))"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="remainingBalance"
                        name={t("chart.remainingBalance")}
                        stackId="equity"
                        fill="hsl(var(--chart-5))"
                        stroke="hsl(var(--chart-5))"
                        fillOpacity={0.4}
                      />
                      {/* Property value overlay */}
                      <Line
                        type="monotone"
                        dataKey="propertyValue"
                        name={t("chart.propertyValue")}
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="4 4"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>

          {/* Disclaimer */}
          <div
            role="note"
            className="flex items-start gap-3 rounded-2xl border-l-2 border-primary/40 bg-primary/[0.04] py-3 px-4 text-sm text-muted-foreground"
          >
            <AlertTriangle
              className="h-4 w-4 mt-0.5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p>{t("disclaimer")}</p>
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}
