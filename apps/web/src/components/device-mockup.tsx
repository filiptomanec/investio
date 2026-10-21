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
          "relative rounded-[22px] bg-zinc-900 p-1.5 shadow-xl shadow-black/15",
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
        "relative rounded-lg border border-border bg-background shadow-xl shadow-black/10 overflow-hidden",
        className,
      )}
      style={style}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 bg-card border-b border-border">
        <span className="size-2 rounded-full bg-input" />
        <span className="size-2 rounded-full bg-input" />
        <span className="size-2 rounded-full bg-input" />
      </div>
      <img src={src} alt={alt} className="block w-full h-auto select-none" draggable={false} />
    </div>
  );
}
