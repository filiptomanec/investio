/**
 * Input — labeled text input, theme-aware, bolder mobile pass.
 *
 *  - rounded 14 (was 6) per references
 *  - focus state lifts border to accent + adds a faint accent halo
 *  - height 52 (touch comfortable, matches pill CTA scale)
 *  - unit slug sits inside the rounded container, separated by hairline
 */
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme, radii, glowShadow } from "@/lib/theme";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  unit?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  unit,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? c.destructive
    : focused
      ? c.ring
      : c.input;

  return (
    <View style={[styles.group, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: c.background,
            borderRadius: radii.input,
          },
          focused && !error ? glowShadow(theme, 0.25) : null,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { color: c.foreground },
            unit ? styles.inputWithUnit : null,
            style,
          ]}
          placeholderTextColor={c.mutedForeground}
          accessibilityLabel={label}
          onFocus={(ev) => {
            setFocused(true);
            onFocus?.(ev);
          }}
          onBlur={(ev) => {
            setFocused(false);
            onBlur?.(ev);
          }}
          {...rest}
        />
        {unit ? (
          <Text style={[styles.unit, { color: c.mutedForeground }]}>
            {unit}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text
          style={[styles.errorText, { color: c.destructive }]}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  inputWithUnit: {
    paddingRight: 4,
  },
  unit: {
    paddingRight: 16,
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
