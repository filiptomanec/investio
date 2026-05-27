/**
 * Logo — renders the same teal rounded-square + rotated-diamond shape
 * as the web header (apps/web/src/routes/index.tsx line ~258):
 *
 *   <div className="size-8 bg-brand rounded-lg flex items-center justify-center">
 *     <div className="size-4 bg-background rounded-sm rotate-45"></div>
 *   </div>
 *   <span>INVEST<span className="text-brand">IO</span></span>
 *
 * Using plain RN View with transform:rotate (not react-native-svg <Rect rotation>)
 * because the SVG rotation approach clips corners inconsistently on iOS.
 * overflow:"hidden" on the outer View clips the rotated corners inside the teal square.
 */
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
      {/* Teal rounded square — web: size-8 rounded-lg = 32px, 8px radius */}
      <View
        style={[
          styles.icon,
          { backgroundColor: colors.brand, overflow: "hidden" },
        ]}
      >
        {/* Diamond — web: size-4 bg-background rounded-sm rotate-45 = 16px, 2px radius, 45° */}
        <View
          style={[
            styles.diamond,
            {
              backgroundColor: colors.background,
              transform: [{ rotate: "45deg" }],
            },
          ]}
        />
      </View>

      {/* Wordmark: "INVEST" in foreground, "IO" in brand */}
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
    width: 16,
    height: 16,
    borderRadius: 2,
  },
  wordmark: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: "Inter_700Bold",
  },
});
