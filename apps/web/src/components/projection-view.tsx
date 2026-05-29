import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  formatCurrency,
  formatNumber,
  type InvestmentResult,
  type SupportedLocale,
} from "@investio/shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  result: InvestmentResult;
  years: number;
  showReal: boolean;
}

export function ProjectionView({ result, years, showReal }: Props) {
  const { t, i18n } = useTranslation();
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "cs";
  const fmt = (n: number) => formatCurrency(n, locale);
  const fmtNum = (n: number) => formatNumber(n, locale);
  const isMobile = useIsMobile();

  const milestoneYears = [1, 5, 10, 15, 20, 25, 30, 40].filter((y) => y <= years);
  const milestones = milestoneYears
    .map((y) => result.series.find((s) => s.year === y))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <>
      <div className="bg-card p-6 md:p-8 rounded-2xl border border-border flex flex-col h-[420px]">
        <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t("chart.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {showReal
                ? t("chart.descriptionWithInflation")
                : t("chart.descriptionWithoutInflation")}
            </p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-brand"></div>
              <span className="text-xs text-muted-foreground">{t("chart.legendNominal")}</span>
            </div>
            {showReal && (
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-muted-foreground"></div>
                <span className="text-xs text-muted-foreground">{t("chart.legendReal")}</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("chart.realExplainerInfo")}
                      className="text-muted-foreground hover:text-brand"
                    >
                      <Info className="size-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top">{t("chart.realExplainer")}</PopoverContent>
                </Popover>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-foreground/30"></div>
              <span className="text-xs text-muted-foreground">
                {t("chart.legendContributions")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gNom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-muted-foreground)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-muted-foreground)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="year"
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
              <Area
                type="monotone"
                dataKey="contributions"
                name={t("chart.legendContributions")}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="4 4"
                fill="none"
              />
              {showReal && (
                <Area
                  type="monotone"
                  dataKey="real"
                  name={t("chart.legendReal")}
                  stroke="var(--color-muted-foreground)"
                  fill="url(#gReal)"
                  strokeWidth={2}
                />
              )}
              <Area
                type="monotone"
                dataKey="nominal"
                name={t("chart.legendNominal")}
                stroke="var(--color-brand)"
                fill="url(#gNom)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="py-4 px-6 font-medium">{t("breakdown.year")}</th>
                <th className="py-4 px-6 font-medium text-right">
                  {t("breakdown.contributions")}
                </th>
                <th className="py-4 px-6 font-medium text-right">{t("breakdown.interest")}</th>
                <th className="py-4 px-6 font-medium text-right text-foreground">
                  {t("breakdown.nominal")}
                </th>
                {showReal && (
                  <th className="py-4 px-6 font-medium text-right text-brand">
                    {t("breakdown.real")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-muted-foreground font-mono">
              {milestones.map((m) => (
                <tr key={m.year} className="border-b border-border last:border-0">
                  <td className="py-4 px-6">{t("breakdown.yearOrdinal", { n: m.year })}</td>
                  <td className="py-4 px-6 text-right">{fmt(m.contributions)}</td>
                  <td className="py-4 px-6 text-right">{fmt(m.interest)}</td>
                  <td className="py-4 px-6 text-right text-foreground">{fmt(m.nominal)}</td>
                  {showReal && (
                    <td className="py-4 px-6 text-right text-brand">{fmt(m.real)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border">
          {milestones.map((m) => (
            <div key={m.year} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">
                  {t("breakdown.yearOrdinal", { n: m.year })}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{fmt(m.nominal)}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <dt className="text-muted-foreground">{t("breakdown.contributions")}</dt>
                <dd className="text-right font-mono text-foreground">{fmt(m.contributions)}</dd>
                <dt className="text-muted-foreground">{t("breakdown.interest")}</dt>
                <dd className="text-right font-mono text-foreground">{fmt(m.interest)}</dd>
                <dt className="text-muted-foreground">{t("breakdown.nominal")}</dt>
                <dd className="text-right font-mono text-foreground">{fmt(m.nominal)}</dd>
                {showReal && (
                  <>
                    <dt className="text-brand">{t("breakdown.real")}</dt>
                    <dd className="text-right font-mono text-brand">{fmt(m.real)}</dd>
                  </>
                )}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
