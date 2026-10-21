import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Flag,
  Loader2,
  RefreshCw,
  RotateCcw,
  Scale,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { NumField } from "@/components/num-field";
import { AnimatedNumber } from "@/hooks/use-animated-number";
import { useInvestmentModel, type Mode } from "@/hooks/use-investment-model";
import { compactFormatter } from "@/lib/chart";
import { cn } from "@/lib/utils";
import { Reveal, Segmented, fmtMultiple, projectionInsights } from "./kit";
import { yearsCs } from "./copy";

// Direction C, "Časová osa": the plan is written as a sentence with the
// numbers inside it; a dark band holds a year scrubber that travels through
// time, and the story below names the moments that matter (break-even, the
// first million) as a timeline that reveals on scroll. Light and dark.

export function DirectionC() {
  const m = useInvestmentModel();
  const { inputs: i, result, profit, fmt, fmtPct } = m;
  const ins = projectionInsights(result);
  const axis = compactFormatter(m.locale);
  const startYear = new Date().getFullYear();

  // The scrubbed year follows the end of the plan unless the user moved it.
  const [sel, setSel] = useState(i.years);
  const pinnedToEnd = useRef(true);
  useEffect(() => {
    if (pinnedToEnd.current || sel > i.years) setSel(i.years);
  }, [i.years, sel]);
  const point =
    result.series.find((p) => p.year === sel) ?? result.series[result.series.length - 1];
  const pickYear = (y: number) => {
    pinnedToEnd.current = y >= i.years;
    setSel(y);
  };

  const events = [
    ins.breakEven && {
      year: ins.breakEven.year,
      icon: <Scale className="size-4" />,
      title: "Bod zlomu",
      text: `Úrok poprvé vydělal víc než všechny tvoje vklady dohromady (${fmt(ins.breakEven.interest)}).`,
    },
    ins.million && {
      year: ins.million.year,
      icon: <Trophy className="size-4" />,
      title: m.locale === "cs" ? "První milion" : "First million",
      text: `Portfolio přesáhne ${fmt(1_000_000)}, přesně ${fmt(ins.million.nominal)}.`,
    },
    {
      year: Math.max(1, Math.round(i.years / 2)),
      icon: <Flag className="size-4" />,
      title: "Polovina cesty",
      text: `Máš ${fmt(result.series.find((p) => p.year === Math.max(1, Math.round(i.years / 2)))?.nominal ?? 0)}, ale to hlavní teprve přijde.`,
    },
    {
      year: i.years,
      icon: <Sparkles className="size-4" />,
      title: "Cíl",
      text: `${fmt(result.finalNominal)}, z toho ${Math.round(ins.interestShare * 100)} % vydělal úrok.`,
    },
  ]
    .filter((e): e is NonNullable<typeof e> => !!e)
    // The half-way mark only earns a place when nothing else happens near it.
    .filter(
      (e, _, all) =>
        e.title !== "Polovina cesty" || !all.some((o) => o !== e && Math.abs(o.year - e.year) <= 1),
    )
    .sort((a, b) => a.year - b.year);

  return (
    <div className="min-h-screen bg-[#fbfaf7] pb-28 text-[#141413] [font-family:Geist,ui-sans-serif,system-ui] dark:bg-[#0e0e0d] dark:text-[#f1f0eb]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-[#141413] text-[#3ddc97] dark:bg-[#f1f0eb] dark:text-[#0e0e0d]">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                d="M4 18c5-.3 8.5-1.8 11-6.5S18 6 19 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">Investio</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {[
            ["/", "Investice"],
            ["/renta", "Renta"],
            ["/hypoteka", "Hypotéka"],
          ].map(([to, label], idx) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "rounded-full px-4 py-2 transition-colors",
                idx === 0
                  ? "bg-[#141413] text-white dark:bg-[#f1f0eb] dark:text-[#0e0e0d]"
                  : "text-[#6d6c66] hover:text-[#141413] dark:text-[#a3a29c] dark:hover:text-white",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <span className="text-xs text-[#6d6c66] dark:text-[#a3a29c]">CS / EN</span>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-8">
        {/* The plan, as a sentence */}
        <section className="rise pt-4 md:pt-10" style={{ "--i": 1 } as React.CSSProperties}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented<Mode>
              value={m.mode}
              onChange={m.setMode}
              options={[
                { value: "basic", label: "Základní" },
                { value: "advanced", label: "Rozšířená" },
              ]}
              className="h-10 rounded-full bg-[#efede6] p-1 dark:bg-[#1c1c1a]"
              pillClassName="rounded-full bg-white shadow-sm dark:bg-[#33332f]"
              activeClassName="text-[#141413] dark:text-white"
              inactiveClassName="text-[#6d6c66] dark:text-[#a3a29c]"
            />
            <button
              type="button"
              onClick={m.reset}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-[#6d6c66] transition hover:bg-[#efede6] dark:text-[#a3a29c] dark:hover:bg-[#1c1c1a]"
            >
              <RotateCcw className="size-3.5" /> Výchozí hodnoty
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-2.5 gap-y-3 text-[24px] font-medium leading-snug tracking-[-0.015em] md:text-[34px]">
            <span>Začnu s</span>
            <Inline
              value={i.initial}
              onChange={i.setInitial}
              suffix={m.currencySuffix}
              step={10_000}
              label="Počáteční vklad"
            />
            <span>a každý měsíc přidám</span>
            <Inline
              value={i.monthly}
              onChange={i.setMonthly}
              suffix={m.currencySuffix}
              step={500}
              label="Měsíční vklad"
              trail="."
            />
            <span>Při výnosu</span>
            <Inline value={i.rate} onChange={i.setRate} suffix="%" step={0.1} label="Roční výnos" />
            <span>ročně nechám peníze růst</span>
            <Inline
              value={i.years}
              onChange={i.setYears}
              suffix={yearsCs(i.years)}
              step={1}
              label="Doba v letech"
              trail="."
            />
          </div>

          {m.isAdvanced && (
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-3 text-lg text-[#45443f] dark:text-[#c8c6bf] md:text-xl">
              <Check
                label="Počítám s inflací"
                checked={i.inflationEnabled}
                onChange={i.setInflationEnabled}
              />
              {i.inflationEnabled && (
                <>
                  <Inline
                    value={i.inflation}
                    onChange={i.setInflation}
                    suffix="%"
                    step={0.1}
                    small
                    label="Inflace"
                  />
                  <button
                    type="button"
                    onClick={m.inflationLoad.load}
                    disabled={m.inflationLoad.loading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#dedbd2] px-3 py-1.5 text-sm transition hover:bg-[#efede6] disabled:opacity-60 dark:border-[#33332f] dark:hover:bg-[#1c1c1a]"
                  >
                    {m.inflationLoad.loading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    podle ČR
                  </button>
                  <Check
                    label="a vklad o ni navyšuji"
                    checked={i.indexContributions}
                    onChange={i.setIndexContributions}
                  />
                </>
              )}
              <span>· V důchodu vybírám</span>
              <Inline
                value={i.withdrawalRate}
                onChange={i.setWithdrawalRate}
                suffix="%"
                step={0.1}
                small
                label="Roční výběr"
              />
              <span>ročně.</span>
              {m.inflationLoad.error && (
                <span className="text-sm text-[#c4423a]">{m.inflationLoad.error}</span>
              )}
            </div>
          )}
        </section>

        {/* The time band */}
        <section
          className="rise mt-10 overflow-hidden rounded-[32px] bg-[#141413] text-[#f1f0eb] ring-1 ring-black/5 dark:bg-[#181816] dark:ring-white/[0.06] md:mt-14"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:p-10">
            <div className="flex flex-col justify-center">
              <p className="text-sm text-[#a3a29c]">
                V roce <span className="text-white">{startYear + sel}</span> · po {sel}{" "}
                {yearsCs(sel)}
              </p>
              <p className="mt-2 text-[44px] font-semibold leading-none tracking-[-0.035em] tabular-nums md:text-[64px]">
                <AnimatedNumber value={point.nominal} format={fmt} duration={450} />
              </p>
              <div className="mt-5 space-y-2 text-sm tabular-nums">
                <Line2 color="#f1f0eb" label="Tvoje vklady" value={fmt(point.contributions)} />
                <Line2
                  color="#3ddc97"
                  label="Úrok přidal"
                  value={fmt(Math.max(0, point.interest))}
                />
                {m.showReal && (
                  <Line2 color="#8f8d86" label="V dnešních cenách" value={fmt(point.real)} />
                )}
              </div>
            </div>
            <div className="h-[240px] md:h-[300px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={result.series}
                  margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
                  onClick={(e) => {
                    const y = Number(e?.activeLabel);
                    if (Number.isFinite(y)) pickYear(y);
                  }}
                >
                  <defs>
                    <linearGradient id="c-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3ddc97" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#3ddc97" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" type="number" domain={[0, i.years]} hide />
                  <YAxis
                    tickFormatter={axis}
                    stroke="#6d6c66"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                    orientation="right"
                  />
                  <Area
                    type="monotone"
                    dataKey="contributions"
                    stroke="#6d6c66"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    fill="none"
                    animationDuration={900}
                  />
                  <Area
                    type="monotone"
                    dataKey="nominal"
                    stroke="#3ddc97"
                    strokeWidth={3}
                    fill="url(#c-area)"
                    animationDuration={1300}
                    style={{ cursor: "pointer" }}
                  />
                  <ReferenceLine x={sel} stroke="rgb(255 255 255 / 0.35)" strokeDasharray="3 3" />
                  <ReferenceDot
                    x={sel}
                    y={point.nominal}
                    r={7}
                    fill="#3ddc97"
                    stroke="#141413"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Year scrubber */}
          <div className="border-t border-white/[0.07] px-6 pb-6 pt-5 md:px-10 [--range-fill:#3ddc97] [--range-track:rgb(255_255_255/0.12)] [--range-thumb:#141413]">
            <input
              type="range"
              className="range"
              aria-label="Rok"
              min={0}
              max={i.years}
              step={1}
              value={sel}
              style={{ "--fill": `${(sel / i.years) * 100}%` } as React.CSSProperties}
              onChange={(e) => pickYear(Number(e.target.value))}
            />
            <div className="mt-2 flex justify-between text-xs text-[#8f8d86] tabular-nums">
              <span>{startYear}</span>
              <span className="hidden sm:inline">Táhni a projeď si čas</span>
              <span>{startYear + i.years}</span>
            </div>
          </div>
        </section>

        {/* The three-step story */}
        <section
          className="rise mt-6 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <Step
            label="Vložíš"
            value={<AnimatedNumber value={result.totalContributions} format={fmt} />}
            note={`${fmt(i.monthly)} měsíčně po ${i.years} ${yearsCs(i.years)}`}
          />
          <Arrow />
          <Step
            accent
            label="Úrok přidá"
            value={
              <>
                + <AnimatedNumber value={Math.max(0, profit)} format={fmt} />
              </>
            }
            note={`${fmtPct(i.rate)} % ročně, složeně`}
          />
          <Arrow />
          <Step
            strong
            label="Budeš mít"
            value={<AnimatedNumber value={result.finalNominal} format={fmt} />}
            note={ins.multiple ? `${fmtMultiple(ins.multiple, m.locale)}× tvých vkladů` : ""}
          />
        </section>

        {m.isAdvanced && (
          <section className="mt-3 grid gap-3 md:grid-cols-2">
            <Step
              label="V dnešních cenách"
              value={m.showReal ? <AnimatedNumber value={result.finalReal} format={fmt} /> : "—"}
              note={m.showReal ? `Při ${fmtPct(i.inflation)} % inflaci` : "Zapni inflaci"}
            />
            <Step
              accent
              label="Renta měsíčně"
              value={<AnimatedNumber value={m.income.monthlyNominal} format={fmt} />}
              note={`Výběr ${fmtPct(i.withdrawalRate)} % ročně${m.showReal ? ` · dnes ${fmt(m.income.monthlyReal)}` : ""}`}
            />
          </section>
        )}

        {/* Timeline of moments */}
        <section className="mt-16 md:mt-24">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Momenty, na které se těšit
          </h2>
          <ol className="relative mt-8 space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e4e2da] dark:before:bg-[#262624]">
            {events.map((e, idx) => (
              <li key={e.title}>
                <Reveal delay={idx * 90} className="relative flex gap-5">
                  <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-[#141413] text-[#3ddc97] ring-4 ring-[#fbfaf7] dark:bg-[#f1f0eb] dark:text-[#0e0e0d] dark:ring-[#0e0e0d]">
                    {e.icon}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      pickYear(e.year);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex-1 rounded-3xl bg-white p-5 text-left ring-1 ring-black/[0.05] transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-[#161615] dark:ring-white/[0.06]"
                  >
                    <p className="text-sm text-[#6d6c66] dark:text-[#a3a29c] tabular-nums">
                      {startYear + e.year} · {e.year}. rok
                    </p>
                    <p className="mt-0.5 text-lg font-semibold">{e.title}</p>
                    <p className="mt-1 text-[15px] text-[#45443f] dark:text-[#c8c6bf]">{e.text}</p>
                  </button>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

function Inline({
  value,
  onChange,
  suffix,
  step,
  small,
  label,
  trail,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  step: number;
  small?: boolean;
  trail?: string;
  label: string;
}) {
  // Each field is as wide as the number in it, so the sentence reads evenly.
  const chars = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value).length;
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="inline-block" style={{ width: `${Math.max(1.5, chars) + 0.7}ch` }}>
        <NumField
          value={value}
          onChange={onChange}
          step={step}
          ariaLabel={label}
          inputClassName={cn(
            "w-full bg-transparent border-0 border-b-2 border-[#3ddc97] px-0.5 pb-0.5 font-semibold text-[#0f8a63] tabular-nums outline-none transition focus:border-[#141413] focus:bg-[#3ddc97]/10 dark:text-[#3ddc97] dark:focus:border-white",
            small ? "text-lg md:text-xl" : "text-[24px] md:text-[34px]",
          )}
        />
      </span>
      <span
        className={cn(
          "text-[#6d6c66] dark:text-[#a3a29c]",
          small ? "text-base" : "text-xl md:text-2xl",
        )}
      >
        {suffix}
        {trail && <span className="text-[#141413] dark:text-[#f1f0eb]">{trail}</span>}
      </span>
    </span>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={cn(
          "grid size-6 place-items-center rounded-md border-2 transition-colors",
          checked
            ? "border-[#3ddc97] bg-[#3ddc97] text-[#0e0e0d]"
            : "border-[#c9c6bc] dark:border-[#45443f]",
        )}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
            <path
              d="M3 8.5l3 3 7-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

function Line2({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-2 last:border-0">
      <span className="flex items-center gap-2 text-[#a3a29c]">
        <span className="size-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function Step({
  label,
  value,
  note,
  accent,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6 ring-1 transition duration-300 hover:-translate-y-0.5",
        strong
          ? "bg-[#3ddc97] text-[#0e0e0d] ring-transparent"
          : accent
            ? "bg-[#e6f8ef] text-[#0b4f38] ring-[#3ddc97]/30 dark:bg-[#11271e] dark:text-[#b6f0d4]"
            : "bg-white ring-black/[0.05] dark:bg-[#161615] dark:ring-white/[0.06]",
      )}
    >
      <p className="text-sm opacity-75">{label}</p>
      <p className="mt-1.5 text-[30px] font-semibold leading-tight tracking-tight tabular-nums">
        {value}
      </p>
      {note && <p className="mt-1 text-sm opacity-75">{note}</p>}
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden items-center justify-center text-[#b9b6ac] md:flex dark:text-[#45443f]">
      <ArrowRight className="size-6" />
    </div>
  );
}
