import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Info, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchCzechInflation,
  formatCurrency,
  solveMonthlyForTargetIncome,
  type SupportedLocale,
} from "@investio/shared";
import { Layout } from "@/components/layout";
import { NumField } from "@/components/num-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

  const [target, setTarget] = useState(40000);
  const [years, setYears] = useState(25);
  const [rate, setRate] = useState(7);
  const [inflation, setInflation] = useState(3.2);
  const [withdrawal, setWithdrawal] = useState(4);
  const [initial, setInitial] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ from: number; to: number; n: number } | null>(null);

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

  return (
    <Layout>
      <main className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl">
            <h1 className="text-lg font-semibold text-foreground mb-1">{t("renta.title")}</h1>
            <p className="text-xs text-muted-foreground mb-6">{t("renta.subtitle")}</p>

            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t("renta.targetMonthly")}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("renta.targetMonthlyInfo")}
                        className="text-muted-foreground hover:text-brand"
                      >
                        <Info className="size-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top">
                      {t("renta.targetMonthlyTooltip")}
                    </PopoverContent>
                  </Popover>
                </div>
                <NumField
                  value={target}
                  onChange={setTarget}
                  suffix={currencySuffix}
                  step={1000}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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

              <div className="pt-4 border-t border-border space-y-4">
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
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-border bg-surface hover:bg-muted text-foreground transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  {t("inflation.loadButton", { years })}
                </button>
                {meta && !error && (
                  <p className="text-[11px] text-muted-foreground">
                    {t("inflation.source", { from: meta.from, to: meta.to, n: meta.n })}
                  </p>
                )}
                {error && <p className="text-[11px] text-destructive">{error}</p>}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t("renta.withdrawalRateLabel")}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-brand">
                        <Info className="size-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top">
                      {t("renta.withdrawalRateTooltip")}
                    </PopoverContent>
                  </Popover>
                </div>
                <NumField
                  value={withdrawal}
                  onChange={(v) => setWithdrawal(Math.max(0.5, Math.min(20, v)))}
                  suffix={t("units.pctPerYear")}
                  step={0.1}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-7 space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-brand/30 relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/30">
                {t("renta.resultBadge")}
              </span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {t("renta.requiredMonthlyLabel")}
            </p>
            <p className="text-4xl md:text-5xl font-bold text-foreground font-mono break-words">
              {unreachable ? "—" : fmt(required)}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              {unreachable
                ? t("renta.unreachable")
                : t("renta.afterYears", { years, target: fmt(target) })}
            </p>
          </div>

          {!unreachable && (
            <div className="bg-card p-6 rounded-2xl border border-brand/30">
              <p className="text-[11px] font-medium text-brand uppercase tracking-wider mb-1">
                {t("renta.nominalMonthlyLabel")}
              </p>
              <p className="text-3xl font-bold text-foreground font-mono break-words">
                {fmt(nominalMonthly)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t("renta.nominalMonthlyDesc", { years, inflation: fmtPct(inflation) })}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card p-6 rounded-2xl border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("renta.portfolioNominal")}
              </p>
              <p className="text-2xl font-bold text-foreground font-mono break-words">
                {fmt(result.requiredNominalPortfolio)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t("renta.portfolioNominalDesc", { years })}
              </p>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("renta.portfolioReal")}
              </p>
              <p className="text-2xl font-bold text-foreground font-mono break-words">
                {fmt(result.requiredRealPortfolio)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t("renta.portfolioRealDesc", { target: fmt(target), withdrawal: fmtPct(withdrawal) })}
              </p>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border text-sm text-muted-foreground leading-relaxed">
            <h3 className="text-sm font-semibold text-foreground mb-2">{t("renta.howItWorks")}</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t("renta.step1", { value: fmt(target * 12) })}</li>
              <li>
                {t("renta.step2", {
                  withdrawal: fmtPct(withdrawal),
                  value: fmt(result.requiredRealPortfolio),
                })}
              </li>
              <li>
                {t("renta.step3", {
                  years,
                  inflation: fmtPct(inflation),
                  value: fmt(result.requiredNominalPortfolio),
                })}
              </li>
              <li>{t("renta.step4", { rate: fmtPct(rate) })}</li>
            </ol>
          </div>
        </section>
      </main>
    </Layout>
  );
}
