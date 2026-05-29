import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
  formatNumber,
  type SupportedLocale,
} from "@investio/shared";
import { Layout } from "@/components/layout";
import { NumField } from "@/components/num-field";
import { ResetButton } from "@/components/reset-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useIsMobile } from "@/hooks/use-mobile";

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

type Mode = "basic" | "advanced";

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
  const fmtNum = (n: number) => formatNumber(n, locale);
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
          : effectiveExtra *
            ((Math.pow(1 + investMonthlyRate, months) - 1) / investMonthlyRate);
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
  const crossoverMonthsPart =
    crossoverMonthsTotal !== null ? crossoverMonthsTotal % 12 : 0;

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

  return (
    <Layout>
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h1 className="text-lg font-semibold text-foreground">{t("hypoteka.title")}</h1>
              <ResetButton onClick={reset} />
            </div>
            <p className="text-xs text-muted-foreground mb-5">{t("hypoteka.subtitle")}</p>

            <ModeToggle mode={mode} onChange={setMode} />

            <div className="space-y-5 mt-6">
              <NumField
                label={t("hypoteka.loanAmount")}
                value={principal}
                onChange={setPrincipal}
                suffix={currencySuffix}
                step={50000}
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
                  label={t("hypoteka.duration")}
                  value={years}
                  onChange={(v) => setYears(Math.max(1, Math.min(40, Math.round(v))))}
                  suffix={t("units.years")}
                  step={1}
                  min={1}
                  max={40}
                />
              </div>

              {isAdvanced && (
                <div className="pt-4 border-t border-border space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-1">
                      {t("hypoteka.extraTitle")}
                    </h2>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t("hypoteka.extraDescription")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {t("hypoteka.extraMonthly")}
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-brand">
                          <Info className="size-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="top">
                        {t("hypoteka.extraMonthlyTooltip")}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <NumField value={extra} onChange={setExtra} suffix={currencySuffix} step={500} />

                  <NumField
                    label={t("hypoteka.investRate")}
                    value={investRate}
                    onChange={setInvestRate}
                    suffix={t("units.pct")}
                    step={0.1}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card p-6 rounded-2xl border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("hypoteka.monthlyPayment")}
              </p>
              <p className="text-2xl font-bold text-foreground font-mono break-words">
                {fmt(base.monthlyPayment)}
              </p>
              {isAdvanced && effectiveExtra > 0 && (
                <p className="text-xs text-brand mt-2">
                  {t("hypoteka.monthlyPaymentExtra", {
                    extra: fmt(effectiveExtra),
                    total: fmt(base.monthlyPayment + effectiveExtra),
                  })}
                </p>
              )}
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("hypoteka.totalInterest")}
              </p>
              <p className="text-2xl font-bold text-foreground font-mono break-words">
                {fmt(base.totalInterest)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{t("hypoteka.totalInterestNote")}</p>
            </div>
            <div className="bg-card p-6 rounded-2xl border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("hypoteka.totalPaid")}
              </p>
              <p className="text-2xl font-bold text-foreground font-mono break-words">
                {fmt(base.totalPaid)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t("hypoteka.totalPaidNote", { years })}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-card p-6 md:p-8 rounded-2xl border border-border h-[420px] flex flex-col">
            <div className="flex justify-between items-end mb-4 flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {isAdvanced && effectiveExtra > 0
                    ? t("hypoteka.chartTitleCompare")
                    : t("hypoteka.chartTitleStandard")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isAdvanced && effectiveExtra > 0
                    ? t("hypoteka.chartDescCompare")
                    : t("hypoteka.chartDescStandard")}
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-brand" />
                  <span className="text-xs text-muted-foreground">
                    {isAdvanced && effectiveExtra > 0
                      ? t("hypoteka.legendBalanceWithExtra")
                      : t("hypoteka.legendBalanceStandard")}
                  </span>
                </div>
                {isAdvanced && effectiveExtra > 0 ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {t("hypoteka.legendBalanceStandardCompare")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-purple-500" />
                      <span className="text-xs text-muted-foreground">
                        {t("hypoteka.legendInvested")}
                      </span>
                    </div>
                    {crossoverYear !== null && (
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-destructive" />
                        <span className="text-xs text-muted-foreground">
                          {t("hypoteka.legendCrossover", { years: crossoverYear.toFixed(1) })}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {t("hypoteka.legendCumulativeInterest")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gInt" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--color-muted-foreground)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-muted-foreground)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[0, years]}
                    allowDecimals={false}
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickFormatter={(v) => `${v}${t("units.yearShort")}`}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickFormatter={(v) => `${fmtNum(v / 1000)}k`}
                    width={60}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--color-foreground)",
                    }}
                    labelStyle={{ color: "var(--color-muted-foreground)" }}
                    formatter={(value: number, name) => [fmt(value), name]}
                    labelFormatter={(l) => t("chart.tooltipYearLabel", { year: l })}
                    position={{ y: isMobile ? -128 : 0 }}
                    allowEscapeViewBox={{ y: true }}
                    wrapperStyle={{ zIndex: 20, pointerEvents: "none" }}
                  />

                  {isAdvanced && effectiveExtra > 0 && (
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name={t("hypoteka.legendBalanceStandardCompare")}
                      stroke="var(--color-muted-foreground)"
                      fill="none"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                    />
                  )}
                  {isAdvanced && effectiveExtra > 0 && (
                    <Area
                      type="monotone"
                      dataKey="invested"
                      name={t("hypoteka.legendInvested")}
                      stroke="#a855f7"
                      fill="url(#gInv)"
                      strokeWidth={2}
                    />
                  )}
                  {isAdvanced && effectiveExtra > 0 && (
                    <Area
                      type="monotone"
                      dataKey="balanceExtra"
                      name={t("hypoteka.legendBalanceWithExtra")}
                      stroke="var(--color-brand)"
                      fill="url(#gBal)"
                      strokeWidth={2.5}
                    />
                  )}
                  {isAdvanced && effectiveExtra > 0 && crossoverYear !== null && (
                    <ReferenceLine
                      x={crossoverYear}
                      isFront
                      stroke="var(--color-destructive)"
                      strokeWidth={1}
                    />
                  )}
                  {!(isAdvanced && effectiveExtra > 0) && (
                    <Area
                      type="monotone"
                      dataKey="paidInterest"
                      name={t("hypoteka.legendCumulativeInterest")}
                      stroke="var(--color-muted-foreground)"
                      fill="url(#gInt)"
                      strokeWidth={2}
                    />
                  )}
                  {!(isAdvanced && effectiveExtra > 0) && (
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name={t("hypoteka.legendBalanceStandard")}
                      stroke="var(--color-brand)"
                      fill="url(#gBal)"
                      strokeWidth={2.5}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {compare && effectiveExtra > 0 && (
            <div className="bg-card p-6 md:p-8 rounded-2xl border border-brand/30 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/30">
                  {t("hypoteka.compareBadge")}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {t("hypoteka.compareTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t("hypoteka.compareSubtitle", { extra: fmt(effectiveExtra) })}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                  className={`rounded-xl p-5 border ${
                    winner === "mortgage"
                      ? "bg-brand/10 border-brand/40"
                      : "bg-surface border-border"
                  }`}
                >
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {t("hypoteka.strategyA")}
                  </p>
                  <p className="text-2xl font-bold text-foreground font-mono break-words">
                    {fmt(compare.netExtraToMortgage)}
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-2 leading-relaxed [&_strong]:text-foreground"
                    dangerouslySetInnerHTML={{
                      __html: t("hypoteka.strategyADesc", {
                        payoff: fmtYM(payoffYears, payoffMonths),
                        saved: fmt(compare.interestSaved),
                      }),
                    }}
                  />
                </div>

                <div
                  className={`rounded-xl p-5 border ${
                    winner === "invest"
                      ? "bg-brand/10 border-brand/40"
                      : "bg-surface border-border"
                  }`}
                >
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {t("hypoteka.strategyB")}
                  </p>
                  <p className="text-2xl font-bold text-foreground font-mono break-words">
                    {fmt(compare.netExtraToInvest)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {t("hypoteka.strategyBDesc", {
                      years,
                      extra: fmt(effectiveExtra),
                      rate: fmtPct(investRate),
                    })}
                  </p>
                </div>

                <div className="rounded-xl p-5 border bg-surface border-emerald-500/40">
                  <p className="text-[11px] font-medium text-emerald-500 uppercase tracking-wider mb-1">
                    {t("hypoteka.strategyC")}
                  </p>
                  <p className="text-2xl font-bold text-foreground font-mono break-words">
                    {crossoverMonthsTotal !== null
                      ? fmtYM(crossoverYearsPart, crossoverMonthsPart)
                      : "—"}
                  </p>
                  {crossoverMonthsTotal !== null ? (
                    <p
                      className="text-xs text-muted-foreground mt-2 leading-relaxed [&_strong]:text-foreground"
                      dangerouslySetInnerHTML={{
                        __html: t("hypoteka.strategyCDesc", {
                          when: fmtYM(crossoverYearsPart, crossoverMonthsPart),
                        }),
                      }}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {t("hypoteka.strategyCNone")}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-surface rounded-xl p-4 border border-border">
                <p
                  className="text-sm text-foreground [&_strong]:text-brand"
                  dangerouslySetInnerHTML={{
                    __html:
                      winner === "mortgage"
                        ? t("hypoteka.winnerMortgage", {
                            diff: fmt(Math.abs(compare.difference)),
                          })
                        : t("hypoteka.winnerInvest", {
                            diff: fmt(Math.abs(compare.difference)),
                          }),
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t("hypoteka.compareNote", { years })}
                </p>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">{t("hypoteka.tableTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("hypoteka.tableSubtitle")}</p>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="py-3 px-6 font-medium">{t("hypoteka.tableYear")}</th>
                    <th className="py-3 px-6 font-medium text-right">
                      {t("hypoteka.tableInterest")}
                    </th>
                    <th className="py-3 px-6 font-medium text-right">
                      {t("hypoteka.tablePrincipal")}
                    </th>
                    <th className="py-3 px-6 font-medium text-right text-foreground">
                      {t("hypoteka.tableBalance")}
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground font-mono">
                  {base.series.slice(1).map((s) => (
                    <tr key={s.year} className="border-b border-border last:border-0">
                      <td className="py-3 px-6">{t("hypoteka.yearRow", { n: s.year })}</td>
                      <td className="py-3 px-6 text-right">{fmt(s.interestThisYear)}</td>
                      <td className="py-3 px-6 text-right">{fmt(s.principalThisYear)}</td>
                      <td className="py-3 px-6 text-right text-foreground">{fmt(s.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-border">
              {mobileMilestones.map((s) => (
                <div key={s.year} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">
                      {t("hypoteka.yearRow", { n: s.year })}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {fmt(s.balance)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <dt className="text-muted-foreground">{t("hypoteka.tableInterest")}</dt>
                    <dd className="text-right font-mono text-foreground">
                      {fmt(s.interestThisYear)}
                    </dd>
                    <dt className="text-muted-foreground">{t("hypoteka.tablePrincipal")}</dt>
                    <dd className="text-right font-mono text-foreground">
                      {fmt(s.principalThisYear)}
                    </dd>
                  </dl>
                </div>
              ))}
            </div>
          </div>
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
