/**
 * Accordion — collapsible section for mobile form grouping.
 * Pure React Native, no external dependency.
 */
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { tokens } from "@investio/design-tokens";

const c = tokens.colors.light;

export interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
  style,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={styles.header}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{open ? "▲" : "▶"}</Text>
      </Pressable>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: c.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: c.muted,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: c.foreground,
  },
  chevron: {
    fontSize: 12,
    color: c.mutedForeground,
  },
  content: {
    padding: 16,
    gap: 12,
  },
});
