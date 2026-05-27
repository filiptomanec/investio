import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { hapticLight, syncStatusBarStyle } from "@/lib/native";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, Moon, Sun } from "lucide-react";
import {
  calculateInvestment,
  formatCurrency,
  formatNumber,
  reformatRaw,
  caretSig,
  caretTarget,
  type SupportedLocale,
} from "@investio/shared";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguageSync } from "@/hooks/use-language-sync";

export const Route = createFileRoute("/")({
  component: Index,
});

interface NumFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  locale: SupportedLocale;
  suffix?: string;
  step?: number;
}

const intlLocaleTag: Record<SupportedLocale, string> = {
  cs: "cs-CZ",
  en: "en-US",
};

function NumField({ label, value, onChange, locale, suffix, step = 1 }: NumFieldProps) {
  const maxDecimals = step < 1 ? 2 : 0;
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Pending caret target to restore after React commits the new value.
  const pendingCaret = useRef<{ digits: number; seps: number } | null>(null);

  const formatPretty = (n: number): string => {
    if (!Number.isFinite(n)) return "";
    return new Intl.NumberFormat(intlLocaleTag[locale], {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
      useGrouping: true,
    })
      .formatToParts(n)
      .map((p) => (p.type === "group" ? " " : p.value))
      .join("");
  };

  const [text, setText] = useState(() => formatPretty(value));
  const [focused, setFocused] = useState(false);

  // Reformat from prop when value/locale change externally and user isn't editing.
  useEffect(() => {
    if (!focused) setText(formatPretty(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale]);

  // Restore caret after a live reformat. useLayoutEffect runs before the browser paints.
  useLayoutEffect(() => {
    if (pendingCaret.current && inputRef.current) {
      const pos = caretTarget(text, pendingCaret.current);
      inputRef.current.setSelectionRange(pos, pos);
      pendingCaret.current = null;
    }
  }, [text]);

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const raw = e.target.value;
            const rawCursor = e.target.selectionStart ?? raw.length;
            const sig = caretSig(raw, rawCursor);
            const { text: formatted, value: parsed } = reformatRaw(raw, locale, maxDecimals);
            pendingCaret.current = sig;
            setText(formatted);
            if (parsed !== null) onChange(parsed);
            else if (formatted === "") onChange(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(formatPretty(value));
          }}
          className="w-full bg-surface border border-border rounded-xl py-3 pl-4 pr-12 text-foreground font-mono focus:ring-2 focus:ring-brand/40 focus:border-brand outline-none transition-all"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function useTheme() {
  // SSR and first client render both default to "dark" so React hydration matches.
  // The pre-hydration script in __root.tsx sets the html class before paint, so
  // the visible background is already correct. We then sync this state to the
  // actual class via useLayoutEffect — only the toggle icon briefly mismatches
  // when light mode is saved, which is acceptable.
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const actual = document.documentElement.classList.contains("dark") ? "dark" : "light";
    if (actual !== theme) setTheme(actual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("investio-theme", theme);
    // Sync iOS status bar style with app theme (no-op on web)
    syncStatusBarStyle(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    // Fire haptic feedback on iOS (no-op on web)
    hapticLight();
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}

function Index() {
  useLanguageSync();
  const { t, i18n } = useTranslation();
  const locale = (i18n.language?.startsWith("en") ? "en" : "cs") as SupportedLocale;
  const fmt = (n: number) => formatCurrency(n, locale);
  const fmtNum = (n: number) => formatNumber(n, locale);
  const fmtPct = (n: number) =>
    new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Number.isFinite(n) ? n : 0);

  const { theme, toggle } = useTheme();
  const [initial, setInitial] = useState(100000);
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);
  const [inflation, setInflation] = useState(3.2);
  const [inflationEnabled, setInflationEnabled] = useState(true);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const effectiveInflation = inflationEnabled ? inflation : 0;

  const result = useMemo(
    () =>
      calculateInvestment({
        initial,
        monthly,
        annualRatePct: rate,
        years,
        inflationPct: effectiveInflation,
      }),
    [initial, monthly, rate, years, effectiveInflation],
  );

  const profit = result.finalNominal - result.totalContributions;

  const annualWithdrawalNominal = result.finalNominal * (withdrawalRate / 100);
  const monthlyWithdrawalNominal = annualWithdrawalNominal / 12;
  const annualWithdrawalReal = result.finalReal * (withdrawalRate / 100);
  const monthlyWithdrawalReal = annualWithdrawalReal / 12;

  const milestoneYears = [1, 5, 10, 15, 20, 25, 30, 40].filter((y) => y <= years);
  const milestones = milestoneYears
    .map((y) => result.series.find((s) => s.year === y))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground p-4 md:p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-brand rounded-lg flex items-center justify-center">
            <div className="size-4 bg-background rounded-sm rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            INVEST<span className="text-brand">IO</span>
          </span>
        </div>
        <nav className="flex items-center gap-3 md:gap-4 text-sm font-medium text-muted-foreground">
          <a
            href="#"
            className="hidden md:inline text-foreground hover:text-brand transition-colors"
          >
            {t("header.calculator")}
          </a>
          <a href="#metodika" className="hidden md:inline hover:text-brand transition-colors">
            {t("header.methodology")}
          </a>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={toggle}
            aria-label={t("header.toggleTheme")}
            className="size-9 inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors text-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inputs */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl">
            <h1 className="text-lg font-semibold text-foreground mb-1">{t("form.title")}</h1>
            <p className="text-xs text-muted-foreground mb-6">{t("form.subtitle")}</p>

            <div className="space-y-5">
              <NumField
                label={t("form.initialDeposit")}
                value={initial}
                onChange={setInitial}
                locale={locale}
                suffix={locale === "cs" ? "Kč" : "$"}
                step={1000}
              />
              <NumField
                label={t("form.monthlyContribution")}
                value={monthly}
                onChange={setMonthly}
                locale={locale}
                suffix={locale === "cs" ? "Kč" : "$"}
                step={500}
              />

              <div className="grid grid-cols-2 gap-4">
                <NumField
                  label={t("form.annualRate")}
                  value={rate}
                  onChange={(v) => setRate(Math.max(0, Math.min(100, v)))}
                  locale={locale}
                  suffix={t("units.pct")}
                  step={0.1}
                />
                <NumField
                  label={t("form.duration")}
                  value={years}
                  onChange={(v) => setYears(Math.max(1, Math.min(60, Math.round(v))))}
                  locale={locale}
                  suffix={t("units.years")}
                  step={1}
                />
              </div>

              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="inflation-toggle"
                    className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                  >
                    {t("form.enableInflation")}
                  </label>
                  <button
                    id="inflation-toggle"
                    type="button"
                    role="switch"
                    aria-checked={inflationEnabled}
                    onClick={() => setInflationEnabled((v) => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      inflationEnabled ? "bg-brand" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
                        inflationEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {inflationEnabled && (
                  <NumField
                    label={t("form.expectedInflation")}
                    value={inflation}
                    onChange={setInflation}
                    locale={locale}
                    suffix={t("units.pct")}
                    step={0.1}
                  />
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t("form.withdrawalRate")}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("form.withdrawalRateInfo")}
                        className="text-muted-foreground hover:text-brand"
                      >
                        <Info className="size-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="text-center">
                      {t("form.withdrawalRateTooltip")}
                    </PopoverContent>
                  </Popover>
                </div>
                <NumField
                  label=""
                  value={withdrawalRate}
                  onChange={(v) => setWithdrawalRate(Math.max(0, Math.min(20, v)))}
                  locale={locale}
                  suffix={t("units.pctPerYear")}
                  step={0.1}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="lg:col-span-8 space-y-6">
          <div className={`grid grid-cols-1 gap-4 ${inflationEnabled ? "md:grid-cols-2" : ""}`}>
            <div className="bg-card p-6 rounded-2xl border border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {t("results.nominalLabel")}
              </p>
              <p className="text-3xl font-bold text-foreground font-mono break-words">
                {fmt(result.finalNominal)}
              </p>
              <p className="text-xs text-brand mt-2 flex items-center gap-1">
                <span>▲</span> {fmt(profit)} {t("results.profitSuffix")}
              </p>
            </div>
            {inflationEnabled && (
              <div className="bg-card p-6 rounded-2xl border border-brand/30 relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/30">
                    {t("results.inflationAdjustedBadge")}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {t("results.realLabel")}
                </p>
                <p className="text-3xl font-bold text-foreground font-mono break-words">
                  {fmt(result.finalReal)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("results.realDescription", { pct: fmtPct(inflation) })}
                </p>
              </div>
            )}
          </div>

          {/* Passive income */}
          <div className="bg-card p-6 rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("results.passiveIncomeTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("results.passiveIncomeDescription", {
                    pct: fmtPct(withdrawalRate),
                    years,
                  })}
                </p>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-brand flex items-center gap-1 text-xs"
                  >
                    <Info className="size-3.5" />
                    {t("results.rule4Pct")}
                  </button>
                </PopoverTrigger>
                <PopoverContent side="left">{t("results.rule4PctTooltip")}</PopoverContent>
              </Popover>
            </div>
            <div className={`grid grid-cols-1 gap-4 ${inflationEnabled ? "md:grid-cols-2" : ""}`}>
              <div className="bg-surface rounded-xl p-4 border border-border">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {t("results.monthlyNominal")}
                </p>
                <p className="text-2xl font-bold text-foreground font-mono break-words">
                  {fmt(monthlyWithdrawalNominal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {fmt(annualWithdrawalNominal)} {t("results.annuallySuffix")}
                </p>
              </div>
              {inflationEnabled && (
                <div className="bg-surface rounded-xl p-4 border border-brand/30">
                  <p className="text-[11px] font-medium text-brand uppercase tracking-wider mb-1">
                    {t("results.monthlyReal")}
                  </p>
                  <p className="text-2xl font-bold text-foreground font-mono break-words">
                    {fmt(monthlyWithdrawalReal)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmt(annualWithdrawalReal)} {t("results.annuallySuffix")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-card p-6 md:p-8 rounded-2xl border border-border flex flex-col h-[420px]">
            <div className="flex justify-between items-end mb-6 flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t("chart.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {inflationEnabled
                    ? t("chart.descriptionWithInflation")
                    : t("chart.descriptionWithoutInflation")}
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-brand"></div>
                  <span className="text-xs text-muted-foreground">{t("chart.legendNominal")}</span>
                </div>
                {inflationEnabled && (
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
                    trigger="click"
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
                  />
                  <Area
                    type="monotone"
                    dataKey="contributions"
                    name={t("chart.legendContributions")}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="4 4"
                    fill="none"
                  />
                  {inflationEnabled && (
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

          {/* Breakdown — table on md+, stacked cards on mobile */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Desktop / tablet table */}
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
                    {inflationEnabled && (
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
                      {inflationEnabled && (
                        <td className="py-4 px-6 text-right text-brand">{fmt(m.real)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="md:hidden divide-y divide-border">
              {milestones.map((m) => (
                <div key={m.year} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-foreground">
                      {t("breakdown.yearOrdinal", { n: m.year })}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {fmt(m.nominal)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <dt className="text-muted-foreground">{t("breakdown.contributions")}</dt>
                    <dd className="text-right font-mono text-foreground">{fmt(m.contributions)}</dd>
                    <dt className="text-muted-foreground">{t("breakdown.interest")}</dt>
                    <dd className="text-right font-mono text-foreground">{fmt(m.interest)}</dd>
                    <dt className="text-muted-foreground">{t("breakdown.nominal")}</dt>
                    <dd className="text-right font-mono text-foreground">{fmt(m.nominal)}</dd>
                    {inflationEnabled && (
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
        </section>
      </main>

      <footer
        id="metodika"
        className="max-w-6xl mx-auto mt-12 text-muted-foreground text-xs py-8 border-t border-border leading-relaxed"
      >
        <p className="max-w-3xl">
          {t("footer.copyright", { year: new Date().getFullYear() })} — {t("footer.methodology")}
        </p>
        <p className="mt-3">
          <Link
            to="/privacy"
            className="hover:text-brand transition-colors underline underline-offset-2"
          >
            {i18n.language?.startsWith("en") ? "Privacy Policy" : "Zásady ochrany osobních údajů"}
          </Link>
        </p>
      </footer>
    </div>
  );
}
