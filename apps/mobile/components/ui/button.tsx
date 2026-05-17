/**
 * Button — pure React Native, styled from @investio/design-tokens.
 * No external UI library (per T-015/T-016 constraints).
 */
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { tokens } from "@investio/design-tokens";

const c = tokens.colors.light;

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  style,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      accessibilityRole="button"
      {...rest}
    >
      <Text
        style={[
          styles.label,
          sizeTextStyles[size],
          variantStyle.text,
          disabled && styles.disabledText,
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  disabledText: {},
  label: {
    fontWeight: "600",
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 12, paddingVertical: 7, minHeight: 34 },
  md: { paddingHorizontal: 16, paddingVertical: 10, minHeight: 42 },
  lg: { paddingHorizontal: 20, paddingVertical: 13, minHeight: 50 },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
});

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: c.primary },
    text: { color: c.primaryForeground },
  }),
  secondary: StyleSheet.create({
    container: { backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border },
    text: { color: c.secondaryForeground },
  }),
  destructive: StyleSheet.create({
    container: { backgroundColor: c.destructive },
    text: { color: c.destructiveForeground },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: "transparent" },
    text: { color: c.primary },
  }),
};
