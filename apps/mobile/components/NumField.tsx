import { useRef, useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import {
  reformatRaw,
  caretSig,
  type SupportedLocale,
} from "@investio/shared";

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
    surface: string;
    brand: string;
  };
}

/**
 * Format a number with thousand-space separators.
 *
 * Hermes (the RN JS engine) ships a stripped Intl — `formatToParts` is NOT
 * available. We call `format()` directly and replace the locale-native
 * thousands separator with a plain space (matching the web design).
 */
function formatPretty(n: number, locale: SupportedLocale, maxDecimals: number): string {
  if (!Number.isFinite(n)) return "";
  const localeTag = locale === "cs" ? "cs-CZ" : "en-US";
  const formatted = new Intl.NumberFormat(localeTag, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
    useGrouping: true,
  }).format(n);
  // Identify the thousands separator by formatting 1000.
  // e.g. "1 000" → sep is " " (narrow no-break), "1,000" → sep is ","
  const sample = new Intl.NumberFormat(localeTag, { useGrouping: true }).format(1000);
  const sep = sample.length > 1 ? (sample[1] ?? "") : "";
  // Only replace if sep is not the decimal point (guard against exotic locales)
  if (sep && sep !== ".") {
    return formatted.split(sep).join(" ");
  }
  return formatted;
}

export function NumField({ label, value, onChange, locale, suffix, step = 1, colors }: NumFieldProps) {
  const maxDecimals = step < 1 ? 2 : 0;
  const inputRef = useRef<TextInput | null>(null);
  const [text, setText] = useState(() => formatPretty(value, locale, maxDecimals));
  const [focused, setFocused] = useState(false);

  // Reformat from prop when value/locale change externally and user isn't editing.
  useEffect(() => {
    if (!focused) {
      setText(formatPretty(value, locale, maxDecimals));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale]);

  return (
    <View>
      {label.length > 0 && (
        <Text
          style={[styles.label, { color: colors.mutedForeground }]}
          accessibilityRole="text"
        >
          {label.toUpperCase()}
        </Text>
      )}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          value={text}
          keyboardType="decimal-pad"
          returnKeyType="done"
          accessibilityLabel={label}
          onChangeText={(raw) => {
            const sig = caretSig(raw, raw.length);
            const { text: formatted, value: parsed } = reformatRaw(raw, locale, maxDecimals);
            // sig is computed but caretTarget is web-only (DOM selection); on RN
            // we can't restore caret precisely — acceptable for mobile UX.
            void sig;
            setText(formatted);
            if (parsed !== null) onChange(parsed);
            else if (formatted === "") onChange(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(formatPretty(value, locale, maxDecimals));
          }}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: focused ? colors.brand : colors.border,
              color: colors.foreground,
              // web: focus:ring-2 focus:ring-brand/40 — simulate with shadow on iOS
              shadowColor: colors.brand,
              shadowOpacity: focused ? 0.35 : 0,
              shadowRadius: focused ? 4 : 0,
              shadowOffset: { width: 0, height: 0 },
              elevation: 0,
            },
          ]}
        />
        {suffix != null && suffix.length > 0 && (
          <Text
            style={[styles.suffix, { color: colors.mutedForeground }]}
            accessibilityRole="text"
            importantForAccessibility="no"
          >
            {suffix}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingRight: 44,
    fontSize: 15,
    fontFamily: "JetBrainsMono_400Regular",
  },
  suffix: {
    position: "absolute",
    right: 14,
    fontSize: 13,
    pointerEvents: "none",
  },
});
