"use client";

import {
  useDeferredValue,
  useMemo,
} from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { useTranslations, useLocale } from "next-intl";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { CompoundInputSchema, type CompoundInput } from "@investio/shared/schemas";
import { calculateCompound, type CompoundResult } from "@investio/shared/calc";
import { formatCurrency, formatCompact } from "@investio/shared/formatters";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExportPdfButton } from "@/components/pdf/ExportPdfButton";
import { CompoundPdf } from "@/components/pdf/CompoundPdf";
import { buildPdfFilename } from "@/lib/pdf";

// -----------------------------------------------------------------------
// Form values type — annualReturnPct stored as percent (e.g. 7 = 7%)
// so the input shows a human-readable number.
// Converted to decimal before passing to calculateCompound.
// -----------------------------------------------------------------------
type FormValues = Omit<CompoundInput, "annualReturnPct"> & {
  annualReturnPct: number; // user-facing: 7 means 7%
};

// Custom resolver — validates after converting annualReturnPct % → decimal
const compoundResolver: Resolver<FormValues> = async (values) => {
  const normalized: CompoundInput = {
    ...values,
    annualReturnPct: (values.annualReturnPct ?? 0) / 100,
  };
  const result = CompoundInputSchema.safeParse(normalized);
  if (result.success) {
    // Return form values (not normalized) so form stays in % display
    return { values: values as FormValues, errors: {} };
  }
  const errors: Record<string, { type: string; message: string }> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (path && !errors[path]) {
      errors[path] = { type: issue.code, message: issue.message };
    }
  }
  return { values: {}, errors };
};

// -----------------------------------------------------------------------
// Default values (S&P 500–like preset)
// annualReturnPct stored as percent (7 = 7%) in form, converted below
// -----------------------------------------------------------------------
const DEFAULT_VALUES: FormValues = {
  type: "compound",
  initialAmount: 100_000,
  monthlyContribution: 5_000,
  annualReturnPct: 7, // 7%
  horizonYears: 30,
  contributionTiming: "end",
};

// -----------------------------------------------------------------------
// Recharts custom tooltip
// -----------------------------------------------------------------------
type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: number;
  formatValue: (v: number) => string;
  labelMonth: string;
  labelContributions: string;
  labelGains: string;
};

