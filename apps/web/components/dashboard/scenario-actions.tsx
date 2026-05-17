"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ScenarioActionsProps {
  scenarioId: string;
  scenarioName: string;
  scenarioType: "compound" | "real_estate";
  locale: string;
}

export function ScenarioActions({
  scenarioId,
  scenarioName,
  scenarioType,
  locale,
}: ScenarioActionsProps) {
  const t = useTranslations("dashboard.actions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleDuplicate() {
    setError(null);
    const res = await fetch(`/api/scenarios/${scenarioId}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Kopie ${scenarioName}` }),
    });
    if (!res.ok) {
      setError("Duplikování selhalo");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleDelete() {
    if (!window.confirm(t("deleteConfirm"))) return;
    setError(null);
    const res = await fetch(`/api/scenarios/${scenarioId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Smazání selhalo");
      return;
    }
    // Optimistic: refresh to remove item from list
    startTransition(() => router.refresh());
  }

  const calcPath =
    scenarioType === "compound"
      ? `/${locale}/calc/compound?scenario=${scenarioId}`
      : `/${locale}/calc/real-estate?scenario=${scenarioId}`;

  return (
    <div>
      {error && (
        <p role="alert" className="text-xs text-destructive mb-1">
          {error}
        </p>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Akce pro scénář"
          disabled={isPending}
          className="inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { window.location.href = calcPath; }}>
            {t("open")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDuplicate}
            disabled={isPending}
          >
            {t("duplicate")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={isPending}
            variant="destructive"
          >
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
