import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { InvestmentResult } from "@investio/shared";
import { NumField } from "@/components/num-field";
import { cn } from "@/lib/utils";

// Shared building blocks for the three design directions on /smery. Each
// direction colours them through CSS variables and class overrides.

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  className,
  labelClassName,
  inputClassName,
  suffixClassName,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  suffixClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn("text-sm", labelClassName)}>{label}</span>
        <div className="w-[9.5rem] shrink-0">
          <NumField
            value={value}
            onChange={onChange}
            suffix={suffix}
            step={step}
            ariaLabel={label}
            inputClassName={inputClassName}
            suffixClassName={suffixClassName}
          />
        </div>
      </div>
      <input
        type="range"
        className="range mt-2"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        style={{ "--fill": `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// A segmented control whose highlight slides between options.
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  pillClassName,
  activeClassName,
  inactiveClassName,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  pillClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  useLayoutEffect(() => {
    const el = refs.current[index];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [index, options.length]);

  return (
    <div role="tablist" className={cn("relative inline-flex", className)}>
      {pill && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 bottom-1 transition-[left,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            pillClassName,
          )}
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative z-10 px-4 text-sm font-medium transition-colors",
            o.value === value ? activeClassName : inactiveClassName,
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Facts worth stating about a projection, derived from its yearly series.
export function projectionInsights(result: InvestmentResult) {
  const s = result.series;
  const breakEven = s.find((p) => p.year > 0 && p.interest >= p.contributions) ?? null;
  const million = s.find((p) => p.nominal >= 1_000_000) ?? null;
  const multiple =
    result.totalContributions > 0 ? result.finalNominal / result.totalContributions : null;
  const interestShare =
    result.finalNominal > 0
      ? Math.max(0, result.finalNominal - result.totalContributions) / result.finalNominal
      : 0;
  return { breakEven, million, multiple, interestShare };
}

// Adds `is-visible` once the element scrolls into view (for reveal effects).
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function fmtMultiple(n: number, locale: "cs" | "en") {
  return new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);
}

// Sticky offset for a side panel that may be taller than the window. A panel
// that fits sticks 24px below the top; a taller one scrolls with the page
// until its bottom edge is 24px above the window's bottom, and sticks there,
// so every field stays reachable without a scroll box of its own.
export function useFitSticky<T extends HTMLElement>(gap = 24) {
  const ref = useRef<T | null>(null);
  const [top, setTop] = useState(gap);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setTop(Math.min(gap, window.innerHeight - el.offsetHeight - gap));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [gap]);
  return { ref, top };
}
