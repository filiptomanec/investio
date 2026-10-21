import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchCzechInflation,
  formatCurrency,
  solveMonthlyForTargetIncome,
  type SupportedLocale,
} from "@investio/shared";
import { Layout } from "@/components/layout";
import { NumField } from "@/components/num-field";
import { PageHeader, Panel, PanelHeader } from "@/components/page-header";
import { ResetButton } from "@/components/reset-button";
import { usePersistedState } from "@/hooks/use-persisted-state";

export const Route = createFileRoute("/renta")({
  head: () => ({
    meta: [
      { title: "Investio — Kalkulačka renty (kolik investovat měsíčně)" },
      {
        name: "description",
        content:
          "Zadejte požadovanou rentu v dnešních cenách a spočítejte, kolik musíte měsíčně investovat, abyste jí dosáhli.",
      },
      { property: "og:title", content: "Investio — Kalkulačka renty" },
      {
        property: "og:description",
        content: "Cílová renta v dnešních cenách, doba spoření, úrok a inflace.",
      },
    ],
  }),
  component: RentaCalculator,
});

const DEFAULTS = {
  target: 40000,
  years: 25,
  rate: 7,
  inflation: 3.2,
  withdrawal: 4,
  initial: 0,
};

function RentaCalculator() {
  const { t, i18n } = useTranslation();
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "cs";
  const fmt = (n: number) => formatCurrency(n, locale);
  const fmtPct = (n: number) =>
    new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Number.isFinite(n) ? n : 0);
  const currencySuffix = locale === "cs" ? "Kč" : "$";

  const [target, setTarget] = usePersistedState("investio.renta.target", DEFAULTS.target);
  const [years, setYears] = usePersistedState("investio.renta.years", DEFAULTS.years);
  const [rate, setRate] = usePersistedState("investio.renta.rate", DEFAULTS.rate);
  const [inflation, setInflation] = usePersistedState(
    "investio.renta.inflation",
    DEFAULTS.inflation,
  );
  const [withdrawal, setWithdrawal] = usePersistedState(
    "investio.renta.withdrawal",
    DEFAULTS.withdrawal,
  );
  const [initial, setInitial] = usePersistedState("investio.renta.initial", DEFAULTS.initial);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ from: number; to: number; n: number } | null>(null);

  function reset() {
    setTarget(DEFAULTS.target);
    setYears(DEFAULTS.years);
    setRate(DEFAULTS.rate);
    setInflation(DEFAULTS.inflation);
    setWithdrawal(DEFAULTS.withdrawal);
    setInitial(DEFAULTS.initial);
    setMeta(null);
    setError(null);
  }

  const result = useMemo(
    () =>
      solveMonthlyForTargetIncome({
        targetMonthlyToday: target,
        years,
        annualRatePct: rate,
        inflationPct: inflation,
        withdrawalRatePct: withdrawal,
        initial,
      }),
    [target, years, rate, inflation, withdrawal, initial],
  );

  const required = Math.max(0, result.requiredMonthly);
  const unreachable = result.requiredMonthly < 0;
  const nominalMonthly = (result.requiredNominalPortfolio * (withdrawal / 100)) / 12;

  async function loadInflation() {
    setLoading(true);
    setError(null);
    try {
      const { averagePct, samples } = await fetchCzechInflation(years);
      setInflation(Math.round(averagePct * 10) / 10);
      setMeta({
        from: samples[0].year,
        to: samples[samples.length - 1].year,
        n: samples.length,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("inflation.error"));
    } finally {
      setLoading(false);
    }
  }

  // The chain from the income you want to the contribution it takes. Each
  // step's value feeds the next, so the ladder is the calculation itself.
  const ladder = [
    {
      label: t("renta.ladderAnnual"),
      note: t("renta.ladderAnnualNote", { target: fmt(target) }),
      value: fmt(target * 12),
    },
    {
      label: t("renta.ladderReal"),
      note: t("renta.ladderRealNote", { withdrawal: fmtPct(withdrawal) }),
      value: fmt(result.requiredRealPortfolio),
    },
    {
      label: t("renta.ladderNominal"),
      note: t("renta.ladderNominalNote", { inflation: fmtPct(inflation) }),
      value: fmt(result.requiredNominalPortfolio),
    },
    {
      label: t("renta.ladderMonthly"),
      note:
        t("renta.ladderMonthlyNote", { rate: fmtPct(rate) }) +
        (initial > 0 ? ` · ${t("renta.ladderInitialNote", { initial: fmt(initial) })}` : ""),
      value: fmt(required),
      answer: true,
    },
  ];

  return (
    <Layout>
      <PageHeader
        title={t("renta.title")}
        subtitle={t("renta.subtitle")}
        actions={<ResetButton onClick={reset} />}
      />

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        <Panel className="lg:col-span-4 lg:sticky lg:top-6 p-5">
          <div className="space-y-4">
            <NumField
              label={t("renta.targetMonthly")}
              info={t("renta.targetMonthlyTooltip")}
              infoLabel={t("renta.targetMonthlyInfo")}
              value={target}
              onChange={setTarget}
              suffix={currencySuffix}
              step={1000}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumField
                label={t("form.annualRate")}
                value={rate}
                onChange={(v) => setRate(Math.max(0, Math.min(100, v)))}
                suffix={t("units.pct")}
                step={0.1}
              />
              <NumField
                label={t("renta.yearsToRetirement")}
                value={years}
                onChange={(v) => setYears(Math.max(1, Math.min(60, Math.round(v))))}
                suffix={t("units.years")}
                step={1}
                min={1}
                max={60}
              />
            </div>
            <NumField
              label={t("renta.initialOptional")}
              value={initial}
              onChange={setInitial}
              suffix={currencySuffix}
              step={10000}
            />
          </div>

          <div className="mt-5 pt-4 border-t border-border space-y-3">
            <NumField
              label={t("form.expectedInflation")}
              value={inflation}
              onChange={setInflation}
              suffix={t("units.pct")}
              step={0.1}
            />
            <button
              type="button"
              onClick={loadInflation}
              disabled={loading}
              className="w-full h-9 inline-flex items-center justify-center gap-2 text-sm font-medium px-3 rounded-md border border-input bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5 text-muted-foreground" />
              )}
              {t("inflation.loadButton", { years })}
            </button>
            {meta && !error && (
              <p className="text-xs text-muted-foreground">
                {t("inflation.source", { from: meta.from, to: meta.to, n: meta.n })}
              </p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <NumField
              label={t("renta.withdrawalRateLabel")}
              info={t("renta.withdrawalRateTooltip")}
              value={withdrawal}
              onChange={(v) => setWithdrawal(Math.max(0.5, Math.min(20, v)))}
              suffix={t("units.pctPerYear")}
              step={0.1}
            />
          </div>
        </Panel>

        <section className="lg:col-span-8 space-y-4 lg:space-y-6">
          <Panel>
            <div className="p-5 md:p-6">
              <p className="text-[13px] font-medium text-muted-foreground">
                {t("renta.requiredMonthlyLabel")}
              </p>
              <p
                className={`mt-1 text-[34px] md:text-[36px] leading-none font-semibold tracking-[-0.02em] tabular-nums ${
                  unreachable ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {unreachable ? fmt(0) : fmt(required)}
              </p>
              <p className="mt-3 text-sm text-muted-foreground max-w-xl">
                {unreachable
                  ? t("renta.unreachable")
                  : t("renta.afterYears", { years, target: fmt(target) })}
              </p>
            </div>
            {!unreachable && (
              <dl className="border-t border-border px-5 md:px-6 py-4">
                <dt className="text-[13px] font-medium text-muted-foreground">
                  {t("renta.nominalMonthlyLabel")}
                </dt>
                <dd className="mt-1 text-[22px] leading-tight font-semibold text-foreground tabular-nums">
                  {fmt(nominalMonthly)}
                </dd>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {t("renta.nominalMonthlyDesc", { years, inflation: fmtPct(inflation) })}
                </dd>
              </dl>
            )}
          </Panel>

          <Panel className="p-5 md:p-6">
            <PanelHeader title={t("renta.howItWorks")} />
            <ol className="mt-4">
              {ladder.map((step, i) => (
                <li
                  key={step.label}
                  className="relative grid grid-cols-[20px_1fr_auto] gap-x-3 items-start py-3 first:pt-1 last:pb-0"
                >
                  {/* The rail: each step is one dot on a line, the answer in mint. */}
                  <span
                    aria-hidden="true"
                    className={`relative z-10 mt-1.5 size-2.5 rounded-full justify-self-center ${
                      step.answer ? "bg-brand" : "bg-card ring-2 ring-foreground/70"
                    }`}
                  />
                  {i < ladder.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[9px] top-[22px] -bottom-[10px] w-0.5 bg-border"
                    />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm ${step.answer ? "font-semibold text-foreground" : "text-foreground"}`}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.note}</p>
                  </div>
                  <p
                    className={`text-right tabular-nums whitespace-nowrap ${
                      step.answer
                        ? "text-lg font-semibold text-foreground"
                        : "text-[15px] text-foreground"
                    }`}
                  >
                    {step.value}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </section>
      </main>
    </Layout>
  );
}
