/**
 * InfoTooltip — tappable Info icon that shows a popover with explanatory text.
 *
 * Matches web tooltip styling:
 *   max-w-[240px] text-center bg-card border rounded-md text-sm text-muted-foreground p-2
 *
 * Uses react-native-popover-view (pure JS, Expo Go compatible).
 * Tap outside to dismiss.
 */
import { useState } from "react";
import { Pressable, Text } from "react-native";
import Popover from "react-native-popover-view";
import { Info } from "lucide-react-native";

interface InfoTooltipProps {
  text: string;
  size?: number;
  colors: {
    mutedForeground: string;
    card: string;
    border: string;
    foreground: string;
  };
  accessibilityLabel?: string;
}

export function InfoTooltip({
  text,
  size = 14,
  colors,
  accessibilityLabel,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      isVisible={open}
      onRequestClose={() => setOpen(false)}
      from={(
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? "More information"}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Info size={size} color={colors.mutedForeground} />
        </Pressable>
      )}
      popoverStyle={{
        borderRadius: 8,
        padding: 12,
        maxWidth: 260,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      backgroundStyle={{ backgroundColor: "transparent" }}
    >
      <Text
        style={{
          fontSize: 13,
          lineHeight: 19,
          color: colors.foreground,
        }}
      >
        {text}
      </Text>
    </Popover>
  );
}
