import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Banknote, CalendarCheck2, Percent, Scale } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateMortgage,
  compareMortgageStrategies,
  formatCurrency,
  type SupportedLocale,
} from "@investio/shared";
import { useFitSticky } from "@/components/bento/kit";
import {
  ChartTip,
  HeroFigure,
  HeroLabel,
  HeroTile,
  InputsHeader,
  LegendSwatch,
  ModeSwitch,
  Panel,
  PanelTitle,
  Slider,
  SplitBar,
  Sub,
  Tile,
  Well,
  YearBadge,
  rise,
  type Mode,
} from "@/components/bento/ui";
import { Layout } from "@/components/layout";
import { AnimatedNumber } from "@/hooks/use-animated-number";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useIsMobile } from "@/hooks/use-mobile";
import { compactFormatter, yearTicks } from "@/lib/chart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/hypoteka")({
  head: () => ({
    meta: [
      { title: "Investio — Kalkulačka hypotéky a mimořádných splátek" },
      {
        name: "description",
        content:
          "Spočítej splátku hypotéky, podíl úroků a jistiny a porovnej mimořádné splátky vs. investování.",
      },
      { property: "og:title", content: "Investio — Hypotéka" },
      {
        property: "og:description",
        content: "Splátka, úroky vs. jistina v čase a srovnání mimořádných splátek s investováním.",
      },
    ],
  }),
  component: MortgageCalculator,
});

const DEFAULTS = {
  principal: 4_500_000,
  rate: 5.2,
  years: 30,
  extra: 5_000,
  investRate: 7,
};

