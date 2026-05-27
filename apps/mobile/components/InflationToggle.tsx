import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

interface InflationToggleProps {
  enabled: boolean;
  onToggle: () => void;
  colors: {
    mutedForeground: string;
    brand: string;
    muted: string;
    background: string;
  };
}

export function InflationToggle({ enabled, onToggle, colors }: InflationToggleProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {t("form.enableInflation").toUpperCase()}
      </Text>
      <Pressable
        onPress={onToggle}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        accessibilityLabel={t("form.enableInflation")}
        style={[
          styles.track,
          { backgroundColor: enabled ? colors.brand : colors.muted },
        ]}
      >
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: colors.background,
              transform: [{ translateX: enabled ? 20 : 2 }],
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.8,
    flexShrink: 1,
    marginRight: 8,
  },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
});
