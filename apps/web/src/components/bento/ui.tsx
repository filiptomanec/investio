import type { CSSProperties, ReactNode, Ref } from "react";
import { Info, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Segmented, SliderField } from "./kit";

// Bento primitives: white panels, tinted tiles, the deep green answer tile,
// and the controls of the inputs panel. Colours come from the --b-* tokens.

export type Tone = "sky" | "mint" | "lilac" | "stone";

// Staggered entrance index for the `.rise` animation.
export const rise = (i: number) => ({ "--i": i }) as CSSProperties;

export function Panel({
  ref,
  className,
  style,
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      ref={ref}
      className={cn("rounded-[28px] bg-(--b-card) shadow-(--b-shadow)", className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function PanelTitle({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-(--b-muted)">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

// The deep green tile that carries the screen's answer.
export function HeroTile({
  i,
  className,
  children,
}: {
  i: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rise relative overflow-hidden rounded-[28px] bg-(--b-hero) p-6 text-(--b-hero-ink) ring-1 ring-(--b-hero-ring) md:p-8",
        className,
      )}
      style={rise(i)}
    >
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-16 size-64 rounded-full bg-(--b-mint)/20"
      />
      <div
        aria-hidden="true"
        className="absolute -right-4 top-24 size-32 rounded-full bg-(--b-mint)/10"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function HeroLabel({ children }: { children: ReactNode }) {
  return <p className="text-sm text-(--b-hero-muted)">{children}</p>;
}

export function HeroFigure({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <p
      className={cn(
        "mt-2 text-[44px] font-semibold leading-none tracking-[-0.035em] tabular-nums sm:text-[64px] md:text-[76px]",
        muted && "text-(--b-hero-muted)",
      )}
    >
      {children}
    </p>
  );
}

// Two shares of one whole as a bar that fills in, labelled at both ends.
export function SplitBar({
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  left: number;
  right: number;
  leftLabel: ReactNode;
  rightLabel: ReactNode;
}) {
  const total = left + right;
  const l = total > 0 ? left / total : 1;
  return (
    <div className="mt-7">
      <div className="flex h-4 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-l-full bg-(--b-hero-ink) transition-[width] duration-1000 ease-out"
          style={{ width: `${l * 100}%` }}
        />
        <div
          className="h-full bg-(--b-mint) transition-[width] duration-1000 ease-out"
          style={{ width: `${(1 - l) * 100}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between gap-4 text-xs text-(--b-hero-muted)">
        <span>{leftLabel}</span>
        <span className="text-right">{rightLabel}</span>
      </div>
    </div>
  );
}

// A tinted fact tile with an icon.
export function Tile({
  i,
  tone,
  icon,
  label,
  className,
  children,
}: {
  i: number;
  tone: Tone;
  icon: ReactNode;
  label: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rise group rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgb(0_0_0/0.08)]",
        className,
      )}
      style={
        {
          background: `var(--b-${tone}-soft)`,
          color: `var(--b-${tone}-ink)`,
          "--i": i,
        } as CSSProperties
      }
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-(--b-icon-bg) transition group-hover:scale-110">
          {icon}
        </span>
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <div className="mt-5 text-[30px] font-semibold leading-tight tracking-tight tabular-nums md:text-[32px]">
        {children}
      </div>
    </div>
  );
}

export function Sub({ children }: { children: ReactNode }) {
  return (
    <span className="mt-1 block text-sm font-normal tracking-normal opacity-75">{children}</span>
  );
}

// The inputs panel's title row: heading and a reset that spins on hover.
export function InputsHeader({ title, onReset }: { title: string; onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <button
        type="button"
        onClick={onReset}
        aria-label={t("common.resetTooltip")}
        title={t("common.resetTooltip")}
        className="grid size-9 place-items-center rounded-full bg-(--b-sunk) text-(--b-muted) transition hover:rotate-[-90deg] hover:text-(--b-ink) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--b-mint)"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
}

export type Mode = "basic" | "advanced";

export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const { t } = useTranslation();
  return (
    <Segmented<Mode>
      value={mode}
      onChange={onChange}
      options={[
        { value: "basic", label: t("modes.basic") },
        { value: "advanced", label: t("modes.advanced") },
      ]}
      className="mt-4 grid h-11 w-full grid-cols-2 rounded-2xl bg-(--b-track) p-1"
      pillClassName="rounded-xl bg-(--b-pill) shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
      activeClassName="text-(--b-ink)"
      inactiveClassName="text-(--b-muted) hover:text-(--b-ink)"
    />
  );
}

export function Slider(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  info?: ReactNode;
}) {
  const { info, label, ...rest } = props;
  return (
    <SliderField
      {...rest}
      label={label}
      labelNode={
        info ? (
          <span className="inline-flex items-center gap-1">
            {label}
            <InfoTip label={label}>{info}</InfoTip>
          </span>
        ) : undefined
      }
      labelClassName="font-medium text-(--b-ink2)"
      inputClassName="w-full h-9 rounded-xl bg-(--b-sunk) pl-3 pr-11 text-right text-[15px] font-semibold text-(--b-ink) tabular-nums outline-none transition focus:bg-(--b-card) focus:ring-2 focus:ring-(--b-mint)"
      suffixClassName="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-(--b-muted) pointer-events-none"
    />
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  info,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  info?: ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3 text-sm font-medium text-(--b-ink2)">
      <span className="inline-flex items-center gap-1">
        {label}
        {info && <InfoTip label={label}>{info}</InfoTip>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--b-mint)",
          checked ? "bg-(--b-mint)" : "bg-(--b-toggle-off)",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-white shadow transition-[left] duration-300",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}

// The grey well that groups the advanced settings.
export function Well({ children }: { children: ReactNode }) {
  return <div className="b-well mt-6 space-y-5 rounded-2xl bg-(--b-well) p-4">{children}</div>;
}

export function InflationLoader({
  years,
  load,
  loading,
  error,
  meta,
}: {
  years: number;
  load: () => void;
  loading: boolean;
  error: string | null;
  meta: { from: number; to: number; n: number } | null;
}) {
  const { t } = useTranslation();
  return (
    <>
      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-(--b-card) py-2.5 text-sm font-medium shadow-[0_1px_2px_rgb(0_0_0/0.08)] transition hover:shadow-md disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5 text-(--b-mint)" />
        )}
        {t("inflation.loadButton", { years })}
      </button>
      {meta && !error && (
        <p className="text-xs text-(--b-muted)">
          {t("inflation.source", { from: meta.from, to: meta.to, n: meta.n })}
        </p>
      )}
      {error && <p className="text-xs text-(--b-error)">{error}</p>}
    </>
  );
}

export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-grid size-5 place-items-center rounded-full text-(--b-muted) hover:text-(--b-ink) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--b-mint)"
        >
          <Info className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top">{children}</PopoverContent>
    </Popover>
  );
}

export function LegendSwatch({ color, label }: { color: string; label: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-[4px]" style={{ background: color }} />
      {label}
    </span>
  );
}

// The chart tooltip: a card with a title, the headline value and rows.
export function ChartTip({
  title,
  value,
  rows,
}: {
  title: ReactNode;
  value?: string;
  rows: { label: string; value: string; color: string }[];
}) {
  return (
    <div className="min-w-[200px] rounded-2xl bg-(--b-card) p-3.5 text-xs shadow-[0_12px_32px_rgb(0_0_0/0.14)] ring-1 ring-(--b-line)">
      <p className="text-(--b-muted)">{title}</p>
      {value && <p className="mt-0.5 text-lg font-semibold text-(--b-ink) tabular-nums">{value}</p>}
      <div className="mt-1.5 space-y-0.5">
        {rows.map((r) => (
          <p key={r.label} className="flex items-center justify-between gap-4 tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-(--b-muted)">
              <span className="size-2 rounded-full" style={{ background: r.color }} />
              {r.label}
            </span>
            <span className="font-medium text-(--b-ink)">{r.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

// A year badge for the year-by-year lists.
export function YearBadge({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-9 min-w-14 shrink-0 place-items-center rounded-xl bg-(--b-badge) px-2 text-sm font-semibold text-(--b-badge-ink) tabular-nums">
      {children}
    </span>
  );
}
