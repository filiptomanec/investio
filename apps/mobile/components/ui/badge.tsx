/**
 * Badge — themed pill chip.
 *
 * Bolder mobile pass:
 *   - pill radius (was 4)
 *   - more breathing padding (10/4 → 12/5)
 *   - new soft `accent-soft` variant: tinted bg, accent foreground (used for
 *     the dashboard type indicator — looks lighter than "filled primary").
 */
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme, radii } from "@/lib/theme";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "muted"
  | "accent-soft";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ children, variant = "default", style }: BadgeProps) {
  const theme = useTheme();
  const c = theme.colors;

  const { bg, fg } = (() => {
    switch (variant) {
      case "success":
        return { bg: c.success, fg: c.successForeground };
      case "warning":
        return { bg: c.warning, fg: c.warningForeground };
      case "info":
        return { bg: c.info, fg: c.infoForeground };
      case "destructive":
        return { bg: c.destructive, fg: c.destructiveForeground };
      case "muted":
        return { bg: c.muted, fg: c.mutedForeground };
      case "accent-soft":
        return {
          bg:
            theme.mode === "dark" ? theme.teal[900] : theme.teal[100],
          fg:
            theme.mode === "dark" ? theme.teal[200] : theme.teal[800],
        };
      case "default":
      default:
        return { bg: c.primary, fg: c.primaryForeground };
    }
  })();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: bg, borderRadius: radii.badge },
        style,
      ]}
    >
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
