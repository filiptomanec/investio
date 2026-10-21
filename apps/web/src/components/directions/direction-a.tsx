import { Link } from "@tanstack/react-router";
import { Loader2, RefreshCw, RotateCcw } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatedNumber } from "@/hooks/use-animated-number";
import { useInvestmentModel, type Mode } from "@/hooks/use-investment-model";
import { compactFormatter, yearTicks } from "@/lib/chart";
import { cn } from "@/lib/utils";
import { Segmented, SliderField, fmtMultiple, projectionInsights } from "./kit";
import { yearsCs } from "./copy";

// Direction A, "Grafit": a dark premium fintech screen. Warm graphite, one
// mint glow behind the result, a large counting figure, a layered chart of
// what you paid in against what interest added, and milestone cards.

const C = {
  mint: "#5be0b0",
  mintDeep: "#1f9c73",
  ink: "#f2f1ec",
  muted: "#9d9b94",
  faint: "#6c6b66",
  contrib: "#3b3b38",
  coral: "#f07a6c",
};

export function DirectionA() {
  const m = useInvestmentModel();
  const { inputs: i, result, profit, fmt, fmtPct } = m;
  const ins = projectionInsights(result);
  const axis = compactFormatter(m.locale);
  const startYear = new Date().getFullYear();

  const milestoneYears = [5, 10, 15, 20, 25, 30, 40, 50].filter((y) => y < i.years);
  const milestones = [...milestoneYears.slice(-4), i.years]
    .map((y) => result.series.find((s) => s.year === y))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0f0f0e] text-[#f2f1ec] pb-28 [font-family:Geist,ui-sans-serif,system-ui] [--range-fill:#5be0b0] [--range-track:rgb(255_255_255/0.1)] [--range-thumb:#0f0f0e]"
      style={{ colorScheme: "dark" }}
    >
      {/* One soft mint light behind the result. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/3 size-[720px] rounded-full bg-[#5be0b0]/[0.07] blur-[140px]"
      />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-[#5be0b0] text-[#0f0f0e]">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                d="M4 18c5-.3 8.5-1.8 11-6.5S18 6 19 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">Investio</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
          {[
            ["/", "Investice"],
            ["/renta", "Renta"],
            ["/hypoteka", "Hypotéka"],
          ].map(([to, label], idx) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                idx === 0 ? "bg-white/10 text-white" : "text-[#9d9b94] hover:text-white",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <span className="text-xs text-[#6c6b66]">CS / EN</span>
      </header>

      {/* On a phone the inputs come first; the answer stays pinned on top. */}
      <div className="sticky top-0 z-40 px-4 pt-2 lg:hidden">
        <div className="flex items-center justify-between rounded-2xl bg-[#16261f]/90 px-4 py-3 ring-1 ring-[#5be0b0]/20 backdrop-blur-md">
          <span className="text-xs text-[#9d9b94]">V roce {startYear + i.years}</span>
          <span className="text-xl font-semibold tabular-nums">
            <AnimatedNumber value={result.finalNominal} format={fmt} />
          </span>
        </div>
      </div>

      <main className="relative mx-auto mt-3 grid max-w-7xl lg:mt-0 grid-cols-1 gap-5 px-4 md:px-8 lg:grid-cols-[380px_1fr] lg:gap-6">
        {/* Inputs */}
        <aside
          className="rise lg:sticky lg:top-6 self-start rounded-3xl bg-[#171716] p-6 ring-1 ring-white/[0.06]"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Investiční kalkulačka</h1>
            <button
              type="button"
              onClick={m.reset}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[#9d9b94] ring-1 ring-white/10 transition hover:bg-white/5 hover:text-white"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          </div>
          <Segmented<Mode>
            value={m.mode}
            onChange={m.setMode}
            options={[
              { value: "basic", label: "Základní" },
              { value: "advanced", label: "Rozšířená" },
            ]}
            className="mt-5 grid w-full grid-cols-2 rounded-full bg-black/40 p-1 h-11 ring-1 ring-white/[0.06]"
            pillClassName="rounded-full bg-[#5be0b0] shadow-[0_0_24px_rgb(91_224_176/0.35)]"
            activeClassName="text-[#0f0f0e]"
            inactiveClassName="text-[#9d9b94] hover:text-white"
          />

          <div className="mt-6 space-y-6">
            <Slider
              label="Počáteční vklad"
              value={i.initial}
              onChange={i.setInitial}
              min={0}
              max={3_000_000}
              step={10_000}
              suffix={m.currencySuffix}
            />
            <Slider
              label="Měsíční vklad"
              value={i.monthly}
              onChange={i.setMonthly}
              min={0}
              max={50_000}
              step={500}
              suffix={m.currencySuffix}
            />
            <Slider
              label="Roční výnos"
              value={i.rate}
              onChange={i.setRate}
              min={0}
              max={15}
              step={0.1}
              suffix="%"
            />
            <Slider
              label="Doba"
              value={i.years}
              onChange={i.setYears}
              min={1}
              max={50}
              step={1}
              suffix="let"
            />
          </div>

          {m.isAdvanced && (
            <div className="mt-7 space-y-5 border-t border-white/[0.06] pt-6">
              <Toggle
                label="Započítat inflaci"
                checked={i.inflationEnabled}
                onChange={i.setInflationEnabled}
              />
              {i.inflationEnabled && (
                <>
                  <Slider
                    label="Inflace"
                    value={i.inflation}
                    onChange={i.setInflation}
                    min={0}
                    max={10}
                    step={0.1}
                    suffix="%"
                  />
                  <button
                    type="button"
                    onClick={m.inflationLoad.load}
                    disabled={m.inflationLoad.loading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.05] py-2.5 text-sm ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {m.inflationLoad.loading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5 text-[#5be0b0]" />
                    )}
                    Průměrná inflace ČR za {i.years} {yearsCs(i.years)}
                  </button>
                  {m.inflationLoad.meta && (
                    <p className="text-xs text-[#9d9b94]">
                      Průměr {m.inflationLoad.meta.from}–{m.inflationLoad.meta.to} podle Světové
                      banky.
                    </p>
                  )}
                  {m.inflationLoad.error && (
                    <p className="text-xs text-[#f07a6c]">{m.inflationLoad.error}</p>
                  )}
                  <Toggle
                    label="Navyšovat vklad o inflaci"
                    checked={i.indexContributions}
                    onChange={i.setIndexContributions}
                  />
                </>
              )}
              <Slider
                label="Roční výběr (renta)"
                value={i.withdrawalRate}
                onChange={i.setWithdrawalRate}
                min={1}
                max={10}
                step={0.1}
                suffix="%"
              />
            </div>
          )}
        </aside>

        <section className="min-w-0 space-y-5 lg:space-y-6">
          {/* The answer */}
          <div
            className="rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16261f] via-[#141a17] to-[#141413] p-6 ring-1 ring-[#5be0b0]/15 md:p-9"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="text-sm text-[#9d9b94]">V roce {startYear + i.years} budeš mít</p>
                <p className="mt-2 text-[44px] font-semibold leading-none tracking-[-0.035em] tabular-nums sm:text-[64px] md:text-[76px]">
                  <AnimatedNumber value={result.finalNominal} format={fmt} />
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Chip tone="mint">
                    + <AnimatedNumber value={Math.max(0, profit)} format={fmt} /> výnos
                  </Chip>
                  <Chip>
                    <AnimatedNumber value={result.totalContributions} format={fmt} /> vloženo
                  </Chip>
                  {ins.multiple && ins.multiple > 1 && (
                    <Chip>{fmtMultiple(ins.multiple, m.locale)}× tvých vkladů</Chip>
                  )}
                </div>
                {ins.breakEven && (
                  <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[#c9c7c0]">
                    V roce{" "}
                    <b className="font-semibold text-white">{startYear + ins.breakEven.year}</b>{" "}
                    začne úrok vydělávat víc, než kolik jsi do té doby sám vložil.
                  </p>
                )}
              </div>
              <ShareRing share={ins.interestShare} />
            </div>
          </div>

          {/* The chart */}
          <div
            className="rise rounded-3xl bg-[#171716] p-5 ring-1 ring-white/[0.06] md:p-7"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Jak peníze rostou</h2>
                <p className="mt-0.5 text-sm text-[#9d9b94]">
                  Tvoje vklady a to, co k nim přidá úrok
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[#9d9b94]">
                <Legend color={C.mint} label="Výnos z úroků" />
                <Legend color="#6c6b66" label="Vklady" />
                {m.showReal && <Legend color={C.ink} label="V dnešních cenách" dashed />}
              </div>
            </div>
            <div className="mt-6 h-[280px] md:h-[340px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={result.series}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="a-int" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.mint} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={C.mint} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgb(255 255 255 / 0.06)" />
                  <XAxis
                    dataKey="year"
                    type="number"
                    domain={[0, i.years]}
                    ticks={yearTicks(i.years)}
                    tickFormatter={(v) => `${startYear + v}`}
                    stroke={C.faint}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tickFormatter={axis}
                    stroke={C.faint}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={76}
                  />
                  <Tooltip
                    content={<DarkTooltip fmt={fmt} startYear={startYear} />}
                    cursor={{ stroke: "rgb(255 255 255 / 0.2)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="contributions"
                    stackId="v"
                    stroke="#6c6b66"
                    strokeWidth={1.5}
                    fill={C.contrib}
                    fillOpacity={0.9}
                    animationDuration={1100}
                  />
                  <Area
                    type="monotone"
                    dataKey="interest"
                    stackId="v"
                    stroke={C.mint}
                    strokeWidth={2.5}
                    fill="url(#a-int)"
                    animationDuration={1300}
                  />
                  {m.showReal && (
                    <Line
                      type="monotone"
                      dataKey="real"
                      stroke={C.ink}
                      strokeWidth={1.5}
                      strokeDasharray="5 4"
                      dot={false}
                      animationDuration={1300}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Advanced results */}
          {m.isAdvanced && (
            <div
              className="rise grid gap-5 md:grid-cols-2"
              style={{ "--i": 4 } as React.CSSProperties}
            >
              <div className="rounded-3xl bg-[#171716] p-6 ring-1 ring-white/[0.06]">
                <p className="text-sm text-[#9d9b94]">V dnešních penězích</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
                  {m.showReal ? <AnimatedNumber value={result.finalReal} format={fmt} /> : "—"}
                </p>
                <p className="mt-2 text-sm text-[#9d9b94]">
                  {m.showReal
                    ? `Kupní síla při ${fmtPct(i.inflation)} % inflaci ročně`
                    : "Zapni inflaci a uvidíš reálnou hodnotu."}
                </p>
              </div>
              <div className="rounded-3xl bg-[#171716] p-6 ring-1 ring-[#5be0b0]/25">
                <p className="text-sm text-[#5be0b0]">Pasivní renta měsíčně</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
                  <AnimatedNumber value={m.income.monthlyNominal} format={fmt} />
                </p>
                <p className="mt-2 text-sm text-[#9d9b94]">
                  Výběr {fmtPct(i.withdrawalRate)} % ročně
                  {m.showReal && <> · v dnešních cenách {fmt(m.income.monthlyReal)}</>}
                </p>
              </div>
            </div>
          )}

          {/* Milestones */}
          <div className="rise" style={{ "--i": 5 } as React.CSSProperties}>
            <h2 className="mb-3 px-1 text-lg font-semibold">Milníky</h2>
            <div className="flex flex-wrap gap-3 [&>*]:min-w-[150px] [&>*]:flex-1">
              {milestones.map((p, idx) => {
                const share = p.nominal > 0 ? Math.max(0, p.interest) / p.nominal : 0;
                const last = idx === milestones.length - 1;
                return (
                  <div
                    key={p.year}
                    className={cn(
                      "group rounded-2xl p-4 ring-1 transition duration-300 hover:-translate-y-1",
                      last
                        ? "bg-[#5be0b0] text-[#0f0f0e] ring-transparent"
                        : "bg-[#171716] ring-white/[0.06] hover:ring-white/15",
                    )}
                  >
                    <p className={cn("text-xs", last ? "text-[#0f0f0e]/70" : "text-[#9d9b94]")}>
                      {startYear + p.year} · za {p.year} {yearsCs(p.year)}
                    </p>
                    <p className="mt-1.5 text-lg font-semibold tabular-nums">{fmt(p.nominal)}</p>
                    <div
                      className={cn(
                        "mt-3 h-1.5 overflow-hidden rounded-full",
                        last ? "bg-black/15" : "bg-white/10",
                      )}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-700",
                          last ? "bg-[#0f0f0e]" : "bg-[#5be0b0]",
                        )}
                        style={{ width: `${share * 100}%` }}
                      />
                    </div>
                    <p
                      className={cn(
                        "mt-1.5 text-[11px]",
                        last ? "text-[#0f0f0e]/70" : "text-[#9d9b94]",
                      )}
                    >
                      {Math.round(share * 100)} % tvoří úrok
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Slider(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
}) {
  return (
    <SliderField
      {...props}
      labelClassName="text-[#c9c7c0]"
      inputClassName="w-full h-9 rounded-xl bg-black/40 pl-3 pr-10 text-right text-[15px] font-medium text-white tabular-nums ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-[#5be0b0]/60"
      suffixClassName="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9d9b94] pointer-events-none"
    />
  );
}

function Toggle({
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
      className="flex w-full items-center justify-between gap-3 text-sm text-[#c9c7c0]"
    >
      {label}
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-[#5be0b0]" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-[#0f0f0e] transition-[left] duration-300",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "mint" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium tabular-nums ring-1",
        tone === "mint"
          ? "bg-[#5be0b0]/12 text-[#5be0b0] ring-[#5be0b0]/25"
          : "bg-white/[0.05] text-[#e4e2dc] ring-white/10",
      )}
    >
      {children}
    </span>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-0.5 w-4 rounded"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}

function DarkTooltip({
  active,
  payload,
  label,
  fmt,
  startYear,
}: {
  active?: boolean;
  payload?: {
    dataKey: string;
    value: number;
    payload: { nominal: number; contributions: number; interest: number; real: number };
  }[];
  label?: number;
  fmt: (n: number) => string;
  startYear: number;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="min-w-[210px] rounded-2xl bg-[#0f0f0e]/95 p-3.5 text-xs shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <p className="text-[#9d9b94]">
        Rok {startYear + (label ?? 0)} · po {label} {yearsCs(label ?? 0)}
      </p>
      <p className="mt-1 text-lg font-semibold text-white tabular-nums">{fmt(p.nominal)}</p>
      <div className="mt-2 space-y-1 tabular-nums">
        <Row color={C.mint} label="Výnos z úroků" value={fmt(p.interest)} />
        <Row color="#6c6b66" label="Vklady" value={fmt(p.contributions)} />
        {payload.some((x) => x.dataKey === "real") && (
          <Row color={C.ink} label="V dnešních cenách" value={fmt(p.real)} />
        )}
      </div>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-[#9d9b94]">
        <span className="size-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="text-white">{value}</span>
    </div>
  );
}

// How much of the final sum interest earned, drawn as a ring that fills in.
function ShareRing({ share }: { share: number }) {
  const r = 62;
  const len = 2 * Math.PI * r;
  return (
    <div className="relative hidden size-[168px] shrink-0 md:block">
      <svg viewBox="0 0 160 160" className="size-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="rgb(255 255 255 / 0.08)"
          strokeWidth="14"
        />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={C.mint}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - share)}
          className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] [animation:ring-draw_1.4s_cubic-bezier(0.16,1,0.3,1)_both]"
          style={{ "--ring-len": `${len}` } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{Math.round(share * 100)} %</p>
          <p className="text-xs text-[#9d9b94]">vydělal úrok</p>
        </div>
      </div>
    </div>
  );
}
