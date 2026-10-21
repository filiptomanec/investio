import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// A plain info affordance beside a label; the explanation opens on tap.
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top">{children}</PopoverContent>
    </Popover>
  );
}

// Sentence-case field label at a readable size, with an optional info tip.
export function FieldLabel({
  htmlFor,
  children,
  info,
  infoLabel,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  info?: React.ReactNode;
  infoLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1 mb-1.5 min-h-5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-muted-foreground">
        {children}
      </label>
      {info && <InfoTip label={infoLabel ?? String(children)}>{info}</InfoTip>}
    </div>
  );
}
