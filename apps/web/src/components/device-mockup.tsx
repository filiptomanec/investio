import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Props = {
  variant: "desktop" | "mobile";
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

export function DeviceMockup({ variant, src, alt, className, style }: Props) {
  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "relative rounded-[22px] border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl shadow-black/40 ring-1 ring-black/30",
          className,
        )}
        style={style}
      >
        <div className="overflow-hidden rounded-[16px] bg-background">
          <img
            src={src}
            alt={alt}
            className="block w-full h-full object-cover select-none"
            draggable={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-background shadow-2xl shadow-black/40 ring-1 ring-black/20 overflow-hidden",
        className,
      )}
      style={style}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted border-b border-border">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
      </div>
      <img src={src} alt={alt} className="block w-full h-auto select-none" draggable={false} />
    </div>
  );
}
