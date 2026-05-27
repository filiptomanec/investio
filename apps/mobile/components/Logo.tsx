import { View, Text, StyleSheet } from "react-native";

interface LogoProps {
  colors: {
    brand: string;
    foreground: string;
    background: string;
  };
}

export function Logo({ colors }: LogoProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: colors.brand }]}>
        <View style={[styles.diamond, { backgroundColor: colors.background }]} />
      </View>
      <Text style={[styles.wordmark, { color: colors.foreground }]}>
        INVEST<Text style={{ color: colors.brand }}>IO</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  diamond: {
    width: 14,
    height: 14,
    borderRadius: 3,
    transform: [{ rotate: "45deg" }],
  },
  wordmark: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: "Inter_700Bold",
  },
});
