import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  calculateInvestment,
  fetchCzechInflation,
  formatCurrency,
  type SupportedLocale,
} from "@investio/shared";
import { InfoTip } from "@/components/info-tip";
import { Layout } from "@/components/layout";
import { ModeToggle, type Mode } from "@/components/mode-toggle";
import { NumField } from "@/components/num-field";
import { PageHeader, Panel } from "@/components/page-header";
import { ProjectionView } from "@/components/projection-view";
import { ResetButton } from "@/components/reset-button";
import { SwitchRow } from "@/components/switch-row";
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
  const [inflation, setInflation] = usePersistedState("investio.inv.inflation", DEFAULTS.inflation);
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

  // The split of the final sum: what you paid in against what interest added.
  const growth = Math.max(0, profit);
  const splitBase = result.totalContributions + growth;
  const ownShare = splitBase > 0 ? result.totalContributions / splitBase : 1;
  const fmtShare = (share: number) =>
    new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
      maximumFractionDigits: 0,
    }).format(share * 100);

  const strip: { label: string; value: string; note: React.ReactNode }[] = [];
  if (isAdvanced && showReal) {
    strip.push({
      label: t("results.realLabel"),
      value: fmt(result.finalReal),
      note: (
        <span className="inline-flex items-center gap-1">
          {t("results.realDescription", { pct: fmtPct(inflation) })}
          <InfoTip label={t("chart.realExplainerInfo")}>{t("chart.realExplainer")}</InfoTip>
        </span>
      ),
    });
  }
  if (isAdvanced) {
    strip.push({
      label: t("results.rentMonthly"),
      value: fmt(monthlyWithdrawalNominal),
      note: t("results.rentNote", {
        pct: fmtPct(withdrawalRate),
        annual: fmt(annualWithdrawalNominal),
      }),
    });
  }
  if (isAdvanced && showReal) {
    strip.push({
      label: t("results.rentMonthlyReal"),
      value: fmt(monthlyWithdrawalReal),
      note: t("results.rentNote", {
        pct: fmtPct(withdrawalRate),
        annual: fmt(annualWithdrawalReal),
      }),
    });
  }

  return (
    <Layout>
      <PageHeader
        title={t("investice.title")}
        subtitle={t("results.finding", {
          count: years,
          contributed: fmt(result.totalContributions),
          final: fmt(result.finalNominal),
        })}
        actions={
          <>
            <ModeToggle mode={mode} onChange={setMode} />
            <ResetButton onClick={reset} />
          </>
        }
      />

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        <Panel className="lg:col-span-4 lg:sticky lg:top-6 p-5">
          <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-3">
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
          </div>

          {isAdvanced && (
            <>
              <div className="mt-5 pt-4 border-t border-border space-y-3">
                <SwitchRow
                  id="inflation-toggle"
                  label={t("form.enableInflation")}
                  checked={inflationEnabled}
                  onChange={setInflationEnabled}
                />

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
                      className="w-full h-9 inline-flex items-center justify-center gap-2 text-sm font-medium px-3 rounded-md border border-input bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {loadingInflation ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5 text-muted-foreground" />
                      )}
                      {t("inflation.loadButton", { years })}
                    </button>
                    {inflationMeta && !inflationError && (
                      <p className="text-xs text-muted-foreground">
                        {t("inflation.source", {
                          from: inflationMeta.from,
                          to: inflationMeta.to,
                          n: inflationMeta.n,
                        })}
                      </p>
                    )}
                    {inflationError && <p className="text-xs text-destructive">{inflationError}</p>}

                    <SwitchRow
                      id="index-toggle"
                      label={t("advanced.indexContributions")}
                      checked={indexContributions}
                      onChange={setIndexContributions}
                      info={t("advanced.indexContributionsTooltip")}
                    />
                  </>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <NumField
                  label={t("form.withdrawalRate")}
                  info={t("form.withdrawalRateTooltip")}
                  infoLabel={t("form.withdrawalRateInfo")}
                  value={withdrawalRate}
                  onChange={(v) => setWithdrawalRate(Math.max(0, Math.min(20, v)))}
                  suffix={t("units.pctPerYear")}
                  step={0.1}
                />
              </div>
            </>
          )}
        </Panel>

        <section className="lg:col-span-8 space-y-4 lg:space-y-6">
          <Panel>
            <div className="p-5 md:p-6">
              <p className="text-[13px] font-medium text-muted-foreground">
                {t("results.nominalLabel")}
              </p>
              <p className="mt-1 text-[34px] md:text-[36px] leading-none font-semibold tracking-[-0.02em] text-foreground tabular-nums">
                {fmt(result.finalNominal)}
              </p>

              {/* What you put in against what interest added. */}
              <div
                className="mt-6 flex h-2 w-full overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`${t("breakdown.contributions")} ${fmtShare(ownShare)} %, ${t("results.growth")} ${fmtShare(1 - ownShare)} %`}
              >
                <div className="h-full bg-foreground" style={{ width: `${ownShare * 100}%` }} />
                <div
                  className="h-full bg-brand border-l-2 border-card"
                  style={{ width: `${(1 - ownShare) * 100}%` }}
                />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className="size-2 rounded-full bg-foreground" />
                    {t("breakdown.contributions")}
                  </dt>
                  <dd className="mt-0.5 text-base font-medium text-foreground tabular-nums">
                    {fmt(result.totalContributions)}
                    <span className="block sm:inline sm:ml-1.5 text-[13px] font-normal text-muted-foreground">
                      {t("results.shareOfFinal", { pct: fmtShare(ownShare) })}
                    </span>
                  </dd>
                </div>
                <div className="text-right">
                  <dt className="flex items-center justify-end gap-1.5 text-[13px] text-muted-foreground">
                    <span className="size-2 rounded-full bg-brand" />
                    {t("results.growth")}
                  </dt>
                  <dd className="mt-0.5 text-base font-medium text-foreground tabular-nums">
                    {profit > 0 ? "+" : ""}
                    {fmt(profit)}
                    <span className="block sm:inline sm:ml-1.5 text-[13px] font-normal text-muted-foreground">
                      {t("results.shareOfFinal", { pct: fmtShare(1 - ownShare) })}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {strip.length > 0 && (
              <dl
                className={`grid grid-cols-1 border-t border-border divide-y divide-border sm:divide-y-0 sm:divide-x ${
                  strip.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-1"
                }`}
              >
                {strip.map((cell) => (
                  <div key={cell.label} className="px-5 md:px-6 py-4">
                    <dt className="text-[13px] font-medium text-muted-foreground">{cell.label}</dt>
                    <dd className="mt-1 text-[22px] leading-tight font-semibold text-foreground tabular-nums">
                      {cell.value}
                    </dd>
                    <dd className="mt-1 text-xs text-muted-foreground">{cell.note}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Panel>

          <ProjectionView result={result} years={years} showReal={showReal} />
        </section>
      </main>
    </Layout>
  );
}
