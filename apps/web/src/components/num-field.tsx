import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { caretSig, caretTarget, reformatRaw, type SupportedLocale } from "@investio/shared";
import { FieldLabel } from "@/components/info-tip";

interface NumFieldProps {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  info?: React.ReactNode;
  infoLabel?: string;
}

const intlLocaleTag: Record<SupportedLocale, string> = {
  cs: "cs-CZ",
  en: "en-US",
};

// Locale-aware numeric input with caret preservation. Formats the displayed
// value using the active i18n locale's number grouping, and restores the
// caret position after each keystroke so the user can keep typing through
// reformats without losing their place.
export function NumField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
  min,
  max,
  info,
  infoLabel,
}: NumFieldProps) {
  const { i18n } = useTranslation();
  const id = useId();
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "cs";
  const maxDecimals = step < 1 ? 2 : 0;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingCaret = useRef<{ digits: number; seps: number } | null>(null);

  const formatPretty = (n: number): string => {
    if (!Number.isFinite(n)) return "";
    return new Intl.NumberFormat(intlLocaleTag[locale], {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
      useGrouping: true,
    })
      .formatToParts(n)
      .map((p) => (p.type === "group" ? " " : p.value))
      .join("");
  };

  const [text, setText] = useState(() => formatPretty(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatPretty(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale]);

  useLayoutEffect(() => {
    if (pendingCaret.current && inputRef.current) {
      const pos = caretTarget(text, pendingCaret.current);
      inputRef.current.setSelectionRange(pos, pos);
      pendingCaret.current = null;
    }
  }, [text]);

  const applyBounds = (n: number): number => {
    let next = n;
    if (typeof min === "number") next = Math.max(min, next);
    if (typeof max === "number") next = Math.min(max, next);
    return next;
  };

  return (
    <div>
      {label && (
        <FieldLabel htmlFor={id} info={info} infoLabel={infoLabel}>
          {label}
        </FieldLabel>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          step={step}
          onChange={(e) => {
            const raw = e.target.value;
            const rawCursor = e.target.selectionStart ?? raw.length;
            const sig = caretSig(raw, rawCursor);
            const { text: formatted, value: parsed } = reformatRaw(raw, locale, maxDecimals);
            pendingCaret.current = sig;
            setText(formatted);
            if (parsed !== null) onChange(applyBounds(parsed));
            else if (formatted === "") onChange(applyBounds(0));
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(formatPretty(value));
          }}
          className="w-full h-10 bg-card border border-input rounded-md pl-3 pr-14 text-[15px] text-foreground tabular-nums hover:border-muted-foreground/50 focus:border-foreground/60 focus:ring-2 focus:ring-ring outline-none transition-colors"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