function ChartTooltipContent({
  active,
  payload,
  label,
  formatValue,
  labelMonth,
  labelContributions,
  labelGains,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const contributions = payload.find((p) => p.name === "contributions")?.value ?? 0;
  const gains = payload.find((p) => p.name === "gains")?.value ?? 0;
  const year = label ? Math.ceil(label / 12) : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-sm tabular-nums">
      <p className="font-medium mb-1">
        {labelMonth} {label} ({year}r)
      </p>
      <p style={{ color: "hsl(215 16% 47%)" }}>
        {labelContributions}: {formatValue(contributions)}
      </p>
      <p style={{ color: "hsl(174 77% 32%)" }}>
        {labelGains}: {formatValue(gains)}
      </p>
      <p className="font-semibold mt-1">
        Total: {formatValue(contributions + gains)}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------
// Results panel
// -----------------------------------------------------------------------
type ResultsPanelProps = {
  result: CompoundResult;
  locale: string;
};

function ResultsPanel({ result, locale }: ResultsPanelProps) {
  const t = useTranslations("calc.compound");
  const loc = locale as "cs" | "en";

  const { finalValue, totalContributions, totalGains } = result;
  const gainsPct = totalContributions > 0 ? totalGains / totalContributions : 0;

  return (
    <div className="space-y-4">
      {/* Hero number */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">{t("results.finalValue")}</p>
        <p
          className="text-3xl font-bold tabular-nums text-primary"
          aria-live="polite"
        >
          {formatCurrency(finalValue, "CZK", loc)}
        </p>
      </div>

      {/* Breakdown grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-1">{t("results.totalContributions")}</p>
          <p className="font-semibold tabular-nums text-sm">
            {formatCurrency(totalContributions, "CZK", loc)}
          </p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-1">{t("results.totalGains")}</p>
          <p className="font-semibold tabular-nums text-sm text-success">
            {formatCurrency(totalGains, "CZK", loc)}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            +{formatCompact(gainsPct * 100, loc)} %
          </p>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Compound chart
// -----------------------------------------------------------------------
type CompoundChartProps = {
  timeSeries: CompoundResult["timeSeries"];
  locale: string;
};

function CompoundChart({ timeSeries, locale }: CompoundChartProps) {
  const t = useTranslations("calc.compound");
  const loc = locale as "cs" | "en";

  const data = useMemo(
    () =>
      timeSeries.map(({ month, contributions, value }) => ({
        month,
        contributions,
        gains: Math.max(0, value - contributions),
      })),
    [timeSeries]
  );

  // X-axis: show every 60 months (5 years)
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let m = 0; m <= (timeSeries.at(-1)?.month ?? 0); m += 60) {
      ticks.push(m);
    }
    return ticks;
  }, [timeSeries]);

  const formatYAxis = (value: number) => formatCompact(value, loc);
  const formatXAxis = (month: number) => {
    const year = month / 12;
    return `${year}r`;
  };

  if (timeSeries.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Vyplňte vstupy pro zobrazení grafu
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(215 16% 47%)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="hsl(215 16% 47%)" stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="colorGains" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(174 77% 32%)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(174 77% 32%)" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="hsl(214 32% 91%)"
        />
        <XAxis
          dataKey="month"
          ticks={xTicks}
          tickFormatter={formatXAxis}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <RechartsTooltip
          content={
            <ChartTooltipContent
              formatValue={(v) => formatCurrency(v, "CZK", loc)}
              labelMonth={t("chart.month")}
              labelContributions={t("chart.contributions")}
              labelGains={t("chart.gains")}
            />
          }
        />
        <Legend
          iconType="square"
          formatter={(value: string) => {
            if (value === "contributions") return t("chart.contributions");
            if (value === "gains") return t("chart.gains");
            return value;
          }}
        />
        <Area
          type="monotone"
          dataKey="contributions"
          stackId="1"
          stroke="hsl(215 16% 47%)"
          fill="url(#colorContributions)"
          strokeWidth={1.5}
          isAnimationActive
          animationDuration={500}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="gains"
          stackId="1"
          stroke="hsl(174 77% 32%)"
          fill="url(#colorGains)"
          strokeWidth={1.5}
          isAnimationActive
          animationDuration={500}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// -----------------------------------------------------------------------
// Form field wrapper
// -----------------------------------------------------------------------
type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  suffix?: string;
  children: React.ReactNode;
  htmlFor?: string;
};

function Field({ label, error, hint, suffix, children, htmlFor }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        {children}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// Main page component
// -----------------------------------------------------------------------
export default function CompoundCalcPage() {
  const t = useTranslations("calc.compound");
  const tPdf = useTranslations("pdf");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: compoundResolver,
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  // Watch all form values for live recalc
  const watchedValues = watch();

  // Defer the calc to avoid blocking typing
  const deferredValues = useDeferredValue(watchedValues);

  // Calculate result whenever deferred values change
  const result = useMemo<CompoundResult | null>(() => {
    // Convert annualReturnPct from user-facing % to decimal for schema
    const normalized: CompoundInput = {
      ...deferredValues,
      annualReturnPct: (deferredValues.annualReturnPct ?? 0) / 100,
    };
    const parsed = CompoundInputSchema.safeParse(normalized);
    if (!parsed.success) return null;
    try {
      return calculateCompound(parsed.data);
    } catch {
      return null;
    }
  }, [deferredValues]);

  // Fallback result using defaults for initial render
  const defaultCalcInput: CompoundInput = {
    ...DEFAULT_VALUES,
    annualReturnPct: DEFAULT_VALUES.annualReturnPct / 100,
  };
  const displayResult = result ?? calculateCompound(defaultCalcInput);

  return (
    <TooltipProvider>
      <main
        id="main"
        className="min-h-screen bg-background text-foreground"
        aria-label={t("title")}
      >
        {/* Skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-primary focus:text-primary-foreground"
        >
          Přeskočit na obsah
        </a>

        <div className="max-w-6xl mx-auto px-4 py-8" id="main-content">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>

          {/* Two-column layout: form left, results+chart right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── FORM COLUMN ── */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vstupy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" noValidate aria-label="Kalkulačka vstupů">
                  {/* Initial amount */}
                  <Field
                    label={t("fields.initialAmount")}
                    suffix="Kč"
                    error={errors.initialAmount?.message}
                    htmlFor="initialAmount"
                  >
                    <Input
                      id="initialAmount"
                      type="number"
                      min={0}
                      step={1000}
                      className="pr-10 tabular-nums"
                      aria-describedby={errors.initialAmount ? "initialAmount-error" : undefined}
                      {...register("initialAmount", { valueAsNumber: true })}
                    />
                  </Field>

                  {/* Monthly contribution */}
                  <Field
                    label={t("fields.monthlyContribution")}
                    suffix="Kč"
                    error={errors.monthlyContribution?.message}
                    htmlFor="monthlyContribution"
                  >
                    <Input
                      id="monthlyContribution"
                      type="number"
                      min={0}
                      step={500}
                      className="pr-10 tabular-nums"
                      {...register("monthlyContribution", { valueAsNumber: true })}
                    />
                  </Field>

                  {/* Annual return */}
                  <Field
                    label={t("fields.annualReturnPct")}
                    suffix="%"
                    error={errors.annualReturnPct?.message}
                    htmlFor="annualReturnPct"
                    hint="Zadejte jako číslo, např. 7 pro 7 %"
                  >
                    <Input
                      id="annualReturnPct"
                      type="number"
                      min={-100}
                      max={100}
                      step={0.1}
                      className="pr-10 tabular-nums"
                      {...register("annualReturnPct", { valueAsNumber: true })}
                    />
                  </Field>

                  {/* Horizon */}
                  <Field
                    label={t("fields.horizonYears")}
                    suffix="let"
                    error={errors.horizonYears?.message}
                    htmlFor="horizonYears"
                  >
                    <Input
                      id="horizonYears"
                      type="number"
                      min={1}
                      max={50}
                      step={1}
                      className="pr-10 tabular-nums"
                      {...register("horizonYears", { valueAsNumber: true })}
                    />
                  </Field>

                  {/* Contribution timing */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="contributionTiming" className="text-sm font-medium">
                        {t("fields.contributionTiming.label")}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger
                          aria-label="Informace o načasování vkladu"
                          className="inline-flex items-center justify-center size-4 rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="text-xs">ⓘ</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Konec měsíce: vklad se zhodnocuje od příštího měsíce.
                            Začátek měsíce: vklad se zhodnocuje okamžitě.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Controller
                      control={control}
                      name="contributionTiming"
                      render={({ field }) => (
                        <select
                          id="contributionTiming"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          <option value="end">{t("fields.contributionTiming.end")}</option>
                          <option value="begin">{t("fields.contributionTiming.begin")}</option>
                        </select>
                      )}
                    />
                  </div>

                  {/* Disabled save button — T-013 */}
                  <div className="pt-2 flex flex-col gap-2">
                    <Tooltip>
                      <TooltipTrigger className="w-full">
                        <Button
                          disabled
                          variant="outline"
                          className="w-full pointer-events-none"
                          aria-disabled="true"
                        >
                          {tCommon("save")} (soon)
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Uložit scénář – připojí se v T-013 (dashboard)</p>
                      </TooltipContent>
                    </Tooltip>
                    <ExportPdfButton
                      label={tPdf("exportButton")}
                      filename={buildPdfFilename("compound")}
                      documentFactory={() => {
                        const input: import("@investio/shared/schemas").CompoundInput = {
                          ...deferredValues,
                          annualReturnPct: (deferredValues.annualReturnPct ?? 0) / 100,
                        };
                        return (
                          <CompoundPdf
                            input={input}
                            result={displayResult}
                            locale={locale as "cs" | "en"}
                            labels={{
                              title: tPdf("title.compound"),
                              generatedOn: tPdf("generatedOn"),
                              sections: {
                                inputs: tPdf("sections.inputs"),
                                results: tPdf("sections.results"),
                                chart: tPdf("sections.chart"),
                              },
                              fields: {
                                initialAmount: t("fields.initialAmount"),
                                monthlyContribution: t("fields.monthlyContribution"),
                                annualReturnPct: t("fields.annualReturnPct"),
                                horizonYears: t("fields.horizonYears"),
                                contributionTiming: t("fields.contributionTiming.label"),
                                finalValue: t("results.finalValue"),
                                totalContributions: t("results.totalContributions"),
                                totalGains: t("results.totalGains"),
                              },
                              table: {
                                year: tPdf("table.year"),
                                contributions: tPdf("table.contributions"),
                                value: tPdf("table.value"),
                                gains: tPdf("table.gains"),
                              },
                              contributionTimingBegin: t("fields.contributionTiming.begin"),
                              contributionTimingEnd: t("fields.contributionTiming.end"),
                              disclaimer: tPdf("disclaimer"),
                            }}
                          />
                        );
                      }}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* ── RESULTS + CHART COLUMN ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Results panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Výsledek
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResultsPanel result={displayResult} locale={locale} />
                </CardContent>
              </Card>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Průběh investice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CompoundChart
                    timeSeries={displayResult.timeSeries}
                    locale={locale}
                  />
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground px-1">
                ⚠ {t("disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}
