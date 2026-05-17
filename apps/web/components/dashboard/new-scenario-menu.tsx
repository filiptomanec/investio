"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NewScenarioMenuProps {
  locale: string;
}

export function NewScenarioMenu({ locale }: NewScenarioMenuProps) {
  const t = useTranslations("dashboard");
  const tEmpty = useTranslations("dashboard.empty");
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Plus className="size-4 mr-1" />
        {t("newScenario")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/${locale}/calc/compound`)}>
          {tEmpty("compoundCta")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/${locale}/calc/real-estate`)}>
          {tEmpty("realEstateCta")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
