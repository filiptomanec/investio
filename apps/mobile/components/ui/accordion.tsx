/**
 * Accordion — themed collapsible section.
 *
 * Bolder mobile pass:
 *   - radius bumped 8 → 20 (panel scale)
 *   - active section grows a teal left-border (visual "you opened me")
 *   - chevron rendered as Ionicon for native feel (no ASCII triangle)
 *   - light haptic tick on toggle
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
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, radii } from "@/lib/theme";

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
  const theme = useTheme();
  const c = theme.colors;
  const [open, setOpen] = useState(defaultOpen);

  const handleToggle = () => {
    setOpen((v) => {
      if (process.env.EXPO_OS === "ios") {
        Haptics.selectionAsync();
      }
      return !v;
    });
  };

  const accentBorder =
    theme.mode === "dark" ? theme.teal[400] : theme.teal[600];

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: radii.panel,
          backgroundColor: c.card,
          borderColor: open ? accentBorder : c.border,
          borderLeftWidth: open ? 3 : 1,
        },
        style,
      ]}
    >
      <Pressable
        style={styles.header}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
      >
        <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={open ? accentBorder : c.mutedForeground}
        />
      </Pressable>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
});
