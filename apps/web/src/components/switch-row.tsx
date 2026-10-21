import { InfoTip } from "@/components/info-tip";

// A labelled on/off row. The on state is ink, not the brand hue.
export function SwitchRow({
  id,
  label,
  checked,
  onChange,
  info,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  info?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-9">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm text-foreground cursor-pointer">
          {label}
        </label>
        {info && <InfoTip label={label}>{info}</InfoTip>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          checked ? "bg-foreground" : "bg-input"
        }`}
      >
        <span
          className={`inline-block size-4 rounded-full bg-card transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
