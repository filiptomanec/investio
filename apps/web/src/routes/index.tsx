import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Info, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  calculateInvestment,
  fetchCzechInflation,
  formatCurrency,
  type SupportedLocale,
} from "@investio/shared";
import { Layout } from "@/components/layout";
import { NumField } from "@/components/num-field";
import { ProjectionView } from "@/components/projection-view";
import { ResetButton } from "@/components/reset-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePersistedState } from "@/hooks/use-persisted-state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Investio — Investiční kalkulačka složeného úročení" },
      {
        name: "description",
        content:
          "Spočítej budoucí hodnotu investic se složeným úročením, inflací, indexací vkladů a pasivní rentou.",
      },
      { property: "og:title", content: "Investio — Investice" },
      {
        property: "og:description",
        content:
          "Základní i rozšířený režim: počáteční vklad, měsíční vklad, úrok, doba, inflace a renta.",
      },
    ],
  }),
  component: InvestmentCalculator,
});

type Mode = "basic" | "advanced";

const DEFAULTS = {
  initial: 100000,
  monthly: 5000,
  rate: 7,
  years: 20,
  inflation: 3.2,
  inflationEnabled: true,
  indexContributions: false,
  withdrawalRate: 4,
};

function InvestmentCalculator() {
  const { t, i18n } = useTranslation();
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "cs";
  const fmt = (n: number) => formatCurrency(n, locale);
  const fmtPct = (n: number) =>
    new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Number.isFinite(n) ? n : 0);
  const currencySuffix = locale === "cs" ? "Kč" : "$";

  const [mode, setMode] = usePersistedState<Mode>("investio.inv.mode", "basic");
  const [initial, setInitial] = usePersistedState("investio.inv.initial", DEFAULTS.initial);
  const [monthly, setMonthly] = usePersistedState("investio.inv.monthly", DEFAULTS.monthly);
  const [rate, setRate] = usePersistedState("investio.inv.rate", DEFAULTS.rate);
  const [years, setYears] = usePersistedState("investio.inv.years", DEFAULTS.years);
  const [inflation, setInflation] = usePersistedState(
    "investio.inv.inflation",
    DEFAULTS.inflation,
  );
  const [inflationEnabled, setInflationEnabled] = usePersistedState(
    "investio.inv.inflationEnabled",
    DEFAULTS.inflationEnabled,
  );
  const [indexContributions, setIndexContributions] = usePersistedState(
    "investio.inv.indexContributions",
    DEFAULTS.indexContributions,
  );
  const [withdrawalRate, setWithdrawalRate] = usePersistedState(
    "investio.inv.withdrawalRate",
    DEFAULTS.withdrawalRate,
  );

  const [loadingInflation, setLoadingInflation] = useState(false);
  const [inflationError, setInflationError] = useState<string | null>(null);
  const [inflationMeta, setInflationMeta] = useState<{
    from: number;
    to: number;
    n: number;
  } | null>(null);

  const isAdvanced = mode === "advanced";
  const effectiveInflation = isAdvanced && inflationEnabled ? inflation : 0;
  const showReal = isAdvanced && inflationEnabled;

  function reset() {
    setInitial(DEFAULTS.initial);
    setMonthly(DEFAULTS.monthly);
    setRate(DEFAULTS.rate);
    setYears(DEFAULTS.years);
    setInflation(DEFAULTS.inflation);
    setInflationEnabled(DEFAULTS.inflationEnabled);
    setIndexContributions(DEFAULTS.indexContributions);
    setWithdrawalRate(DEFAULTS.withdrawalRate);
    setInflationMeta(null);
    setInflationError(null);
  }

  const result = useMemo(
    () =>
      calculateInvestment({
        initial,
        monthly,
        annualRatePct: rate,
        years,
        inflationPct: effectiveInflation,
        increaseMonthlyWithInflation: showReal && indexContributions,
      }),
    [initial, monthly, rate, years, effectiveInflation, showReal, indexContributions],
  );

  const profit = result.finalNominal - result.totalContributions;
  const annualWithdrawalNominal = result.finalNominal * (withdrawalRate / 100);
  const monthlyWithdrawalNominal = annualWithdrawalNominal / 12;
  const annualWithdrawalReal = result.finalReal * (withdrawalRate / 100);
  const monthlyWithdrawalReal = annualWithdrawalReal / 12;

  async function loadInflation() {
    setLoadingInflation(true);
    setInflationError(null);
    try {
      const { averagePct, samples } = await fetchCzechInflation(years);
      setInflation(Math.round(averagePct * 10) / 10);
      setInflationEnabled(true);
      setInflationMeta({
        from: samples[0].year,
        to: samples[samples.length - 1].year,
        n: samples.length,
      });
    } catch (e) {
      setInflationError(e instanceof Error ? e.message : t("inflation.error"));
    } finally {
      setLoadingInflation(false);
    }
  }

  return (
    <Layout>
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="text-lg font-semibold text-foreground">{t("investice.title")}</h1>
              <ResetButton onClick={reset} />
            </div>
            <p className="text-xs text-muted-foreground mb-5">{t("investice.subtitle")}</p>

            <ModeToggle mode={mode} onChange={setMode} />

            <div className="space-y-5 mt-6">
              <NumField
                label={t("form.initialDeposit")}
                value={initial}
                onChange={setInitial}
                suffix={currencySuffix}
                step={1000}
              />
              <NumField
                label={t("form.monthlyContribution")}
                value={monthly}
                onChange={setMonthly}
                suffix={currencySuffix}
                step={500}
              />
              <div className="grid grid-cols-2 gap-4">
                <NumField
                  label={t("form.annualRate")}
                  value={rate}
                  onChange={setRate}
                  suffix={t("units.pct")}
                  step={0.1}
                />
                <NumField
                  label={t("form.duration")}
                  value={years}
                  onChange={(v) => setYears(Math.max(1, Math.min(60, Math.round(v))))}
                  suffix={t("units.years")}
                  step={1}
                  min={1}
                  max={60}
                />
              </div>

              {isAdvanced && (
                <>
                  <div className="pt-4 border-t border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="inflation-toggle"
                        className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                      >
                        {t("form.enableInflation")}
                      </label>
                      <button
                        id="inflation-toggle"
                        type="button"
                        role="switch"
                        aria-checked={inflationEnabled}
                        onClick={() => setInflationEnabled((v) => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          inflationEnabled ? "bg-brand" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
                            inflationEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {inflationEnabled && (
                      <>
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
                          disabled={loadingInflation}
                          className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-surface hover:bg-muted text-foreground transition-colors disabled:opacity-60"
                        >
                          {loadingInflation ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="size-3.5" />
                          )}
                          {t("inflation.loadButton", { years })}
                        </button>
                        {inflationMeta && !inflationError && (
                          <p className="text-[11px] text-muted-foreground">
                            {t("inflation.source", {
                              from: inflationMeta.from,
                              to: inflationMeta.to,
                              n: inflationMeta.n,
                            })}
                          </p>
                        )}
                        {inflationError && (
                          <p className="text-[11px] text-destructive">{inflationError}</p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor="index-toggle"
                            className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                          >
                            {t("advanced.indexContributions")}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-brand"
                                >
                                  <Info className="size-3" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="top">
                                {t("advanced.indexContributionsTooltip")}
                              </PopoverContent>
                            </Popover>
                          </label>
                          <button
                            id="index-toggle"
                            type="button"
                            role="switch"
                            aria-checked={indexContributions}
                            onClick={() => setIndexContributions((v) => !v)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              indexContributions ? "bg-brand" : "bg-muted"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
                                indexContributions ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {t("form.withdrawalRate")}
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={t("form.withdrawalRateInfo")}
                            className="text-muted-foreground hover:text-brand"
                          >
                            <Info className="size-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="text-center">
                          {t("form.withdrawalRateTooltip")}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <NumField
                      value={withdrawalRate}
                      onChange={(v) => setWithdrawalRate(Math.max(0, Math.min(20, v)))}
                      suffix={t("units.pctPerYear")}
                      step={0.1}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className={`grid grid-cols-1 gap-4 ${showReal ? "md:grid-cols-2" : ""}`}>
            <div className="bg-card p-6 rounded-2xl border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("results.nominalLabel")}
              </p>
              <p className="text-3xl font-bold text-foreground font-mono break-words">
                {fmt(result.finalNominal)}
              </p>
              <p className="text-xs text-brand mt-2 flex items-center gap-1">
                <span>▲</span>{" "}
                {t("results.profitDetail", {
                  profit: fmt(profit),
                  contributed: fmt(result.totalContributions),
                })}
              </p>
            </div>
            {showReal && (
              <div className="bg-card p-6 rounded-2xl border border-brand/30 relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/30">
                    {t("results.inflationAdjustedBadge")}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {t("results.realLabel")}
                </p>
                <p className="text-3xl font-bold text-foreground font-mono break-words">
                  {fmt(result.finalReal)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("results.realDescription", { pct: fmtPct(inflation) })}
                </p>
              </div>
            )}
          </div>

          {isAdvanced && (
            <div className="bg-card p-6 rounded-2xl border border-border">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {t("results.passiveIncomeTitle")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("results.passiveIncomeDescription", {
                      pct: fmtPct(withdrawalRate),
                      years,
                    })}
                  </p>
                </div>
              </div>
              <div className={`grid grid-cols-1 gap-4 ${showReal ? "md:grid-cols-2" : ""}`}>
                <div className="bg-surface rounded-xl p-4 border border-border">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {t("results.monthlyNominal")}
                  </p>
                  <p className="text-2xl font-bold text-foreground font-mono break-words">
                    {fmt(monthlyWithdrawalNominal)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmt(annualWithdrawalNominal)} {t("results.annuallySuffix")}
                  </p>
                </div>
                {showReal && (
                  <div className="bg-surface rounded-xl p-4 border border-brand/30">
                    <p className="text-[11px] font-medium text-brand uppercase tracking-wider mb-1">
                      {t("results.monthlyReal")}
                    </p>
                    <p className="text-2xl font-bold text-foreground font-mono break-words">
                      {fmt(monthlyWithdrawalReal)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmt(annualWithdrawalReal)} {t("results.annuallySuffix")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <ProjectionView result={result} years={years} showReal={showReal} />
        </section>
      </main>
    </Layout>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label={t("modes.ariaLabel")}
      className="grid grid-cols-2 gap-1 p-1 bg-surface border border-border rounded-xl"
    >
      {(
        [
          { v: "basic", label: t("modes.basic") },
          { v: "advanced", label: t("modes.advanced") },
        ] as const
      ).map((opt) => {
        const active = mode === opt.v;
        return (
          <button
            key={opt.v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.v as Mode)}
            className={`py-2 text-sm font-medium rounded-lg transition-colors ${
              active
                ? "bg-brand text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
