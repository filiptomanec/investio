/**
 * Badge — small label chip. Used for scenario type indicator on dashboard.
 */
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@investio/design-tokens";

const c = tokens.colors.light;

export type BadgeVariant = "default" | "success" | "warning" | "info" | "destructive" | "muted";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ children, variant = "default", style }: BadgeProps) {
  return (
    <View style={[styles.base, variantStyles[variant].container, style]}>
      <Text style={[styles.label, variantStyles[variant].text]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

const variantStyles = {
  default: StyleSheet.create({
    container: { backgroundColor: c.primary },
    text: { color: c.primaryForeground },
  }),
  success: StyleSheet.create({
    container: { backgroundColor: c.success },
    text: { color: c.successForeground },
  }),
  warning: StyleSheet.create({
    container: { backgroundColor: c.warning },
    text: { color: c.warningForeground },
  }),
  info: StyleSheet.create({
    container: { backgroundColor: c.info },
    text: { color: c.infoForeground },
  }),
  destructive: StyleSheet.create({
    container: { backgroundColor: c.destructive },
    text: { color: c.destructiveForeground },
  }),
  muted: StyleSheet.create({
    container: { backgroundColor: c.muted },
    text: { color: c.mutedForeground },
  }),
};
