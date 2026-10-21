import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateMortgage,
  compareMortgageStrategies,
  formatCurrency,
  type SupportedLocale,
} from "@investio/shared";
import { Layout } from "@/components/layout";
import { ModeToggle, type Mode } from "@/components/mode-toggle";
import { NumField } from "@/components/num-field";
import { LegendItem, PageHeader, Panel, PanelHeader } from "@/components/page-header";
import { ResetButton } from "@/components/reset-button";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  axisProps,
  compactFormatter,
  gridProps,
  tooltipContentStyle,
  tooltipLabelStyle,
  yearTicks,
} from "@/lib/chart";

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
          text: t("hypoteka.strategyBDesc", {
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
          muted: crossoverMonthsTotal === null,
          html:
            crossoverMonthsTotal !== null
              ? t("hypoteka.strategyCDesc", {
                  when: fmtYM(crossoverYearsPart, crossoverMonthsPart),
                })
              : undefined,
          text: crossoverMonthsTotal === null ? t("hypoteka.strategyCNone") : undefined,
        },
      ]
    : [];

  const kpis = [
    {
      label: t("hypoteka.monthlyPayment"),
      value: fmt(base.monthlyPayment),
      note: comparing
        ? t("hypoteka.monthlyPaymentExtra", {
            extra: fmt(effectiveExtra),
            total: fmt(base.monthlyPayment + effectiveExtra),
          })
        : null,
      lead: true,
    },
    {
      label: t("hypoteka.totalInterest"),
      value: fmt(base.totalInterest),
      note: t("hypoteka.totalInterestNote"),
    },
    {
      label: t("hypoteka.totalPaid"),
      value: fmt(base.totalPaid),
      note: t("hypoteka.totalPaidNote", { years }),
    },
  ];

  return (
    <Layout>
      <PageHeader
        title={t("hypoteka.title")}
        subtitle={
          compare
            ? t(winner === "mortgage" ? "hypoteka.winnerMortgage" : "hypoteka.winnerInvest", {
                diff: fmt(Math.abs(compare.difference)),
              }).replace(/<\/?strong>/g, "")
            : t("hypoteka.subtitle")
        }
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
              label={t("hypoteka.loanAmount")}
              value={principal}
              onChange={setPrincipal}
              suffix={currencySuffix}
              step={50000}
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
                label={t("hypoteka.duration")}
                value={years}
                onChange={(v) => setYears(Math.max(1, Math.min(40, Math.round(v))))}
                suffix={t("units.years")}
                step={1}
                min={1}
                max={40}
              />
            </div>
          </div>

          {isAdvanced && (
            <div className="mt-5 pt-4 border-t border-border space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {t("hypoteka.extraTitle")}
                </h2>
                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                  {t("hypoteka.extraDescription")}
                </p>
              </div>
              <NumField
                label={t("hypoteka.extraMonthly")}
                info={t("hypoteka.extraMonthlyTooltip")}
                value={extra}
                onChange={setExtra}
                suffix={currencySuffix}
                step={500}
              />
              <NumField
                label={t("hypoteka.investRate")}
                value={investRate}
                onChange={setInvestRate}
                suffix={t("units.pct")}
                step={0.1}
              />
            </div>
          )}
        </Panel>

        <section className="lg:col-span-8 space-y-4 lg:space-y-6">
          <Panel>
            <dl className="grid grid-cols-1 sm:grid-cols-3 divide-y divide-border sm:divide-y-0 sm:divide-x">
              {kpis.map((k) => (
                <div key={k.label} className="px-5 md:px-6 py-5">
                  <dt className="text-[13px] font-medium text-muted-foreground">{k.label}</dt>
                  <dd
                    className={`mt-1 font-semibold text-foreground tabular-nums leading-none ${
                      k.lead ? "text-[30px] md:text-[34px] tracking-[-0.02em]" : "text-[22px] mt-2"
                    }`}
                  >
                    {k.value}
                  </dd>
                  {k.note && (
                    <dd className="mt-2 text-xs text-muted-foreground tabular-nums">{k.note}</dd>
                  )}
                </div>
              ))}
            </dl>
          </Panel>

          <Panel className="p-5 md:p-6">
            <PanelHeader
              title={comparing ? t("hypoteka.chartTitleCompare") : t("hypoteka.chartTitleStandard")}
              subtitle={
                comparing ? t("hypoteka.chartDescCompare") : t("hypoteka.chartDescStandard")
              }
              aside={
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {comparing ? (
                    <>
                      <LegendItem
                        label={t("hypoteka.legendBalanceWithExtra")}
                        color="var(--color-brand)"
                      />
                      <LegendItem
                        label={t("hypoteka.legendBalanceStandardCompare")}
                        color="var(--color-muted-foreground)"
                        dashed
                      />
                      <LegendItem
                        label={t("hypoteka.legendInvested")}
                        color="var(--color-foreground)"
                      />
                    </>
                  ) : (
                    <>
                      <LegendItem
                        label={t("hypoteka.legendBalanceStandard")}
                        color="var(--color-brand)"
                      />
                      <LegendItem
                        label={t("hypoteka.legendCumulativeInterest")}
                        color="var(--color-foreground)"
                      />
                    </>
                  )}
                </div>
              }
            />
            <div className="mt-5 h-[240px] md:h-[280px] -ml-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis
                    {...axisProps}
                    dataKey="year"
                    type="number"
                    domain={[0, years]}
                    allowDecimals={false}
                    tickMargin={8}
                    ticks={yearTicks(years)}
                    tickFormatter={(v) => `${v}${t("units.yearShort")}`}
                  />
                  <YAxis
                    {...axisProps}
                    tickFormatter={(v) => fmtAxis(v)}
                    width={64}
                    tickMargin={4}
                    tickCount={5}
                  />
                  <RTooltip
                    contentStyle={tooltipContentStyle}
                    labelStyle={tooltipLabelStyle}
                    cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                    formatter={(value: number, name) => [fmt(value), name]}
                    labelFormatter={(l) => t("chart.tooltipYearLabel", { year: l })}
                    position={{ y: isMobile ? -128 : 0 }}
                    allowEscapeViewBox={{ y: true }}
                    wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
                  />

                  {comparing && crossoverYear !== null && (
                    <ReferenceLine
                      x={crossoverYear}
                      stroke="var(--color-muted-foreground)"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                      label={{
                        // A phone has no room for the words; the time alone still reads.
                        value: isMobile
                          ? fmtYM(crossoverYearsPart, crossoverMonthsPart)
                          : `${t("hypoteka.crossoverShort")} · ${fmtYM(
                              crossoverYearsPart,
                              crossoverMonthsPart,
                            )}`,
                        position: crossoverYear > years * 0.6 ? "insideTopRight" : "insideTopLeft",
                        offset: 0,
                        dy: -18,
                        fontSize: 12,
                        fill: "var(--color-foreground)",
                      }}
                    />
                  )}
                  {comparing && (
                    <Line
                      type="linear"
                      dataKey="balance"
                      name={t("hypoteka.legendBalanceStandardCompare")}
                      stroke="var(--color-muted-foreground)"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 3, strokeWidth: 0, fill: "var(--color-muted-foreground)" }}
                      isAnimationActive={false}
                    />
                  )}
                  {comparing && (
                    <Line
                      type="linear"
                      dataKey="invested"
                      name={t("hypoteka.legendInvested")}
                      stroke="var(--color-foreground)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3.5, strokeWidth: 0, fill: "var(--color-foreground)" }}
                      isAnimationActive={false}
                    />
                  )}
                  {comparing && (
                    <Line
                      type="linear"
                      dataKey="balanceExtra"
                      name={t("hypoteka.legendBalanceWithExtra")}
                      stroke="var(--color-brand)"
                      strokeWidth={2.25}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-brand)" }}
                      isAnimationActive={false}
                    />
                  )}
                  {!comparing && (
                    <Line
                      type="linear"
                      dataKey="paidInterest"
                      name={t("hypoteka.legendCumulativeInterest")}
                      stroke="var(--color-foreground)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3.5, strokeWidth: 0, fill: "var(--color-foreground)" }}
                      isAnimationActive={false}
                    />
                  )}
                  {!comparing && (
                    <Line
                      type="linear"
                      dataKey="balance"
                      name={t("hypoteka.legendBalanceStandard")}
                      stroke="var(--color-brand)"
                      strokeWidth={2.25}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-brand)" }}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {compare && (
            <Panel>
              <div className="p-5 md:p-6">
                <PanelHeader
                  title={t("hypoteka.compareTitle")}
                  subtitle={t("hypoteka.compareSubtitle", { extra: fmt(effectiveExtra) })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 border-t border-border divide-y divide-border md:divide-y-0 md:divide-x">
                {strategies.map((st) => {
                  const wins = st.key === winner;
                  return (
                    <div
                      key={st.key}
                      className={`relative px-5 md:px-6 py-5 ${wins ? "bg-surface" : ""}`}
                    >
                      {wins && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 top-0 h-0.5 bg-brand"
                        />
                      )}
                      <p className="text-[13px] font-medium text-muted-foreground">{st.label}</p>
                      <p
                        className={`mt-1.5 text-[22px] leading-tight font-semibold tabular-nums ${
                          st.muted ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {st.value}
                      </p>
                      {wins && (
                        <p className="mt-1 text-xs font-medium text-brand-dark">
                          {t("hypoteka.winnerTag")}
                        </p>
                      )}
                      {st.html ? (
                        <p
                          className="mt-2 text-[13px] text-muted-foreground leading-relaxed [&_strong]:font-medium [&_strong]:text-foreground"
                          dangerouslySetInnerHTML={{ __html: st.html }}
                        />
                      ) : (
                        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                          {st.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="px-5 md:px-6 py-4 border-t border-border text-xs text-muted-foreground">
                {t("hypoteka.compareNote", { years })}
              </p>
            </Panel>
          )}

          <Panel className="overflow-hidden">
            <div className="p-5 md:px-6 md:pt-6 md:pb-4">
              <PanelHeader
                title={t("hypoteka.tableTitle")}
                subtitle={t("hypoteka.tableSubtitle")}
              />
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm tabular-nums">
                <thead>
                  <tr className="text-xs text-muted-foreground border-t border-border">
                    <th className="h-10 px-6 font-normal">{t("hypoteka.tableYear")}</th>
                    <th className="h-10 px-6 font-normal text-right">
                      {t("hypoteka.tableInterest")}
                    </th>
                    <th className="h-10 px-6 font-normal text-right">
                      {t("hypoteka.tablePrincipal")}
                    </th>
                    <th className="h-10 px-6 font-normal text-right">
                      {t("hypoteka.tableBalance")}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {base.series.slice(1).map((s) => (
                    <tr key={s.year} className="border-t border-border">
                      <td className="h-10 px-6 text-foreground">
                        {t("hypoteka.yearRow", { n: s.year })}
                      </td>
                      <td className="h-10 px-6 text-right">{fmt(s.interestThisYear)}</td>
                      <td className="h-10 px-6 text-right">{fmt(s.principalThisYear)}</td>
                      <td className="h-10 px-6 text-right text-foreground font-medium">
                        {fmt(s.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-border border-t border-border">
              {mobileMilestones.map((s) => (
                <div key={s.year} className="px-4 py-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-foreground">
                      {t("hypoteka.yearRow", { n: s.year })}
                    </span>
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {fmt(s.balance)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums text-right">
                    {t("hypoteka.tableInterest")} {fmt(s.interestThisYear)} ·{" "}
                    {t("hypoteka.tablePrincipal")} {fmt(s.principalThisYear)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </main>
    </Layout>
  );
}
