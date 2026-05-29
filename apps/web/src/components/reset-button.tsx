import { RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ResetButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      title={t("common.resetTooltip")}
      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      <RotateCcw className="size-3" />
      {t("common.reset")}
    </button>
  );
}
