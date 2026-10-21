import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, HandCoins, PiggyBank, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtMultiple, projectionInsights, useFitSticky } from "@/components/bento/kit";
import {
  ChartTip,
  HeroFigure,
  HeroLabel,
  HeroTile,
  InflationLoader,
  InputsHeader,
  LegendSwatch,
  ModeSwitch,
  Panel,
  PanelTitle,
  Slider,
  SplitBar,
  Sub,
  Tile,
  Toggle,
  Well,
  YearBadge,
  rise,
} from "@/components/bento/ui";
import { Layout } from "@/components/layout";
import { AnimatedNumber } from "@/hooks/use-animated-number";
import { useInvestmentModel } from "@/hooks/use-investment-model";
import { compactFormatter } from "@/lib/chart";

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

function InvestmentCalculator() {
  const m = useInvestmentModel();
  const { t, inputs: i, result, profit, fmt, fmtPct } = m;
  const sticky = useFitSticky<HTMLDivElement>();
  const ins = projectionInsights(result);
  const axis = compactFormatter(m.locale);
  const pct = (share: number) => Math.round(share * 100);

  const bars = result.series.filter((p) => p.year > 0);
  const rows = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60]
    .filter((y) => y <= i.years)
    .map((y) => result.series.find((s) => s.year === y))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <Layout>
      {/* On a phone the inputs come first; the answer stays pinned on top. */}
      <div className="sticky top-0 z-40 px-4 pt-2 lg:hidden">
        <div className="flex items-center justify-between rounded-2xl bg-(--b-hero) px-4 py-3 text-(--b-hero-ink) shadow-lg ring-1 ring-(--b-hero-ring)">
          <span className="text-xs text-(--b-hero-muted)">
            {t("results.inYears", { count: i.years })}
          </span>
          <span className="text-xl font-semibold tabular-nums">
            <AnimatedNumber value={result.finalNominal} format={fmt} />
          </span>
        </div>
      </div>

      <main className="mx-auto mt-3 grid max-w-7xl grid-cols-1 gap-4 px-4 md:px-8 lg:mt-0 lg:grid-cols-[360px_1fr]">
        <Panel
          ref={sticky.ref}
          className="rise self-start p-6 lg:sticky"
          style={{ ...rise(1), top: sticky.top }}
        >
          <InputsHeader title={t("investice.planTitle")} onReset={m.reset} />
          <ModeSwitch mode={m.mode} onChange={m.setMode} />
          <div className="mt-6 space-y-6">
            <Slider
              label={t("form.initialDeposit")}
              value={i.initial}
              onChange={i.setInitial}
              min={0}
              max={3_000_000}
              step={10_000}
              suffix={m.currencySuffix}
            />
            <Slider
              label={t("form.monthlyContribution")}
              value={i.monthly}
              onChange={i.setMonthly}
              min={0}
              max={50_000}
              step={500}
              suffix={m.currencySuffix}
            />
            <Slider
              label={t("form.annualRate")}
              value={i.rate}
              onChange={i.setRate}
              min={0}
              max={15}
              step={0.1}
              suffix={t("units.pct")}
            />
            <Slider
              label={t("form.duration")}
              value={i.years}
              onChange={i.setYears}
              min={1}
              max={50}
              step={1}
              suffix={t("units.years")}
            />
          </div>

          {m.isAdvanced && (
            <Well>
              <Toggle
                label={t("form.enableInflation")}
                checked={i.inflationEnabled}
                onChange={i.setInflationEnabled}
              />
              {i.inflationEnabled && (
                <>
                  <Slider
                    label={t("form.expectedInflation")}
                    value={i.inflation}
                    onChange={i.setInflation}
                    min={0}
                    max={10}
                    step={0.1}
                    suffix={t("units.pct")}
                  />
                  <InflationLoader years={i.years} {...m.inflationLoad} />
                  <Toggle
                    label={t("advanced.indexContributions")}
                    checked={i.indexContributions}
                    onChange={i.setIndexContributions}
                    info={t("advanced.indexContributionsTooltip")}
                  />
                </>
              )}
              <Slider
                label={t("form.withdrawalRate")}
                value={i.withdrawalRate}
                onChange={i.setWithdrawalRate}
                min={1}
                max={10}
                step={0.1}
                suffix={t("units.pct")}
                info={t("form.withdrawalRateTooltip")}
              />
            </Well>
          )}
        </Panel>

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <HeroTile i={2} className="sm:col-span-2">
            <HeroLabel>{t("results.heroLabel", { count: i.years })}</HeroLabel>
            <HeroFigure>
              <AnimatedNumber value={result.finalNominal} format={fmt} />
            </HeroFigure>
            {ins.multiple !== null && ins.multiple > 1 && (
              <p className="mt-3 text-[15px] text-(--b-hero-soft)">
                {t("results.multipleBefore")}{" "}
                <b className="font-semibold text-(--b-mint)">
                  {fmtMultiple(ins.multiple, m.locale)}×
                </b>{" "}
                {t("results.multipleAfter")}
              </p>
            )}
            <SplitBar
              left={result.totalContributions}
              right={Math.max(0, profit)}
              leftLabel={t("results.ownShare", { pct: pct(1 - ins.interestShare) })}
              rightLabel={t("results.interestShare", { pct: pct(ins.interestShare) })}
            />
          </HeroTile>

          <Tile
            i={3}
            tone="sky"
            icon={<PiggyBank className="size-5" />}
            label={t("results.contributedTile")}
          >
            <AnimatedNumber value={result.totalContributions} format={fmt} />
            <Sub>
              {t("results.contributedSub", { initial: fmt(i.initial), monthly: fmt(i.monthly) })}
            </Sub>
          </Tile>
          <Tile
            i={4}
            tone="mint"
            icon={<HandCoins className="size-5" />}
            label={t("results.interestTile")}
          >
            {profit > 0 ? "+ " : ""}
            <AnimatedNumber value={profit} format={fmt} />
            <Sub>
              {ins.breakEven
                ? t("results.breakEvenSub", { year: ins.breakEven.year })
                : t("results.noBreakEven")}
            </Sub>
          </Tile>

          {m.isAdvanced && (
            <>
              <Tile
                i={5}
                tone="lilac"
                icon={<Wallet className="size-5" />}
                label={t("results.realTile")}
              >
                {m.showReal ? (
                  <AnimatedNumber value={result.finalReal} format={fmt} />
                ) : (
                  fmt(result.finalNominal)
                )}
                <Sub>
                  {m.showReal
                    ? t("results.realSub", { pct: fmtPct(i.inflation) })
                    : t("results.enableInflationHint")}
                </Sub>
              </Tile>
              <Tile
                i={6}
                tone="stone"
                icon={<CalendarClock className="size-5" />}
                label={t("results.rentMonthly")}
              >
                <AnimatedNumber value={m.income.monthlyNominal} format={fmt} />
                <Sub>
                  {t("results.rentSub", { pct: fmtPct(i.withdrawalRate) })}
                  {m.showReal && t("results.rentToday", { value: fmt(m.income.monthlyReal) })}
                </Sub>
              </Tile>
            </>
          )}

          <Panel className="rise p-5 sm:col-span-2 md:p-7" style={rise(7)}>
            <PanelTitle
              title={t("chart.yearByYear")}
              subtitle={t("chart.yearByYearSub")}
              aside={
                <div className="flex gap-4 text-xs text-(--b-muted)">
                  <LegendSwatch color="var(--b-sky)" label={t("breakdown.contributions")} />
                  <LegendSwatch color="var(--b-mint)" label={t("breakdown.interest")} />
                </div>
              }
            />
            <div className="mt-5 h-[260px] -ml-2 md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bars}
                  margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid vertical={false} stroke="var(--b-grid)" />
                  <XAxis
                    dataKey="year"
                    stroke="var(--b-axis)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval="preserveStartEnd"
                    minTickGap={18}
                  />
                  <YAxis
                    tickFormatter={axis}
                    stroke="var(--b-axis)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={76}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--b-cursor)", radius: 8 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload as (typeof bars)[number];
                      return (
                        <ChartTip
                          title={t("breakdown.yearOrdinal", { n: label })}
                          value={fmt(p.nominal)}
                          rows={[
                            {
                              label: t("breakdown.contributions"),
                              value: fmt(p.contributions),
                              color: "var(--b-sky)",
                            },
                            {
                              label: t("breakdown.interest"),
                              value: fmt(p.interest),
                              color: "var(--b-mint)",
                            },
                            ...(m.showReal
                              ? [
                                  {
                                    label: t("breakdown.real"),
                                    value: fmt(p.real),
                                    color: "var(--b-lilac-ink)",
                                  },
                                ]
                              : []),
                          ]}
                        />
                      );
                    }}
                  />
                  <Bar
                    dataKey="contributions"
                    stackId="s"
                    fill="var(--b-sky)"
                    animationDuration={900}
                  />
                  <Bar
                    dataKey="interest"
                    stackId="s"
                    fill="var(--b-mint)"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1100}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="rise p-3 sm:col-span-2" style={rise(8)}>
            {rows.map((p) => {
              const share = p.nominal > 0 ? Math.max(0, p.interest) / p.nominal : 0;
              return (
                <div
                  key={p.year}
                  className="flex items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-(--b-well)"
                >
                  <YearBadge>{t("breakdown.yearBadge", { n: p.year })}</YearBadge>
                  <div className="min-w-0 flex-1">
                    <div className="flex h-2 overflow-hidden rounded-full bg-(--b-sky-soft)">
                      <div
                        className="ml-auto h-full bg-(--b-mint)"
                        style={{ width: `${share * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 truncate text-xs text-(--b-muted) tabular-nums">
                      {t("results.rowSub", {
                        contributions: fmt(p.contributions),
                        interest: fmt(p.interest),
                      })}
                      {m.showReal && ` · ${t("breakdown.real").toLowerCase()} ${fmt(p.real)}`}
                    </p>
                  </div>
                  <span className="w-28 shrink-0 text-right text-base font-semibold tabular-nums sm:w-32">
                    {fmt(p.nominal)}
                  </span>
                </div>
              );
            })}
          </Panel>
        </section>
      </main>
    </Layout>
  );
}
