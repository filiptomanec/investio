import { useEffect, useRef, useState } from "react";
import { TextInput, View, Text } from "react-native";
import { reformatRaw, caretSig, caretTarget } from "@investio/shared";
import type { SupportedLocale } from "@investio/shared";

interface NumFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  locale: SupportedLocale;
  suffix?: string;
  step?: number;
  colors: {
    foreground: string;
    mutedForeground: string;
    card: string;
    border: string;
    brand: string;
    surface: string;
  };
}

const intlLocaleTag: Record<SupportedLocale, string> = {
  cs: "cs-CZ",
  en: "en-US",
};

export function NumField({
  label,
  value,
  onChange,
  locale,
  suffix,
  step = 1,
  colors,
}: NumFieldProps) {
  const maxDecimals = step < 1 ? 2 : 0;

  // Tracks the most recent selection from onSelectionChange
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Controlled selection to restore the caret after reformatting.
  // Set to a specific position when reformatting, then cleared so the user
  // can move the caret freely afterward.
  const [pendingSelection, setPendingSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);

  const formatPretty = (n: number): string => {
    if (!Number.isFinite(n)) return "";
    return new Intl.NumberFormat(intlLocaleTag[locale], {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
      useGrouping: true,
    })
      .formatToParts(n)
      // Replace Intl's group separator with a space (consistent with reformatRaw)
      .map((p) => (p.type === "group" ? " " : p.value))
      .join("");
  };

  const [text, setText] = useState(() => formatPretty(value));
  const [focused, setFocused] = useState(false);

  // Reformat from prop when value/locale changes externally and not editing
  useEffect(() => {
    if (!focused) setText(formatPretty(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale]);

  // Clear the forced selection after one render so subsequent user taps aren't
  // overridden. A short timeout prevents the caret from jumping on fast typing.
  useEffect(() => {
    if (pendingSelection != null) {
      const id = setTimeout(() => setPendingSelection(undefined), 100);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [pendingSelection]);

  return (
    <View>
      {label.length > 0 && (
        <Text
          className="text-[11px] font-medium uppercase tracking-wider mb-2"
          style={{ color: colors.mutedForeground }}
          accessibilityRole="none"
        >
          {label}
        </Text>
      )}
      <View className="relative">
        <TextInput
          value={text}
          onChangeText={(raw) => {
            const cursor = selectionRef.current.start;
            const sig = caretSig(raw, cursor);
            const { text: formatted, value: parsed } = reformatRaw(raw, locale, maxDecimals);
            const pos = caretTarget(formatted, sig);
            setText(formatted);
            setPendingSelection({ start: pos, end: pos });
            if (parsed !== null) onChange(parsed);
            else if (formatted === "") onChange(0);
          }}
          onSelectionChange={(e) => {
            selectionRef.current = e.nativeEvent.selection;
          }}
          selection={pendingSelection}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(formatPretty(value));
          }}
          keyboardType="decimal-pad"
          returnKeyType="done"
          maxFontSizeMultiplier={1.4}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: focused ? colors.brand : colors.border,
            borderRadius: 12,
            paddingVertical: 12,
            paddingLeft: 16,
            paddingRight: suffix ? 52 : 16,
            color: colors.foreground,
            fontFamily: "JetBrainsMono_400Regular",
            fontSize: 15,
          }}
          accessibilityLabel={label}
        />
        {suffix != null && suffix.length > 0 && (
          <View
            style={{
              position: "absolute",
              right: 14,
              top: 0,
              bottom: 0,
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{suffix}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
