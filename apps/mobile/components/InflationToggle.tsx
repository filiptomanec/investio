import { View, Text, Pressable } from "react-native";
import { selectionFeedback } from "../lib/haptics";

interface InflationToggleProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: {
    mutedForeground: string;
    brand: string;
    background: string;
    muted: string;
  };
}

export function InflationToggle({ label, value, onChange, colors }: InflationToggleProps) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text
        style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.8 }}
        accessibilityRole="none"
      >
        {label}
      </Text>
      <Pressable
        role="switch"
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
        onPress={() => {
          selectionFeedback();
          onChange(!value);
        }}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: value ? colors.brand : colors.muted,
          justifyContent: "center",
          paddingHorizontal: 2,
          // Extend the touch area to meet Apple's 44×44pt minimum without
          // visually enlarging the pill. hitSlop distributes the extra tap
          // area evenly above and below the 24pt switch.
          alignSelf: "center",
        }}
        hitSlop={{ top: 10, bottom: 10, left: 0, right: 0 }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.background,
            transform: [{ translateX: value ? 20 : 0 }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 2,
          }}
        />
      </Pressable>
    </View>
  );
}
