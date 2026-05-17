"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft, Share2, TrendingUp, Home, Check, AlertCircle } from "lucide-react";
import { ExportPdfButton } from "@/components/pdf/ExportPdfButton";
import { ComparisonPdf } from "@/components/pdf/ComparisonPdf";
import { buildPdfFilename } from "@/lib/pdf";
import Link from "next/link";

import type { ScenarioInput, CompoundInput, RealEstateInput } from "@investio/shared/schemas";
import {
  calculateCompound,
  calculateRealEstate,
  compareScenarios,
  type ComparisonResult,
  type ScenarioComputed,
} from "@investio/shared/calc";
import { formatCurrency, formatPercent, formatCompact } from "@investio/shared/formatters";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { decodeScenarioFromUrl, encodeScenarioForUrl } from "@/lib/url-scenario";
import { defaultScenarioA, defaultScenarioB } from "@/lib/comparison-defaults";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppLocale = "cs" | "en";

// ---------------------------------------------------------------------------
// Helpers — compute ScenarioComputed from ScenarioInput
// ---------------------------------------------------------------------------

function computeScenario(input: ScenarioInput): ScenarioComputed {
  if (input.type === "compound") {
    const result = calculateCompound(input as CompoundInput);
    return {
      kind: "compound",
      horizonYears: input.horizonYears,
      initialCapital: input.initialAmount,
      result,
    };
  }
  // real_estate
  const reInput = input as RealEstateInput;
  const result = calculateRealEstate(reInput);
  return {
    kind: "real_estate",
    horizonYears: reInput.horizonYears,
    initialCapital: reInput.downPayment,
    result,
  };
}

// ---------------------------------------------------------------------------
// Recharts custom tooltip
// ---------------------------------------------------------------------------

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: number;
  locale: AppLocale;
  labelA: string;
  labelB: string;
};

