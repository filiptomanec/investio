import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Coins, Landmark, PiggyBank, Wallet } from "lucide-react";
import {
  fetchCzechInflation,
  formatCurrency,
  solveMonthlyForTargetIncome,
  type SupportedLocale,
} from "@investio/shared";
import { useFitSticky } from "@/components/bento/kit";
import {
  HeroFigure,
  HeroLabel,
  HeroTile,
  InflationLoader,
  InputsHeader,
  Panel,
  PanelTitle,
  Slider,
  SplitBar,
  Sub,
  Tile,
  Well,
  rise,
} from "@/components/bento/ui";
import { Layout } from "@/components/layout";
import { AnimatedNumber } from "@/hooks/use-animated-number";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { cn } from "@/lib/utils";

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
  const sticky = useFitSticky<HTMLDivElement>();

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
  // What you pay in over the years against what returns add to reach the goal.
  const contributed = initial + required * 12 * years;
  const growth = Math.max(0, result.requiredNominalPortfolio - contributed);
  const share = (part: number) =>
    contributed + growth > 0 ? Math.round((part / (contributed + growth)) * 100) : 0;

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

  // The calculation, step by step: each value feeds the next.
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
    },
  ];

  return (
    <Layout>
      <div className="sticky top-0 z-40 px-4 pt-2 lg:hidden">
        <div className="flex items-center justify-between rounded-2xl bg-(--b-hero) px-4 py-3 text-(--b-hero-ink) shadow-lg ring-1 ring-(--b-hero-ring)">
          <span className="text-xs text-(--b-hero-muted)">{t("renta.mobileLabel")}</span>
          <span className="text-xl font-semibold tabular-nums">
            <AnimatedNumber value={required} format={fmt} />
          </span>
        </div>
      </div>

      <main className="mx-auto mt-3 grid max-w-7xl grid-cols-1 gap-4 px-4 md:px-8 lg:mt-0 lg:grid-cols-[360px_1fr]">
        <Panel
          ref={sticky.ref}
          className="rise self-start p-6 lg:sticky"
          style={{ ...rise(1), top: sticky.top }}
        >
          <InputsHeader title={t("renta.planTitle")} onReset={reset} />
          <div className="mt-6 space-y-6">
            <Slider
              label={t("renta.targetMonthly")}
              info={t("renta.targetMonthlyTooltip")}
              value={target}
              onChange={setTarget}
              min={0}
              max={200_000}
              step={1000}
              suffix={currencySuffix}
            />
            <Slider
              label={t("form.annualRate")}
              value={rate}
              onChange={(v) => setRate(Math.max(0, Math.min(100, v)))}
              min={0}
              max={15}
              step={0.1}
              suffix={t("units.pct")}
            />
            <Slider
              label={t("renta.yearsToRetirement")}
              value={years}
              onChange={(v) => setYears(Math.max(1, Math.min(60, Math.round(v))))}
              min={1}
              max={50}
              step={1}
              suffix={t("units.years")}
            />
            <Slider
              label={t("renta.initialOptional")}
              value={initial}
              onChange={setInitial}
              min={0}
              max={5_000_000}
              step={10_000}
              suffix={currencySuffix}
            />
          </div>
          <Well>
            <Slider
              label={t("form.expectedInflation")}
              value={inflation}
              onChange={setInflation}
              min={0}
              max={10}
              step={0.1}
              suffix={t("units.pct")}
            />
            <InflationLoader
              years={years}
              load={loadInflation}
              loading={loading}
              error={error}
              meta={meta}
            />
            <Slider
              label={t("renta.withdrawalRateLabel")}
              info={t("renta.withdrawalRateTooltip")}
              value={withdrawal}
              onChange={(v) => setWithdrawal(Math.max(0.5, Math.min(20, v)))}
              min={1}
              max={10}
              step={0.1}
              suffix={t("units.pct")}
            />
          </Well>
        </Panel>

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <HeroTile i={2} className="sm:col-span-2">
            <HeroLabel>{t("renta.requiredMonthlyLabel")}</HeroLabel>
            <HeroFigure muted={unreachable}>
              <AnimatedNumber value={required} format={fmt} />
            </HeroFigure>
            <p className="mt-3 max-w-2xl text-[15px] text-(--b-hero-soft)">
              {unreachable
                ? t("renta.unreachable")
                : t("renta.afterYears", { years, target: fmt(target) })}
            </p>
            <SplitBar
              left={contributed}
              right={growth}
              leftLabel={t("results.ownShare", { pct: share(contributed) })}
              rightLabel={t("results.interestShare", { pct: share(growth) })}
            />
          </HeroTile>

          <Tile
            i={3}
            tone="sky"
            icon={<Coins className="size-5" />}
            label={t("renta.nominalMonthlyLabel")}
          >
            <AnimatedNumber value={nominalMonthly} format={fmt} />
            <Sub>{t("renta.nominalMonthlyDesc", { years, inflation: fmtPct(inflation) })}</Sub>
          </Tile>
          <Tile
            i={4}
            tone="mint"
            icon={<PiggyBank className="size-5" />}
            label={t("renta.contributedTile")}
          >
            <AnimatedNumber value={contributed} format={fmt} />
            <Sub>{t("renta.contributedSub", { growth: fmt(growth) })}</Sub>
          </Tile>
          <Tile
            i={5}
            tone="lilac"
            icon={<Wallet className="size-5" />}
            label={t("renta.portfolioReal")}
          >
            <AnimatedNumber value={result.requiredRealPortfolio} format={fmt} />
            <Sub>
              {t("renta.portfolioRealDesc", {
                target: fmt(target),
                withdrawal: fmtPct(withdrawal),
              })}
            </Sub>
          </Tile>
          <Tile
            i={6}
            tone="stone"
            icon={<Landmark className="size-5" />}
            label={t("renta.portfolioNominal")}
          >
            <AnimatedNumber value={result.requiredNominalPortfolio} format={fmt} />
            <Sub>{t("renta.portfolioNominalDesc", { years })}</Sub>
          </Tile>

          <Panel className="rise p-5 sm:col-span-2 md:p-7" style={rise(7)}>
            <PanelTitle title={t("renta.howItWorks")} />
            <ol className="mt-5 space-y-2">
              {ladder.map((step, idx) => {
                const last = idx === ladder.length - 1;
                return (
                  <li
                    key={step.label}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl px-4 py-3.5 transition",
                      last ? "bg-(--b-mint-soft) text-(--b-mint-ink)" : "hover:bg-(--b-well)",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums",
                        last
                          ? "bg-(--b-mint) text-(--b-hero)"
                          : "bg-(--b-badge) text-(--b-badge-ink)",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[15px]",
                          last ? "font-semibold" : "font-medium text-(--b-ink)",
                        )}
                      >
                        {step.label}
                      </p>
                      <p className={cn("mt-0.5 text-xs", last ? "opacity-80" : "text-(--b-muted)")}>
                        {step.note}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-right tabular-nums",
                        last ? "text-xl font-semibold" : "text-base font-semibold text-(--b-ink)",
                      )}
                    >
                      {step.value}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </section>
      </main>
    </Layout>
  );
}
