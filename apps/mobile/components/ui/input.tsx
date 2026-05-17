/**
 * Input — labeled text input with optional error message.
 * Wraps React Native TextInput, styled from design tokens.
 */
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { tokens } from "@investio/design-tokens";

const c = tokens.colors.light;

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
  ...rest
}: InputProps) {
  return (
    <View style={[styles.group, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            error ? styles.inputError : null,
            unit ? styles.inputWithUnit : null,
            style,
          ]}
          placeholderTextColor={c.mutedForeground}
          accessibilityLabel={label}
          {...rest}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: c.foreground,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: c.input,
    borderRadius: 6,
    backgroundColor: c.background,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    color: c.foreground,
  },
  inputWithUnit: {
    paddingRight: 4,
  },
  inputError: {
    borderColor: c.destructive,
  },
  unit: {
    paddingRight: 12,
    fontSize: 14,
    color: c.mutedForeground,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 12,
    color: c.destructive,
  },
});