function ComparisonTooltip({ active, payload, label, locale, labelA, labelB }: ChartTooltipProps) {
  const t = useTranslations("comparison");
  if (!active || !payload || payload.length === 0 || label === undefined) return null;

  const aVal = payload.find((p) => p.name === "a")?.value ?? 0;
  const bVal = payload.find((p) => p.name === "b")?.value ?? 0;
  const diff = aVal - bVal;

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-md text-sm tabular-nums min-w-48">
      <p className="font-medium mb-2 text-foreground">
        {t("chart.xAxis")} {label}
      </p>
      <p style={{ color: "#0d9488" }}>
        {labelA}: {formatCurrency(aVal, "CZK", locale)}
      </p>
      <p style={{ color: "#f59e0b" }} className="mb-1">
        {labelB}: {formatCurrency(bVal, "CZK", locale)}
      </p>
      <Separator className="my-1" />
      <p className="font-medium text-muted-foreground">
        {t("difference")}:{" "}
        <span className={diff >= 0 ? "text-[#0d9488]" : "text-[#f59e0b]"}>
          {diff >= 0 ? "+" : ""}
          {formatCurrency(diff, "CZK", locale)}
        </span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario card (one column)
// ---------------------------------------------------------------------------

type ScenarioCardProps = {
  input: ScenarioInput;
  finalValue: number;
  totalROI: number;
  horizonYears: number;
  label: string;
  colorClass: string;
  locale: AppLocale;
};

function ScenarioCard({
  input,
  finalValue,
  totalROI,
  horizonYears,
  label,
  colorClass,
  locale,
}: ScenarioCardProps) {
  const t = useTranslations("comparison");

  const isCompound = input.type === "compound";
  const compound = isCompound ? (input as CompoundInput) : null;
  const realestate = !isCompound ? (input as RealEstateInput) : null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block size-3 rounded-full ${colorClass}`}
            aria-hidden="true"
          />
          <CardTitle className="text-base font-semibold">{label}</CardTitle>
          <Badge variant="secondary" className="ml-auto text-xs">
            {isCompound
              ? t("scenarioTypes.compound")
              : t("scenarioTypes.real_estate")}
          </Badge>
        </div>
        {isCompound ? (
          <Home className="hidden" aria-hidden="true" />
        ) : (
          <TrendingUp className="hidden" aria-hidden="true" />
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Inputs read-only */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("inputs")}
          </p>
          <dl className="space-y-1 text-sm">
            {compound && (
              <>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Počáteční částka</dt>
                  <dd className="tabular-nums font-medium text-right">
                    {formatCurrency(compound.initialAmount, "CZK", locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Měsíční vklad</dt>
                  <dd className="tabular-nums font-medium text-right">
                    {formatCurrency(compound.monthlyContribution, "CZK", locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Roční výnos</dt>
                  <dd className="tabular-nums font-medium text-right">
                    {formatPercent(compound.annualReturnPct, locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Horizont</dt>
                  <dd className="tabular-nums font-medium text-right">
                    {compound.horizonYears} {t("years")}
                  </dd>
                </div>
              </>
            )}
            {realestate && (
              <>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Kupní cena</dt>
                  <dd className="tabular-nums font-medium text-right">
                    {formatCurrency(realestate.purchasePrice, "CZK", locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Vlastní kapitál</dt>
                  <dd className="tabular-nums font-medium text-right">
                    {formatCurrency(realestate.downPayment, "CZK", locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Měsíční nájem</dt>
                  <dd className="tabular-nums font-medium text-right">
                    {formatCurrency(realestate.monthlyRent, "CZK", locale)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Hypotéka</dt>
                  <dd className="tabular-nums font-medium text-right">
                    {formatPercent(realestate.mortgage.annualRatePct, locale)} /{" "}
                    {realestate.mortgage.termYears}r
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Horizont</dt>
                  <dd className="tabular-nums font-medium text-right">
                    {realestate.horizonYears} {t("years")}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <Separator />

        {/* Result */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("finalValueLabel")} ({horizonYears} {t("years")})
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {formatCurrency(finalValue, "CZK", locale)}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums mt-1">
            {t("roiLabel")}:{" "}
            <span className="font-medium">
              {totalROI >= 0 ? "+" : ""}
              {formatPercent(totalROI, locale)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Diff panel
// ---------------------------------------------------------------------------

type DiffPanelProps = {
  comparison: ComparisonResult;
  locale: AppLocale;
  labelA: string;
  labelB: string;
};

function DiffPanel({ comparison, locale, labelA, labelB }: DiffPanelProps) {
  const t = useTranslations("comparison");
  const { difference, a, b } = comparison;
  const { winnerKey, finalValueDelta, finalValueDeltaPct } = difference;

  const winnerLabel =
    winnerKey === "a" ? labelA : winnerKey === "b" ? labelB : t("tie");

  const winnerText =
    winnerKey === "a"
      ? t("winnerA")
      : winnerKey === "b"
        ? t("winnerB")
        : t("tie");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("diff.winner")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winner banner */}
        <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
          <span
            className={`text-xl ${winnerKey === "a" ? "text-[#0d9488]" : winnerKey === "b" ? "text-[#f59e0b]" : "text-muted-foreground"}`}
            aria-hidden="true"
          >
            {winnerKey === "tie" ? "=" : "▲"}
          </span>
          <div>
            <p className="font-semibold">{winnerText}</p>
            {winnerKey !== "tie" && (
              <p className="text-sm text-muted-foreground tabular-nums">
                {t("difference")}:{" "}
                {formatCurrency(Math.abs(finalValueDelta), "CZK", locale)} (
                {formatPercent(Math.abs(finalValueDeltaPct), locale)})
              </p>
            )}
          </div>
        </div>

        {/* 3-col table: A | B | Delta */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums" aria-label={t("diff.winner")}>
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-muted-foreground w-1/4" scope="col">
                  &nbsp;
                </th>
                <th
                  className="py-2 text-right font-medium text-[#0d9488] px-2 w-1/4"
                  scope="col"
                  style={{ color: "#0d9488" }}
                >
                  {labelA}
                </th>
                <th
                  className="py-2 text-right font-medium px-2 w-1/4"
                  scope="col"
                  style={{ color: "#f59e0b" }}
                >
                  {labelB}
                </th>
                <th
                  className="py-2 text-right font-medium text-muted-foreground w-1/4"
                  scope="col"
                >
                  Delta
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-2 text-muted-foreground">{t("diff.finalValue")}</td>
                <td className="py-2 text-right px-2">
                  {formatCurrency(a.finalValue, "CZK", locale)}
                </td>
                <td className="py-2 text-right px-2">
                  {formatCurrency(b.finalValue, "CZK", locale)}
                </td>
                <td className="py-2 text-right">
                  <span
                    className={
                      finalValueDelta >= 0 ? "text-[#0d9488]" : "text-[#f59e0b]"
                    }
                  >
                    {finalValueDelta >= 0 ? "+" : ""}
                    {formatCurrency(finalValueDelta, "CZK", locale)}
                  </span>
                </td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 text-muted-foreground">{t("diff.totalROI")}</td>
                <td className="py-2 text-right px-2">
                  {a.totalROI >= 0 ? "+" : ""}
                  {formatPercent(a.totalROI, locale)}
                </td>
                <td className="py-2 text-right px-2">
                  {b.totalROI >= 0 ? "+" : ""}
                  {formatPercent(b.totalROI, locale)}
                </td>
                <td className="py-2 text-right text-muted-foreground">—</td>
              </tr>
              <tr>
                <td className="py-2 text-muted-foreground">{t("diff.winner")}</td>
                <td
                  className="py-2 text-right px-2 font-medium"
                  colSpan={3}
                >
                  {winnerLabel}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------

type ComparisonChartProps = {
  comparison: ComparisonResult;
  locale: AppLocale;
  labelA: string;
  labelB: string;
};

function ComparisonChart({ comparison, locale, labelA, labelB }: ComparisonChartProps) {
  const t = useTranslations("comparison");
  const { a, b, horizonYears } = comparison;

  // Build data by year (sample every 12 months for up to 360 datapoints per series)
  // Use monthly data but sample every 12 for label clarity; for Recharts perf we keep monthly
  const data = useMemo(() => {
    const aMap = new Map(a.timeSeries.map((p) => [p.month, p.value]));
    const bMap = new Map(b.timeSeries.map((p) => [p.month, p.value]));
    const maxMonth = horizonYears * 12;
    const points: { month: number; year: number; a: number; b: number }[] = [];
    for (let m = 0; m <= maxMonth; m++) {
      const aVal = aMap.get(m) ?? 0;
      const bVal = bMap.get(m) ?? 0;
      points.push({ month: m, year: Math.round((m / 12) * 10) / 10, a: aVal, b: bVal });
    }
    return points;
  }, [a.timeSeries, b.timeSeries, horizonYears]);

  // X-axis ticks: every 5 years
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let y = 0; y <= horizonYears; y += 5) {
      ticks.push(y * 12);
    }
    return ticks;
  }, [horizonYears]);

  const formatXAxis = (month: number) => `${month / 12}r`;
  const formatYAxis = (value: number) => formatCompact(value, locale);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("chart.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
          >
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
              label={{
                value: t("chart.xAxis"),
                position: "insideBottom",
                offset: -2,
                fontSize: 11,
              }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <RechartsTooltip
              content={
                <ComparisonTooltip
                  locale={locale}
                  labelA={labelA}
                  labelB={labelB}
                />
              }
            />
            <Legend
              iconType="circle"
              formatter={(value: string) => {
                if (value === "a") return labelA;
                if (value === "b") return labelB;
                return value;
              }}
            />
            <Line
              type="monotone"
              dataKey="a"
              stroke="#0d9488"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="b"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Invalid link state
// ---------------------------------------------------------------------------

function InvalidLinkState() {
  const t = useTranslations("comparison");
  const locale = useLocale();

  return (
    <div className="flex flex-col items-center justify-center min-h-96 gap-6 text-center px-4">
      <AlertCircle className="size-12 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground max-w-md">
          {t("invalidLink.description")}
        </p>
      </div>
      <Link
        href={`/${locale}/calc/compound`}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("invalidLink.backButton")}
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share button
// ---------------------------------------------------------------------------

type ShareButtonProps = {
  urlA: string;
  urlB: string;
};

function ShareButton({ urlA, urlB }: ShareButtonProps) {
  const t = useTranslations("comparison");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("a", urlA);
    url.searchParams.set("b", urlB);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API not available or denied — no-op
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? (
        <>
          <Check className="size-4 mr-2" aria-hidden="true" />
          {t("shareCopied")}
        </>
      ) : (
        <>
          <Share2 className="size-4 mr-2" aria-hidden="true" />
          {t("share")}
        </>
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Inner component that reads searchParams (must be in Suspense)
// ---------------------------------------------------------------------------

function ComparePageInner() {
  const t = useTranslations("comparison");
  const tPdf = useTranslations("pdf");
  const locale = useLocale() as AppLocale;
  const searchParams = useSearchParams();

  // Decode query params on mount
  const [inputA, setInputA] = useState<ScenarioInput | null>(null);
  const [inputB, setInputB] = useState<ScenarioInput | null>(null);
  const [parseError, setParseError] = useState(false);
  const [urlParamA, setUrlParamA] = useState<string>("");
  const [urlParamB, setUrlParamB] = useState<string>("");

  useEffect(() => {
    const rawA = searchParams.get("a");
    const rawB = searchParams.get("b");

    if (!rawA && !rawB) {
      // No params — use defaults
      setInputA(defaultScenarioA);
      setInputB(defaultScenarioB);
      setUrlParamA(encodeScenarioForUrl(defaultScenarioA));
      setUrlParamB(encodeScenarioForUrl(defaultScenarioB));
      return;
    }

    const decodedA = rawA ? decodeScenarioFromUrl(rawA) : null;
    const decodedB = rawB ? decodeScenarioFromUrl(rawB) : null;

    if ((rawA && !decodedA) || (rawB && !decodedB)) {
      setParseError(true);
      return;
    }

    setInputA(decodedA ?? defaultScenarioA);
    setInputB(decodedB ?? defaultScenarioB);
    setUrlParamA(rawA ?? encodeScenarioForUrl(defaultScenarioA));
    setUrlParamB(rawB ?? encodeScenarioForUrl(defaultScenarioB));
    setParseError(false);
  }, [searchParams]);

  // Compute scenarios + comparison (memoized — up to 720 data points)
  const comparison = useMemo<ComparisonResult | null>(() => {
    if (!inputA || !inputB) return null;
    try {
      const compA = computeScenario(inputA);
      const compB = computeScenario(inputB);
      return compareScenarios(compA, compB);
    } catch {
      return null;
    }
  }, [inputA, inputB]);

  if (parseError) {
    return (
      <main id="main" className="min-h-screen bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-primary focus:text-primary-foreground"
        >
          Přeskočit na obsah
        </a>
        <div className="max-w-6xl mx-auto px-4 py-8" id="main-content">
          <InvalidLinkState />
        </div>
      </main>
    );
  }

  if (!comparison || !inputA || !inputB) {
    // Loading — inputs not yet parsed (effect hasn't run)
    return (
      <main id="main" className="min-h-screen bg-background text-foreground">
        <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-48" />
          <div className="h-80 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </main>
    );
  }

  const labelA = t("scenarioA");
  const labelB = t("scenarioB");

  return (
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
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <ArrowLeft className="size-4" aria-hidden="true" />
              <Link
                href={`/${locale}`}
                className="hover:text-foreground transition-colors"
              >
                {t("backToDashboard")}
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("commonHorizon")}: {comparison.horizonYears} {t("years")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton urlA={urlParamA} urlB={urlParamB} />
            <ExportPdfButton
              label={tPdf("exportButton")}
              filename={buildPdfFilename("comparison")}
              documentFactory={() => (
                <ComparisonPdf
                  inputA={inputA}
                  inputB={inputB}
                  comparison={comparison}
                  locale={locale}
                  labels={{
                    title: tPdf("title.comparison"),
                    generatedOn: tPdf("generatedOn"),
                    sections: {
                      inputs: tPdf("sections.inputs"),
                      results: tPdf("sections.results"),
                      chart: tPdf("sections.chart"),
                      comparisonA: tPdf("sections.comparisonA"),
                      comparisonB: tPdf("sections.comparisonB"),
                      diff: tPdf("sections.diff"),
                    },
                    fields: {
                      winner: tPdf("fields.winner"),
                      finalValueA: tPdf("fields.finalValueA"),
                      finalValueB: tPdf("fields.finalValueB"),
                      roiA: tPdf("fields.roiA"),
                      roiB: tPdf("fields.roiB"),
                      delta: tPdf("fields.delta"),
                      horizonYears: tPdf("fields.horizonYears"),
                    },
                    table: {
                      year: tPdf("table.year"),
                      scenarioA: tPdf("table.scenarioA"),
                      scenarioB: tPdf("table.scenarioB"),
                      delta: tPdf("fields.delta"),
                    },
                    winnerA: t("winnerA"),
                    winnerB: t("winnerB"),
                    tie: t("tie"),
                    disclaimer: tPdf("disclaimer"),
                  }}
                />
              )}
            />
          </div>
        </div>

        {/* Common chart — full width */}
        <div className="mb-6">
          <ComparisonChart
            comparison={comparison}
            locale={locale}
            labelA={labelA}
            labelB={labelB}
          />
        </div>

        {/* Side-by-side scenario cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ScenarioCard
            input={inputA}
            finalValue={comparison.a.finalValue}
            totalROI={comparison.a.totalROI}
            horizonYears={comparison.horizonYears}
            label={labelA}
            colorClass="bg-[#0d9488]"
            locale={locale}
          />
          <ScenarioCard
            input={inputB}
            finalValue={comparison.b.finalValue}
            totalROI={comparison.b.totalROI}
            horizonYears={comparison.horizonYears}
            label={labelB}
            colorClass="bg-[#f59e0b]"
            locale={locale}
          />
        </div>

        {/* Diff panel */}
        <DiffPanel
          comparison={comparison}
          locale={locale}
          labelA={labelA}
          labelB={labelB}
        />

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground px-1 mt-6">
          ⚠ Zjednodušený model. Nemovitost: equity + kumulativní cashflow. Akcie:
          bez daně z prodeje. Normalizovaný horizont: {comparison.horizonYears} let.
        </p>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Page export — wrapped in Suspense required by Next.js for useSearchParams
// ---------------------------------------------------------------------------

function ComparePageSkeleton() {
  return (
    <main id="main" className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="h-4 bg-muted rounded w-48" />
        <div className="h-80 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparePageSkeleton />}>
      <ComparePageInner />
    </Suspense>
  );
}
