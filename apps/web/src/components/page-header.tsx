import type { ReactNode } from "react";

// The screen's title row: a noun h1, one grey line about the data, and the
// screen's controls on the right.
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6 md:mb-8">
      <div className="min-w-0">
        <h1 className="text-[26px] md:text-[28px] font-semibold tracking-[-0.02em] leading-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

// A white panel with a whisper edge and no shadow.
export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`bg-card border border-border rounded-lg ${className}`}>{children}</div>;
}

// Panel heading: 16px title, optional grey line, optional right-hand slot.
export function PanelHeader({
  title,
  subtitle,
  aside,
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

// A legend entry whose swatch is the mark it explains, scaled down.
export function LegendItem({
  label,
  color,
  dashed,
}: {
  label: ReactNode;
  color: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <svg width="14" height="6" aria-hidden="true">
        <line
          x1="0"
          y1="3"
          x2="14"
          y2="3"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "3 2" : undefined}
        />
      </svg>
      {label}
    </span>
  );
}
