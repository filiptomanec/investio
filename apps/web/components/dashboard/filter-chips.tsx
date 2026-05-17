"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type FilterType = "all" | "compound" | "real_estate";

interface FilterChipsProps {
  current: FilterType;
}

export function FilterChips({ current }: FilterChipsProps) {
  const t = useTranslations("dashboard.filter");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setFilter(type: FilterType) {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const options: Array<{ value: FilterType; label: string }> = [
    { value: "all", label: t("all") },
    { value: "compound", label: t("compound") },
    { value: "real_estate", label: t("realEstate") },
  ];

  return (
    <div
      role="group"
      aria-label="Filtr scénářů"
      className="flex gap-2 flex-wrap"
    >
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setFilter(value)}
          aria-pressed={current === value}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            current === value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-muted"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
