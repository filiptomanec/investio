import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  HandCoins,
  Loader2,
  PiggyBank,
  RefreshCw,
  RotateCcw,
  Sprout,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnimatedNumber } from "@/hooks/use-animated-number";
import { useInvestmentModel, type Mode } from "@/hooks/use-investment-model";
import { compactFormatter } from "@/lib/chart";
import { cn } from "@/lib/utils";
import { Segmented, SliderField, fmtMultiple, projectionInsights } from "./kit";
import { yearsCs } from "./copy";

// Direction B, "Bento": a light ivory page of rounded tiles in different
// sizes and soft tints. A deep green answer tile leads; each other fact gets
// its own colour, icon and tile; the chart is a column per year that grows.

const T = {
  forest: "#11382b",
  mint: "#34c48f",
  mintSoft: "#ddf3e9",
  mintInk: "#0d5a40",
  sky: "#5b8def",
  skySoft: "#e3ecfb",
  skyInk: "#1d3f73",
  lilacSoft: "#ece8fb",
  lilacInk: "#43358a",
  stoneSoft: "#ebe8df",
  ink: "#1b1b19",
  muted: "#6b6a64",
};

export function DirectionB() {
  const m = useInvestmentModel();
  const { inputs: i, result, profit, fmt, fmtPct } = m;
  const ins = projectionInsights(result);
  const axis = compactFormatter(m.locale);
  const ownShare = 1 - ins.interestShare;

  const bars = result.series.filter((p) => p.year > 0);
  const tableYears = [1, 5, 10, 15, 20, 25, 30, 40, 50].filter((y) => y <= i.years);
  const rows = tableYears
    .map((y) => result.series.find((s) => s.year === y))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div
      className="min-h-screen bg-[#f4f3ee] pb-28 text-[#1b1b19] [font-family:Geist,ui-sans-serif,system-ui] [--range-fill:#11382b] [--range-track:#e4e2da] [--range-thumb:#ffffff]"
      style={{ colorScheme: "light" }}
    >
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-2xl bg-[#11382b] text-[#34c48f]">
            <Sprout className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Investio</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium">
          {[
            ["/", "Investice"],
            ["/renta", "Renta"],
            ["/hypoteka", "Hypotéka"],
          ].map(([to, label], idx) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative py-1 transition-colors",
                idx === 0
                  ? "text-[#1b1b19] after:absolute after:inset-x-0 after:-bottom-1 after:h-[3px] after:rounded-full after:bg-[#34c48f]"
                  : "text-[#6b6a64] hover:text-[#1b1b19]",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <span className="text-xs text-[#6b6a64]">CS / EN</span>
      </header>

      {/* On a phone the inputs come first; the answer stays pinned on top. */}
      <div className="sticky top-0 z-40 px-4 pt-2 lg:hidden">
        <div className="flex items-center justify-between rounded-2xl bg-[#11382b] px-4 py-3 text-[#f4f3ee] shadow-lg">
          <span className="text-xs text-[#a9c9bb]">
            Za {i.years} {yearsCs(i.years)}
          </span>
          <span className="text-xl font-semibold tabular-nums">
            <AnimatedNumber value={result.finalNominal} format={fmt} />
          </span>
        </div>
      </div>

      <main className="mx-auto mt-3 grid max-w-7xl lg:mt-0 grid-cols-1 gap-4 px-4 md:px-8 lg:grid-cols-[360px_1fr]">
        {/* Inputs */}
        <aside
          className="rise self-start rounded-[28px] bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.04)] lg:sticky lg:top-6"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Tvůj plán</h1>
            <button
              type="button"
              onClick={m.reset}
              aria-label="Obnovit výchozí hodnoty"
              className="grid size-9 place-items-center rounded-full bg-[#f4f3ee] text-[#6b6a64] transition hover:rotate-[-90deg] hover:text-[#1b1b19]"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
          <Segmented<Mode>
            value={m.mode}
            onChange={m.setMode}
            options={[
              { value: "basic", label: "Základní" },
              { value: "advanced", label: "Rozšířená" },
            ]}
            className="mt-4 grid h-11 w-full grid-cols-2 rounded-2xl bg-[#f0eee7] p-1"
            pillClassName="rounded-xl bg-white shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
            activeClassName="text-[#1b1b19]"
            inactiveClassName="text-[#6b6a64] hover:text-[#1b1b19]"
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
              label="Měsíčně přidám"
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
            <div className="mt-6 space-y-5 rounded-2xl bg-[#f6f5f0] p-4">
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium shadow-[0_1px_2px_rgb(0_0_0/0.08)] transition hover:shadow-md disabled:opacity-60"
                  >
                    {m.inflationLoad.loading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5 text-[#34c48f]" />
                    )}
                    Načíst inflaci ČR
                  </button>
                  {m.inflationLoad.meta && (
                    <p className="text-xs text-[#6b6a64]">
                      Průměr {m.inflationLoad.meta.from}–{m.inflationLoad.meta.to} (Světová banka)
                    </p>
                  )}
                  {m.inflationLoad.error && (
                    <p className="text-xs text-[#c4423a]">{m.inflationLoad.error}</p>
                  )}
                  <Toggle
                    label="Navyšovat vklad o inflaci"
                    checked={i.indexContributions}
                    onChange={i.setIndexContributions}
                  />
                </>
              )}
              <Slider
                label="Roční výběr renty"
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

        <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          {/* The answer */}
          <div
            className="rise relative overflow-hidden rounded-[28px] bg-[#11382b] p-6 text-[#f4f3ee] sm:col-span-2 md:p-8"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 size-64 rounded-full bg-[#34c48f]/20"
            />
            <div
              aria-hidden="true"
              className="absolute -right-4 top-24 size-32 rounded-full bg-[#34c48f]/10"
            />
            <p className="relative text-sm text-[#a9c9bb]">
              Za {i.years} {yearsCs(i.years)} budeš mít
            </p>
            <p className="relative mt-2 text-[46px] font-semibold leading-none tracking-[-0.035em] tabular-nums sm:text-[68px] md:text-[80px]">
              <AnimatedNumber value={result.finalNominal} format={fmt} />
            </p>
            {ins.multiple && ins.multiple > 1 && (
              <p className="relative mt-3 text-[15px] text-[#cfe3da]">
                To je{" "}
                <b className="font-semibold text-[#34c48f]">
                  {fmtMultiple(ins.multiple, m.locale)}×
                </b>{" "}
                víc, než kolik do toho vložíš.
              </p>
            )}
            {/* Own money vs interest, as one bar that fills in. */}
            <div className="relative mt-7">
              <div className="flex h-4 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-l-full bg-[#f4f3ee] transition-[width] duration-1000 ease-out"
                  style={{ width: `${ownShare * 100}%` }}
                />
                <div
                  className="h-full bg-[#34c48f] transition-[width] duration-1000 ease-out"
                  style={{ width: `${ins.interestShare * 100}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-[#a9c9bb]">
                <span>Tvoje vklady {Math.round(ownShare * 100)} %</span>
                <span>Úrok {Math.round(ins.interestShare * 100)} %</span>
              </div>
            </div>
          </div>

          <Tile
            i={3}
            bg={T.skySoft}
            ink={T.skyInk}
            icon={<PiggyBank className="size-5" />}
            label="Vložíš celkem"
          >
            <AnimatedNumber value={result.totalContributions} format={fmt} />
            <Sub>
              {fmt(i.initial)} na začátku + {fmt(i.monthly)} měsíčně
            </Sub>
          </Tile>
          <Tile
            i={4}
            bg={T.mintSoft}
            ink={T.mintInk}
            icon={<HandCoins className="size-5" />}
            label="Úrok přidá"
          >
            + <AnimatedNumber value={Math.max(0, profit)} format={fmt} />
            <Sub>
              {ins.breakEven
                ? `Od ${ins.breakEven.year}. roku vydělává víc než ty`
                : "Úrok zatím nedohoní tvoje vklady"}
            </Sub>
          </Tile>

          {m.isAdvanced && (
            <>
              <Tile
                i={5}
                bg={T.lilacSoft}
                ink={T.lilacInk}
                icon={<Wallet className="size-5" />}
                label="V dnešních cenách"
              >
                {m.showReal ? <AnimatedNumber value={result.finalReal} format={fmt} /> : "—"}
                <Sub>
                  {m.showReal ? `Při inflaci ${fmtPct(i.inflation)} % ročně` : "Zapni inflaci"}
                </Sub>
              </Tile>
              <Tile
                i={6}
                bg={T.stoneSoft}
                ink={T.ink}
                icon={<CalendarClock className="size-5" />}
                label="Renta měsíčně"
              >
                <AnimatedNumber value={m.income.monthlyNominal} format={fmt} />
                <Sub>
                  Výběr {fmtPct(i.withdrawalRate)} % ročně
                  {m.showReal && ` · dnes ${fmt(m.income.monthlyReal)}`}
                </Sub>
              </Tile>
            </>
          )}

          {/* Chart */}
          <div
            className="rise rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.04)] sm:col-span-2 md:p-7"
            style={{ "--i": 7 } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Rok po roku</h2>
                <p className="text-sm text-[#6b6a64]">Každý sloupec je stav na konci roku</p>
              </div>
              <div className="flex gap-4 text-xs text-[#6b6a64]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[4px] bg-[#5b8def]" /> Vklady
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[4px] bg-[#34c48f]" /> Úrok
                </span>
              </div>
            </div>
            <div className="mt-5 h-[280px] -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bars}
                  margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid vertical={false} stroke="#efede6" />
                  <XAxis
                    dataKey="year"
                    stroke="#8a8983"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval="preserveStartEnd"
                    minTickGap={18}
                  />
                  <YAxis
                    tickFormatter={axis}
                    stroke="#8a8983"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={76}
                  />
                  <Tooltip
                    cursor={{ fill: "rgb(17 56 43 / 0.06)", radius: 8 }}
                    content={<LightTooltip fmt={fmt} />}
                  />
                  <Bar dataKey="contributions" stackId="s" fill="#5b8def" animationDuration={900} />
                  <Bar
                    dataKey="interest"
                    stackId="s"
                    fill="#34c48f"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1100}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Year table */}
          <div
            className="rise rounded-[28px] bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.04)] sm:col-span-2"
            style={{ "--i": 8 } as React.CSSProperties}
          >
            {rows.map((p) => {
              const share = p.nominal > 0 ? Math.max(0, p.interest) / p.nominal : 0;
              return (
                <div
                  key={p.year}
                  className="flex items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-[#f6f5f0]"
                >
                  <span className="grid h-9 min-w-14 place-items-center rounded-xl bg-[#11382b] px-2 text-sm font-semibold text-white tabular-nums">
                    {p.year}. r
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex h-2 overflow-hidden rounded-full bg-[#e3ecfb]">
                      <div
                        className="ml-auto h-full bg-[#34c48f]"
                        style={{ width: `${share * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-[#6b6a64] tabular-nums">
                      vklady {fmt(p.contributions)} · úrok {fmt(p.interest)}
                    </p>
                  </div>
                  <span className="w-28 shrink-0 text-right text-base font-semibold tabular-nums sm:w-32">
                    {fmt(p.nominal)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

function Tile({
  i,
  bg,
  ink,
  icon,
  label,
  children,
}: {
  i: number;
  bg: string;
  ink: string;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rise group rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgb(0_0_0/0.08)]"
      style={{ background: bg, color: ink, "--i": i } as React.CSSProperties}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-10 place-items-center rounded-2xl bg-white/80 transition group-hover:scale-110">
          {icon}
        </span>
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <div className="mt-5 text-[32px] font-semibold leading-tight tracking-tight tabular-nums">
        {children}
      </div>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 block text-sm font-normal tracking-normal opacity-75">{children}</span>
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
      labelClassName="font-medium text-[#3a3936]"
      inputClassName="w-full h-9 rounded-xl bg-[#f4f3ee] pl-3 pr-10 text-right text-[15px] font-semibold text-[#1b1b19] tabular-nums outline-none transition focus:bg-white focus:ring-2 focus:ring-[#34c48f]"
      suffixClassName="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6a64] pointer-events-none"
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
      className="flex w-full items-center justify-between gap-3 text-sm font-medium text-[#3a3936]"
    >
      {label}
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-[#34c48f]" : "bg-[#dcdad2]",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-white shadow transition-[left] duration-300",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}

function LightTooltip({
  active,
  payload,
  label,
  fmt,
}: {
  active?: boolean;
  payload?: { payload: { nominal: number; contributions: number; interest: number } }[];
  label?: number;
  fmt: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="min-w-[190px] rounded-2xl bg-white p-3.5 text-xs shadow-[0_12px_32px_rgb(0_0_0/0.14)]">
      <p className="text-[#6b6a64]">{label}. rok</p>
      <p className="mt-0.5 text-lg font-semibold text-[#1b1b19] tabular-nums">{fmt(p.nominal)}</p>
      <p className="mt-1.5 flex justify-between gap-3 tabular-nums text-[#1d3f73]">
        <span>Vklady</span> <span>{fmt(p.contributions)}</span>
      </p>
      <p className="flex justify-between gap-3 tabular-nums text-[#0d5a40]">
        <span>Úrok</span> <span>{fmt(p.interest)}</span>
      </p>
    </div>
  );
}
