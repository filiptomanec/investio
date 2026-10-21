import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  calculateInvestment,
  fetchCzechInflation,
  formatCurrency,
  type SupportedLocale,
} from "@investio/shared";
import { usePersistedState } from "@/hooks/use-persisted-state";

export type Mode = "basic" | "advanced";

export const INVESTMENT_DEFAULTS = {
  initial: 100000,
  monthly: 5000,
  rate: 7,
  years: 20,
  inflation: 3.2,
  inflationEnabled: true,
  indexContributions: false,
  withdrawalRate: 4,
};

// The investment calculator's state and results, shared by every layout of
// the page. Keys match the production page so saved inputs carry over.
export function useInvestmentModel() {
  const { t, i18n } = useTranslation();
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "cs";
  const D = INVESTMENT_DEFAULTS;

  const [mode, setMode] = usePersistedState<Mode>("investio.inv.mode", "basic");
  const [initial, setInitial] = usePersistedState("investio.inv.initial", D.initial);
  const [monthly, setMonthly] = usePersistedState("investio.inv.monthly", D.monthly);
  const [rate, setRate] = usePersistedState("investio.inv.rate", D.rate);
  const [years, setYearsRaw] = usePersistedState("investio.inv.years", D.years);
  const [inflation, setInflation] = usePersistedState("investio.inv.inflation", D.inflation);
  const [inflationEnabled, setInflationEnabled] = usePersistedState(
    "investio.inv.inflationEnabled",
    D.inflationEnabled,
  );
  const [indexContributions, setIndexContributions] = usePersistedState(
    "investio.inv.indexContributions",
    D.indexContributions,
  );
  const [withdrawalRate, setWithdrawalRateRaw] = usePersistedState(
    "investio.inv.withdrawalRate",
    D.withdrawalRate,
  );

  const [loadingInflation, setLoadingInflation] = useState(false);
  const [inflationError, setInflationError] = useState<string | null>(null);
  const [inflationMeta, setInflationMeta] = useState<{
    from: number;
    to: number;
    n: number;
  } | null>(null);

  const setYears = (v: number) => setYearsRaw(Math.max(1, Math.min(60, Math.round(v))));
  const setWithdrawalRate = (v: number) => setWithdrawalRateRaw(Math.max(0, Math.min(20, v)));

  const isAdvanced = mode === "advanced";
  const showReal = isAdvanced && inflationEnabled;
  const effectiveInflation = showReal ? inflation : 0;

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
  const annualWithdrawalReal = result.finalReal * (withdrawalRate / 100);

  function reset() {
    setInitial(D.initial);
    setMonthly(D.monthly);
    setRate(D.rate);
    setYearsRaw(D.years);
    setInflation(D.inflation);
    setInflationEnabled(D.inflationEnabled);
    setIndexContributions(D.indexContributions);
    setWithdrawalRateRaw(D.withdrawalRate);
    setInflationMeta(null);
    setInflationError(null);
  }

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

  const fmt = (n: number) => formatCurrency(n, locale);
  const fmtPct = (n: number) =>
    new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Number.isFinite(n) ? n : 0);

  return {
    t,
    locale,
    fmt,
    fmtPct,
    currencySuffix: locale === "cs" ? "Kč" : "$",
    mode,
    setMode,
    isAdvanced,
    showReal,
    inputs: {
      initial,
      setInitial,
      monthly,
      setMonthly,
      rate,
      setRate,
      years,
      setYears,
      inflation,
      setInflation,
      inflationEnabled,
      setInflationEnabled,
      indexContributions,
      setIndexContributions,
      withdrawalRate,
      setWithdrawalRate,
    },
    inflationLoad: {
      load: loadInflation,
      loading: loadingInflation,
      error: inflationError,
      meta: inflationMeta,
    },
    result,
    profit,
    income: {
      annualNominal: annualWithdrawalNominal,
      monthlyNominal: annualWithdrawalNominal / 12,
      annualReal: annualWithdrawalReal,
      monthlyReal: annualWithdrawalReal / 12,
    },
    reset,
  };
}

export type InvestmentModel = ReturnType<typeof useInvestmentModel>;
