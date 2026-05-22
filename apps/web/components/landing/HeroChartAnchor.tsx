/**
 * Hero visual anchor — inline SVG dual-line chart inside a glass card.
 *
 * Two trajectories:
 *   1. Stocks (teal, exponential / S&P-like growth)
 *   2. Real estate (amber, linear appreciation + monthly cashflow tick marks)
 *
 * The card itself is rotated slightly in 3D (perspective) for premium feel,
 * and floats with a subtle accent halo. No client interactivity — pure SSR.
 */

export function HeroChartAnchor() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      {/* Accent halo bloom behind the card */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-primary/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Glass card */}
      <div
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card/70 p-6 shadow-[0_30px_80px_-20px_hsl(174_80%_36%/0.35)] backdrop-blur-md"
        style={{
          transform: "perspective(1200px) rotateY(-6deg) rotateX(4deg)",
        }}
      >
        {/* Card header — mock UI bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-warning/70" />
            <span className="size-2.5 rounded-full bg-success/70" />
          </div>
          <div className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            30 let · Kč
          </div>
        </div>

        {/* Two big stat blocks */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Akcie
              </span>
            </div>
            <p className="mt-1 text-xl font-black tabular-nums tracking-tight text-foreground">
              6.1M
            </p>
            <p className="text-[10px] font-medium text-success">+509 %</p>
          </div>
          <div className="rounded-2xl border border-warning/20 bg-warning/[0.06] p-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-warning" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nemovitost
              </span>
            </div>
            <p className="mt-1 text-xl font-black tabular-nums tracking-tight text-foreground">
              4.8M
            </p>
            <p className="text-[10px] font-medium text-success">+380 %</p>
          </div>
        </div>

        {/* SVG chart */}
        <div className="mt-5">
          <svg
            viewBox="0 0 320 180"
            className="w-full"
            role="img"
            aria-label="Porovnání trajektorie akcií a nemovitosti v čase"
          >
            <defs>
              <linearGradient id="teal-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(174 77% 38%)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(174 77% 38%)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="amber-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="teal-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(174 77% 32%)" />
                <stop offset="100%" stopColor="hsl(173 80% 55%)" />
              </linearGradient>
            </defs>

            {/* Faint horizontal grid */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="0"
                x2="320"
                y1={30 + i * 40}
                y2={30 + i * 40}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="2 4"
              />
            ))}

            {/* Real estate area (linear + slight curve) */}
            <path
              d="M0 140 C 40 138, 80 130, 120 118 S 200 92, 280 70 L 320 60 L 320 180 L 0 180 Z"
              fill="url(#amber-fill)"
            />
            {/* Real estate line */}
            <path
              d="M0 140 C 40 138, 80 130, 120 118 S 200 92, 280 70 L 320 60"
              fill="none"
              stroke="hsl(38 92% 50%)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Real estate cashflow tick marks — small dots every "month" */}
            {Array.from({ length: 9 }).map((_, i) => {
              const x = 20 + i * 35;
              // approximate y on the curve
              const t = x / 320;
              const y = 140 - (140 - 60) * t * (0.6 + 0.4 * t);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="hsl(38 92% 50%)"
                />
              );
            })}

            {/* Stocks area (exponential) */}
            <path
              d="M0 155 C 60 152, 120 142, 180 118 S 260 50, 320 18 L 320 180 L 0 180 Z"
              fill="url(#teal-fill)"
            />
            {/* Stocks line — heavier weight + gradient */}
            <path
              d="M0 155 C 60 152, 120 142, 180 118 S 260 50, 320 18"
              fill="none"
              stroke="url(#teal-line)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* End-cap marker on stocks line */}
            <circle cx="320" cy="18" r="5" fill="hsl(173 80% 55%)" />
            <circle cx="320" cy="18" r="9" fill="hsl(173 80% 55%)" fillOpacity="0.25" />
          </svg>
        </div>

        {/* Bottom row — micro stats */}
        <div className="mt-3 flex items-center justify-between text-[10px] font-medium tabular-nums text-muted-foreground">
          <span>0 let</span>
          <span>10 let</span>
          <span>20 let</span>
          <span className="text-primary">30 let</span>
        </div>
      </div>

      {/* Floating accent badge */}
      <div className="absolute -bottom-4 -left-3 hidden rounded-2xl border border-primary/20 bg-card px-3.5 py-2 shadow-[0_10px_40px_-10px_hsl(174_80%_36%/0.4)] backdrop-blur md:flex md:items-center md:gap-2">
        <span
          className="flex size-7 items-center justify-center rounded-full bg-success/15 text-success"
          aria-hidden="true"
        >
          {/* simple growth chevron */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 10L6 6L8 8L12 4M12 4H8M12 4V8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Akcie vyhrávají
          </p>
          <p className="text-sm font-black tabular-nums text-foreground">
            +1,3M Kč
          </p>
        </div>
      </div>
    </div>
  );
}
