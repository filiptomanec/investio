/**
 * Card — themed surface with rounded-24 corners (bolder mobile pass).
 *
 * Props:
 *   - `noPadding` keeps the original opt-out for full-bleed list rows.
 *   - `tone` shifts background away from default. `accent` lifts the card
 *     slightly above the page bg with a teal-tinted border + halo.
 *   - `radius` lets a screen request a less-rounded card when it sits
 *     inside another rounded container.
 */
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme, radii } from "@/lib/theme";

export type CardTone = "default" | "accent" | "muted";

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Remove internal padding — useful for full-bleed list children */
  noPadding?: boolean;
  tone?: CardTone;
  /** Override the corner radius (default 24px = `radii.card`). */
  radius?: number;
}

export function Card({
  children,
  style,
  noPadding = false,
  tone = "default",
  radius,
}: CardProps) {
  const theme = useTheme();
  const c = theme.colors;

  const toneStyle: ViewStyle = (() => {
    if (tone === "accent") {
      return {
        backgroundColor: c.card,
        borderColor:
          theme.mode === "dark" ? theme.teal[700] : theme.teal[200],
      };
    }
    if (tone === "muted") {
      return {
        backgroundColor: c.muted,
        borderColor: c.border,
      };
    }
    return {
      backgroundColor: c.card,
      borderColor: c.border,
    };
  })();

  return (
    <View
      style={[
        styles.card,
        toneStyle,
        { borderRadius: radius ?? radii.card },
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  padding: {
    padding: 20,
  },
});
