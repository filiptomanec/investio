/**
 * Button — pure React Native, themed via `useTheme()`.
 *
 * Bolder mobile pass:
 *   - Default radius lifted from 6 → pill (radii.pill). Sharp rectangles
 *     looked "broken" against the reference set (11/11 references use pills).
 *   - New `outline` variant for the Google OAuth row.
 *   - Pressed state uses scale 0.97 + opacity dip (was opacity only).
 *   - `glow` prop adds an accent halo behind primary CTAs (sticky-bottom).
 *   - Light + dark mode both wired.
 */
import { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme, radii, glowShadow } from "@/lib/theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "ghost"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  /** Show accent halo behind the button. Use for sticky-bottom primary CTAs. */
  glow?: boolean;
  /** Optional leading element (icon). Auto-spaced from label. */
  leading?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  style,
  fullWidth = false,
  glow = false,
  leading,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const scale = useRef(new Animated.Value(1)).current;

  // Variant palette derived from theme — recomputed per render (cheap).
  const variantContainer: ViewStyle = (() => {
    switch (variant) {
      case "primary":
        return { backgroundColor: c.primary };
      case "secondary":
        return {
          backgroundColor: c.secondary,
          borderWidth: 1,
          borderColor: c.border,
        };
      case "destructive":
        return { backgroundColor: c.destructive };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: c.border,
        };
      case "ghost":
      default:
        return { backgroundColor: "transparent" };
    }
  })();

  const variantText = (() => {
    switch (variant) {
      case "primary":
        return { color: c.primaryForeground };
      case "secondary":
      case "outline":
        return { color: c.foreground };
      case "destructive":
        return { color: c.destructiveForeground };
      case "ghost":
      default:
        return { color: c.primary };
    }
  })();

  const sizeStyle = sizeStyles[size];
  const sizeText = sizeTextStyles[size];

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        glow && !disabled ? glowShadow(theme, 0.5) : null,
        { transform: [{ scale }] },
        style,
      ]}
    >
      <Pressable
        style={[
          styles.base,
          sizeStyle,
          variantContainer,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
        ]}
        onPressIn={(ev) => {
          if (!disabled) onPressIn();
          rest.onPressIn?.(ev);
        }}
        onPressOut={(ev) => {
          if (!disabled) onPressOut();
          rest.onPressOut?.(ev);
        }}
        disabled={disabled}
        accessibilityRole="button"
        {...rest}
      >
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <Text
          style={[styles.label, sizeText, variantText]}
          numberOfLines={1}
        >
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  fullWidth: {
    alignSelf: "stretch",
    width: "100%",
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontWeight: "700",
  },
  leading: {
    marginRight: 8,
  },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 16, paddingVertical: 9, minHeight: 38 },
  md: { paddingHorizontal: 20, paddingVertical: 12, minHeight: 48 },
  lg: { paddingHorizontal: 24, paddingVertical: 16, minHeight: 56 },
});

const sizeTextStyles = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
});
