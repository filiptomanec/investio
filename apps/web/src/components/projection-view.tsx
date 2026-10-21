import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { formatCurrency, type InvestmentResult, type SupportedLocale } from "@investio/shared";
import { LegendItem, Panel, PanelHeader } from "@/components/page-header";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  axisProps,
  compactFormatter,
  gridProps,
  tooltipContentStyle,
  tooltipLabelStyle,
  yearTicks,
} from "@/lib/chart";

interface Props {
  result: InvestmentResult;
  years: number;
  showReal: boolean;
}

export function ProjectionView({ result, years, showReal }: Props) {
  const { t, i18n } = useTranslation();
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "cs";
  const fmt = (n: number) => formatCurrency(n, locale);
  const fmtAxis = compactFormatter(locale);
  const isMobile = useIsMobile();

  const milestoneYears = [1, 5, 10, 15, 20, 25, 30, 40].filter((y) => y <= years);
  const milestones = milestoneYears
    .map((y) => result.series.find((s) => s.year === y))
    .filter((p): p is NonNullable<typeof p> => !!p);

  // Mint is the screen's one data hue: it marks the nominal portfolio, the
  // answer the page leads with. Purchasing power is ink, contributions grey.
  return (
    <>
      <Panel className="p-5 md:p-6">
        <PanelHeader
          title={t("chart.title")}
          subtitle={
            showReal ? t("chart.descriptionWithInflation") : t("chart.descriptionWithoutInflation")
          }
          aside={
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <LegendItem label={t("chart.legendNominal")} color="var(--color-brand)" />
              {showReal && (
                <LegendItem label={t("chart.legendReal")} color="var(--color-foreground)" />
              )}
              <LegendItem
                label={t("chart.legendContributions")}
                color="var(--color-muted-foreground)"
                dashed
              />
            </div>
          }
        />

        <div className="mt-5 h-[240px] md:h-[280px] -ml-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              <Line
                type="linear"
                dataKey="contributions"
                name={t("chart.legendContributions")}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "var(--color-muted-foreground)" }}
                isAnimationActive={false}
              />
              {showReal && (
                <Line
                  type="linear"
                  dataKey="real"
                  name={t("chart.legendReal")}
                  stroke="var(--color-foreground)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3.5, strokeWidth: 0, fill: "var(--color-foreground)" }}
                  isAnimationActive={false}
                />
              )}
              <Line
                type="linear"
                dataKey="nominal"
                name={t("chart.legendNominal")}
                stroke="var(--color-brand)"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-brand)" }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm tabular-nums">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="h-10 px-6 font-normal">{t("breakdown.year")}</th>
                <th className="h-10 px-6 font-normal text-right">{t("breakdown.contributions")}</th>
                <th className="h-10 px-6 font-normal text-right">{t("breakdown.interest")}</th>
                <th className="h-10 px-6 font-normal text-right">{t("breakdown.nominal")}</th>
                {showReal && (
                  <th className="h-10 px-6 font-normal text-right">{t("breakdown.real")}</th>
                )}
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {milestones.map((m) => (
                <tr key={m.year} className="border-t border-border">
                  <td className="h-11 px-6 text-foreground">
                    {t("breakdown.yearOrdinal", { n: m.year })}
                  </td>
                  <td className="h-11 px-6 text-right">{fmt(m.contributions)}</td>
                  <td className="h-11 px-6 text-right">{fmt(m.interest)}</td>
                  <td className="h-11 px-6 text-right text-foreground font-medium">
                    {fmt(m.nominal)}
                  </td>
                  {showReal && <td className="h-11 px-6 text-right">{fmt(m.real)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border">
          {milestones.map((m) => (
            <div key={m.year} className="px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-foreground">
                  {t("breakdown.yearOrdinal", { n: m.year })}
                </span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {fmt(m.nominal)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums text-right">
                {t("breakdown.contributions")} {fmt(m.contributions)} · {t("breakdown.interest")}{" "}
                {fmt(m.interest)}
                {showReal && (
                  <>
                    {" "}
                    · {t("breakdown.real")} {fmt(m.real)}
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