function MortgageCalculator() {
  const { t, i18n } = useTranslation();
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "cs";
  const fmt = (n: number) => formatCurrency(n, locale);
  const fmtAxis = compactFormatter(locale);
  const sticky = useFitSticky<HTMLDivElement>();
  const [showAllYears, setShowAllYears] = useState(false);
  const fmtPct = (n: number) =>
    new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Number.isFinite(n) ? n : 0);
  const currencySuffix = locale === "cs" ? "Kč" : "$";

  const isMobile = useIsMobile();
  const [mode, setMode] = usePersistedState<Mode>("investio.hypoteka.mode", "basic");
  const [principal, setPrincipal] = usePersistedState(
    "investio.hypoteka.principal",
    DEFAULTS.principal,
  );
  const [rate, setRate] = usePersistedState("investio.hypoteka.rate", DEFAULTS.rate);
  const [years, setYears] = usePersistedState("investio.hypoteka.years", DEFAULTS.years);
  const [extra, setExtra] = usePersistedState("investio.hypoteka.extra", DEFAULTS.extra);
  const [investRate, setInvestRate] = usePersistedState(
    "investio.hypoteka.investRate",
    DEFAULTS.investRate,
  );

  const isAdvanced = mode === "advanced";
  const effectiveExtra = isAdvanced ? extra : 0;

  function reset() {
    setPrincipal(DEFAULTS.principal);
    setRate(DEFAULTS.rate);
    setYears(DEFAULTS.years);
    setExtra(DEFAULTS.extra);
    setInvestRate(DEFAULTS.investRate);
  }

  const base = useMemo(
    () => calculateMortgage({ principal, annualRatePct: rate, years, extraMonthly: 0 }),
    [principal, rate, years],
  );

  const withExtra = useMemo(
    () =>
      calculateMortgage({ principal, annualRatePct: rate, years, extraMonthly: effectiveExtra }),
    [principal, rate, years, effectiveExtra],
  );

  const compare = useMemo(
    () =>
      isAdvanced && effectiveExtra > 0
        ? compareMortgageStrategies({
            principal,
            annualRatePct: rate,
            years,
            extraMonthly: effectiveExtra,
            investAnnualRatePct: investRate,
          })
        : null,
    [isAdvanced, principal, rate, years, effectiveExtra, investRate],
  );

  const chartData = useMemo(() => {
    const investMonthlyRate = Math.pow(1 + investRate / 100, 1 / 12) - 1;
    const out: {
      year: number;
      balance: number;
      balanceExtra?: number;
      invested?: number;
      paidInterest: number;
    }[] = [];
    for (let y = 0; y <= years; y++) {
      const months = y * 12;
      const std = base.series.find((s) => s.year === y);
      const ext = withExtra.series.find((s) => s.year === y);
      const invested =
        investMonthlyRate === 0
          ? effectiveExtra * months
          : effectiveExtra * ((Math.pow(1 + investMonthlyRate, months) - 1) / investMonthlyRate);
      out.push({
        year: y,
        balance: std ? std.balance : 0,
        balanceExtra: isAdvanced ? (ext ? ext.balance : 0) : undefined,
        invested: isAdvanced && effectiveExtra > 0 ? invested : undefined,
        paidInterest: std ? std.paidInterest : 0,
      });
    }
    return out;
  }, [base.series, withExtra.series, years, investRate, effectiveExtra, isAdvanced]);

  const crossoverYear = useMemo(() => {
    if (!isAdvanced || effectiveExtra <= 0) return null;
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1];
      const cur = chartData[i];
      const a = (prev.invested ?? 0) - prev.balance;
      const b = (cur.invested ?? 0) - cur.balance;
      if (a < 0 && b >= 0) {
        const t = a === b ? 0 : -a / (b - a);
        return prev.year + t;
      }
    }
    return null;
  }, [chartData, isAdvanced, effectiveExtra]);

  const payoffYears = compare ? Math.floor(compare.payoffMonthsWithExtra / 12) : 0;
  const payoffMonths = compare ? compare.payoffMonthsWithExtra % 12 : 0;
  const crossoverMonthsTotal = crossoverYear !== null ? Math.round(crossoverYear * 12) : null;
  const crossoverYearsPart =
    crossoverMonthsTotal !== null ? Math.floor(crossoverMonthsTotal / 12) : 0;
  const crossoverMonthsPart = crossoverMonthsTotal !== null ? crossoverMonthsTotal % 12 : 0;

  const fmtYM = (y: number, m: number) => {
    const ystr =
      y > 0
        ? t("hypoteka.yearLong", {
            n: y,
            unit: t("hypoteka.yearUnit", { count: y, defaultValue: t("hypoteka.yearUnit_other") }),
          })
        : "";
    const mstr = m > 0 ? t("hypoteka.monthsShort", { n: m }) : "";
    if (!ystr && !mstr) return t("hypoteka.monthsShort", { n: 0 });
    if (ystr && mstr) return `${ystr} ${locale === "cs" ? "a" : "and"} ${mstr}`;
    return ystr || mstr;
  };

  const winner = compare ? (compare.difference >= 0 ? "mortgage" : "invest") : null;

  const mobileMilestones = useMemo(() => {
    const rows = base.series.slice(1);
    const milestoneYears = new Set<number>();
    for (let y = 5; y <= years; y += 5) milestoneYears.add(y);
    milestoneYears.add(years);
    return rows.filter((r) => milestoneYears.has(r.year));
  }, [base.series, years]);

  const comparing = isAdvanced && effectiveExtra > 0;
  const tableRows = showAllYears ? base.series.slice(1) : mobileMilestones;
  const pct = (part: number) =>
    base.totalPaid > 0 ? Math.round((part / base.totalPaid) * 100) : 0;

  const strategies = compare
    ? [
        {
          key: "mortgage",
          label: t("hypoteka.strategyA"),
          value: fmt(compare.netExtraToMortgage),
          html: t("hypoteka.strategyADesc", {
            payoff: fmtYM(payoffYears, payoffMonths),
            saved: fmt(compare.interestSaved),
          }),
        },
        {
          key: "invest",
          label: t("hypoteka.strategyB"),
          value: fmt(compare.netExtraToInvest),
          html: t("hypoteka.strategyBDesc", {
            years,
            extra: fmt(effectiveExtra),
            rate: fmtPct(investRate),
          }),
        },
        {
          key: "crossover",
          label: t("hypoteka.strategyC"),
          value:
            crossoverMonthsTotal !== null ? fmtYM(crossoverYearsPart, crossoverMonthsPart) : "—",
          html:
            crossoverMonthsTotal !== null
              ? t("hypoteka.strategyCDesc", {
                  when: fmtYM(crossoverYearsPart, crossoverMonthsPart),
                })
              : t("hypoteka.strategyCNone"),
        },
      ]
    : [];

  return (
    <Layout>
      <div className="sticky top-0 z-40 px-4 pt-2 lg:hidden">
        <div className="flex items-center justify-between rounded-2xl bg-(--b-hero) px-4 py-3 text-(--b-hero-ink) shadow-lg ring-1 ring-(--b-hero-ring)">
          <span className="text-xs text-(--b-hero-muted)">{t("hypoteka.monthlyPayment")}</span>
          <span className="text-xl font-semibold tabular-nums">
            <AnimatedNumber value={base.monthlyPayment} format={fmt} />
          </span>
        </div>
      </div>

      <main className="mx-auto mt-3 grid max-w-7xl grid-cols-1 gap-4 px-4 md:px-8 lg:mt-0 lg:grid-cols-[360px_1fr]">
        <Panel
          ref={sticky.ref}
          className="rise self-start p-6 lg:sticky"
          style={{ ...rise(1), top: sticky.top }}
        >
          <InputsHeader title={t("hypoteka.planTitle")} onReset={reset} />
          <ModeSwitch mode={mode} onChange={setMode} />
          <div className="mt-6 space-y-6">
            <Slider
              label={t("hypoteka.loanAmount")}
              value={principal}
              onChange={setPrincipal}
              min={0}
              max={20_000_000}
              step={50_000}
              suffix={currencySuffix}
            />
            <Slider
              label={t("form.annualRate")}
              value={rate}
              onChange={setRate}
              min={0}
              max={15}
              step={0.1}
              suffix={t("units.pct")}
            />
            <Slider
              label={t("hypoteka.duration")}
              value={years}
              onChange={(v) => setYears(Math.max(1, Math.min(40, Math.round(v))))}
              min={1}
              max={40}
              step={1}
              suffix={t("units.years")}
            />
          </div>

          {isAdvanced && (
            <Well>
              <div>
                <h2 className="text-sm font-semibold text-(--b-ink)">{t("hypoteka.extraTitle")}</h2>
                <p className="mt-1 text-xs leading-relaxed text-(--b-muted)">
                  {t("hypoteka.extraDescription")}
                </p>
              </div>
              <Slider
                label={t("hypoteka.extraMonthly")}
                info={t("hypoteka.extraMonthlyTooltip")}
                value={extra}
                onChange={setExtra}
                min={0}
                max={50_000}
                step={500}
                suffix={currencySuffix}
              />
              <Slider
                label={t("hypoteka.investRate")}
                value={investRate}
                onChange={setInvestRate}
                min={0}
                max={15}
                step={0.1}
                suffix={t("units.pct")}
              />
            </Well>
          )}
        </Panel>

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <HeroTile i={2} className="sm:col-span-2">
            <HeroLabel>{t("hypoteka.monthlyPayment")}</HeroLabel>
            <HeroFigure>
              <AnimatedNumber value={base.monthlyPayment} format={fmt} />
            </HeroFigure>
            <p className="mt-3 text-[15px] text-(--b-hero-soft)">
              {comparing
                ? t("hypoteka.monthlyPaymentExtra", {
                    extra: fmt(effectiveExtra),
                    total: fmt(base.monthlyPayment + effectiveExtra),
                  })
                : t("hypoteka.heroSub", { years })}
            </p>
            <SplitBar
              left={principal}
              right={base.totalInterest}
              leftLabel={t("hypoteka.principalShare", { pct: pct(principal) })}
              rightLabel={t("hypoteka.interestShareBar", { pct: pct(base.totalInterest) })}
            />
          </HeroTile>

          <Tile
            i={3}
            tone="sky"
            icon={<Banknote className="size-5" />}
            label={t("hypoteka.totalPaid")}
          >
            <AnimatedNumber value={base.totalPaid} format={fmt} />
            <Sub>{t("hypoteka.totalPaidNote", { years })}</Sub>
          </Tile>
          <Tile
            i={4}
            tone="lilac"
            icon={<Percent className="size-5" />}
            label={t("hypoteka.totalInterest")}
          >
            <AnimatedNumber value={base.totalInterest} format={fmt} />
            <Sub>{t("hypoteka.totalInterestNote")}</Sub>
          </Tile>

          {compare && (
            <>
              <Tile
                i={5}
                tone="mint"
                icon={<CalendarCheck2 className="size-5" />}
                label={t("hypoteka.savedTile")}
              >
                <AnimatedNumber value={compare.interestSaved} format={fmt} />
                <Sub>{t("hypoteka.savedSub", { payoff: fmtYM(payoffYears, payoffMonths) })}</Sub>
              </Tile>
              <Tile
                i={6}
                tone="stone"
                icon={<Scale className="size-5" />}
                label={t("hypoteka.crossoverTile")}
              >
                {crossoverMonthsTotal !== null
                  ? fmtYM(crossoverYearsPart, crossoverMonthsPart)
                  : "—"}
                <Sub>
                  {crossoverMonthsTotal !== null
                    ? t("hypoteka.crossoverSub", { rate: fmtPct(investRate) })
                    : t("hypoteka.strategyCNone")}
                </Sub>
              </Tile>
            </>
          )}

          <Panel className="rise p-5 sm:col-span-2 md:p-7" style={rise(7)}>
            <PanelTitle
              title={comparing ? t("hypoteka.chartTitleCompare") : t("hypoteka.chartTitleStandard")}
              subtitle={
                comparing ? t("hypoteka.chartDescCompare") : t("hypoteka.chartDescStandard")
              }
              aside={
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-(--b-muted)">
                  {comparing ? (
                    <>
                      <LegendSwatch
                        color="var(--b-mint)"
                        label={t("hypoteka.legendBalanceWithExtra")}
                      />
                      <LegendSwatch
                        color="var(--b-axis)"
                        label={t("hypoteka.legendBalanceStandardCompare")}
                      />
                      <LegendSwatch color="var(--b-sky)" label={t("hypoteka.legendInvested")} />
                    </>
                  ) : (
                    <>
                      <LegendSwatch
                        color="var(--b-mint)"
                        label={t("hypoteka.legendBalanceStandard")}
                      />
                      <LegendSwatch
                        color="var(--b-sky)"
                        label={t("hypoteka.legendCumulativeInterest")}
                      />
                    </>
                  )}
                </div>
              }
            />
            <div className="mt-5 h-[260px] -ml-2 md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="h-bal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--b-mint)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--b-mint)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--b-grid)" />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[0, years]}
                    ticks={yearTicks(years)}
                    tickFormatter={(v) => `${v}${t("units.yearShort")}`}
                    stroke="var(--b-axis)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickFormatter={fmtAxis}
                    stroke="var(--b-axis)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={76}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--b-line)", strokeWidth: 1 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as (typeof chartData)[number];
                      const rows = comparing
                        ? [
                            {
                              label: t("hypoteka.legendBalanceWithExtra"),
                              value: fmt(p.balanceExtra ?? 0),
                              color: "var(--b-mint)",
                            },
                            {
                              label: t("hypoteka.legendBalanceStandardCompare"),
                              value: fmt(p.balance),
                              color: "var(--b-axis)",
                            },
                            {
                              label: t("hypoteka.legendInvested"),
                              value: fmt(p.invested ?? 0),
                              color: "var(--b-sky)",
                            },
                          ]
                        : [
                            {
                              label: t("hypoteka.legendBalanceStandard"),
                              value: fmt(p.balance),
                              color: "var(--b-mint)",
                            },
                            {
                              label: t("hypoteka.legendCumulativeInterest"),
                              value: fmt(p.paidInterest),
                              color: "var(--b-sky)",
                            },
                          ];
                      return (
                        <ChartTip
                          title={t("chart.tooltipYearLabel", { year: label })}
                          rows={rows}
                        />
                      );
                    }}
                  />
                  {comparing ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="var(--b-axis)"
                        strokeDasharray="5 4"
                        strokeWidth={1.5}
                        dot={false}
                        animationDuration={900}
                      />
                      <Line
                        type="monotone"
                        dataKey="invested"
                        stroke="var(--b-sky)"
                        strokeWidth={2.5}
                        dot={false}
                        animationDuration={1200}
                      />
                      <Area
                        type="monotone"
                        dataKey="balanceExtra"
                        stroke="var(--b-mint)"
                        strokeWidth={2.5}
                        fill="url(#h-bal)"
                        animationDuration={1200}
                      />
                      {crossoverYear !== null && (
                        <ReferenceLine
                          x={crossoverYear}
                          stroke="var(--b-ink2)"
                          strokeDasharray="3 3"
                          label={{
                            value: isMobile
                              ? fmtYM(crossoverYearsPart, crossoverMonthsPart)
                              : `${t("hypoteka.crossoverShort")} · ${fmtYM(crossoverYearsPart, crossoverMonthsPart)}`,
                            position:
                              crossoverYear > years * 0.6 ? "insideTopRight" : "insideTopLeft",
                            offset: 0,
                            dy: -20,
                            fontSize: 12,
                            fill: "var(--b-ink)",
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="var(--b-mint)"
                        strokeWidth={2.5}
                        fill="url(#h-bal)"
                        animationDuration={1200}
                      />
                      <Line
                        type="monotone"
                        dataKey="paidInterest"
                        stroke="var(--b-sky)"
                        strokeWidth={2.5}
                        dot={false}
                        animationDuration={1200}
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {compare && (
            <Panel className="rise p-5 sm:col-span-2 md:p-7" style={rise(8)}>
              <PanelTitle
                title={t("hypoteka.compareTitle")}
                subtitle={t("hypoteka.compareSubtitle", { extra: fmt(effectiveExtra) })}
              />
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {strategies.map((st) => {
                  const wins = st.key === winner;
                  return (
                    <div
                      key={st.key}
                      className={cn(
                        "flex flex-col rounded-3xl p-5 transition duration-300 hover:-translate-y-0.5",
                        wins
                          ? "bg-(--b-hero) text-(--b-hero-ink) ring-1 ring-(--b-hero-ring)"
                          : "bg-(--b-well)",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            wins ? "text-(--b-hero-muted)" : "text-(--b-muted)",
                          )}
                        >
                          {st.label}
                        </p>
                        {wins && (
                          <span className="shrink-0 rounded-full bg-(--b-mint) px-2.5 py-0.5 text-[11px] font-semibold text-(--b-hero)">
                            {t("hypoteka.winnerTag")}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                        {st.value}
                      </p>
                      <p
                        className={cn(
                          "mt-2 text-[13px] leading-relaxed [&_strong]:font-semibold",
                          wins
                            ? "text-(--b-hero-soft) [&_strong]:text-(--b-hero-ink)"
                            : "text-(--b-muted) [&_strong]:text-(--b-ink)",
                        )}
                        dangerouslySetInnerHTML={{ __html: st.html }}
                      />
                    </div>
                  );
                })}
              </div>
              <p
                className="mt-5 text-[15px] text-(--b-ink) [&_strong]:font-semibold [&_strong]:text-(--b-mint-ink)"
                dangerouslySetInnerHTML={{
                  __html:
                    winner === "mortgage"
                      ? t("hypoteka.winnerMortgage", { diff: fmt(Math.abs(compare.difference)) })
                      : t("hypoteka.winnerInvest", { diff: fmt(Math.abs(compare.difference)) }),
                }}
              />
              <p className="mt-2 text-xs text-(--b-muted)">
                {t("hypoteka.compareNote", { years })}
              </p>
            </Panel>
          )}

          <Panel className="rise p-3 sm:col-span-2" style={rise(9)}>
            <div className="px-3 pt-3 pb-2">
              <PanelTitle title={t("hypoteka.tableTitle")} subtitle={t("hypoteka.tableSubtitle")} />
            </div>
            {tableRows.map((r) => {
              const paid = r.interestThisYear + r.principalThisYear;
              const principalShare = paid > 0 ? r.principalThisYear / paid : 0;
              return (
                <div
                  key={r.year}
                  className="flex items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-(--b-well)"
                >
                  <YearBadge>{t("breakdown.yearBadge", { n: r.year })}</YearBadge>
                  <div className="min-w-0 flex-1">
                    <div className="flex h-2 overflow-hidden rounded-full bg-(--b-lilac-soft)">
                      <div
                        className="h-full bg-(--b-sky)"
                        style={{ width: `${principalShare * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 truncate text-xs text-(--b-muted) tabular-nums">
                      {t("hypoteka.rowSub", {
                        principal: fmt(r.principalThisYear),
                        interest: fmt(r.interestThisYear),
                      })}
                    </p>
                  </div>
                  <span className="w-28 shrink-0 text-right text-base font-semibold tabular-nums sm:w-32">
                    {fmt(r.balance)}
                  </span>
                </div>
              );
            })}
            {base.series.length - 1 > mobileMilestones.length && (
              <button
                type="button"
                onClick={() => setShowAllYears((v) => !v)}
                className="mx-3 mt-1 mb-2 rounded-xl px-3 py-2 text-sm font-medium text-(--b-mint-ink) transition hover:bg-(--b-mint-soft)"
              >
                {showAllYears ? t("hypoteka.showFewerYears") : t("hypoteka.showAllYears")}
              </button>
            )}
          </Panel>
        </section>
      </main>
    </Layout>
  );
}
