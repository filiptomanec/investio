import { useTranslation } from "react-i18next";

export type Mode = "basic" | "advanced";

// Segmented track: the active option is a white pill one tone step above the
// track, never a brand fill.
export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="tablist"
      aria-label={t("modes.ariaLabel")}
      className="inline-grid grid-cols-2 gap-0.5 p-0.5 h-9 bg-muted rounded-md"
    >
      {(
        [
          { v: "basic", label: t("modes.basic") },
          { v: "advanced", label: t("modes.advanced") },
        ] as const
      ).map((opt) => {
        const active = mode === opt.v;
        return (
          <button
            key={opt.v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.v)}
            className={`px-3.5 text-sm font-medium rounded-[5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? "bg-card text-foreground ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
