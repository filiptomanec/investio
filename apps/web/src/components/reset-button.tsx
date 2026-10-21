import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ResetButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      title={t("common.resetTooltip")}
      className="inline-flex h-9 items-center gap-1.5 text-sm font-medium px-3 rounded-md border border-input bg-card hover:bg-muted text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <RotateCcw className="size-3.5 text-muted-foreground" />
      {t("common.reset")}
    </button>
  );
}
