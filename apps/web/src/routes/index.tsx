import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { calculateInvestment, formatCurrency, type SupportedLocale } from "@investio/shared";
import { Layout } from "@/components/layout";
import { NumField } from "@/components/num-field";
import { ProjectionView } from "@/components/projection-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Investio — Základní kalkulačka složeného úročení" },
      {
        name: "description",
        content:
          "Spočítejte budoucí nominální hodnotu vašich investic se složeným úročením a měsíční kapitalizací.",
      },
      { property: "og:title", content: "Investio — Základní kalkulačka" },
      {
        property: "og:description",
        content: "Složené úročení, počáteční vklad, měsíční vklad, úrok a doba investice.",
      },
    ],
  }),
  component: BasicCalculator,
});

function BasicCalculator() {
  const { t, i18n } = useTranslation();
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "cs";
  const fmt = (n: number) => formatCurrency(n, locale);
  const currencySuffix = locale === "cs" ? "Kč" : "$";

  const [initial, setInitial] = useState(100000);
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);

  const result = useMemo(
    () =>
      calculateInvestment({
        initial,
        monthly,
        annualRatePct: rate,
        years,
        inflationPct: 0,
      }),
    [initial, monthly, rate, years],
  );

  const profit = result.finalNominal - result.totalContributions;

  return (
    <Layout>
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl">
            <h1 className="text-lg font-semibold text-foreground mb-1">{t("basic.title")}</h1>
            <p className="text-xs text-muted-foreground mb-6">{t("basic.subtitle")}</p>

            <div className="space-y-5">
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
                  onChange={(v) => setRate(Math.max(0, Math.min(100, v)))}
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
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {t("results.nominalLabel")}
            </p>
            <p className="text-3xl font-bold text-foreground font-mono break-words">
              {fmt(result.finalNominal)}
            </p>
            <p className="text-xs text-brand mt-2 flex items-center gap-1">
              <span>▲</span>{" "}
              {t("basic.profitDetail", {
                profit: fmt(profit),
                contributed: fmt(result.totalContributions),
              })}
            </p>
          </div>

          <ProjectionView result={result} years={years} showReal={false} />
        </section>
      </main>
    </Layout>
  );
}
