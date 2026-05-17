/**
 * Card — pure React Native surface with border + optional padding.
 */
import {
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { tokens } from "@investio/design-tokens";

const c = tokens.colors.light;

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Remove internal padding — useful for full-bleed list children */
  noPadding?: boolean;
}

export function Card({ children, style, noPadding = false }: CardProps) {
  return (
    <View style={[styles.card, !noPadding && styles.padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: c.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  padding: {
    padding: 16,
  },
});
