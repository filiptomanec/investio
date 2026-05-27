/**
 * Logo — renders the same teal rounded-square + rotated-diamond shape
 * as the web header (apps/web/src/routes/index.tsx line ~258):
 *
 *   <div className="size-8 bg-brand rounded-lg flex items-center justify-center">
 *     <div className="size-4 bg-background rounded-sm rotate-45"></div>
 *   </div>
 *   <span>INVEST<span className="text-brand">IO</span></span>
 *
 * Using react-native-svg so the 45° rotation is pixel-accurate on all
 * pixel-density screens — React Native's CSS `transform: rotate` on a
 * View clips to its bounding box and rounds corners differently.
 */
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";

interface LogoProps {
  colors: {
    brand: string;
    foreground: string;
    background: string;
  };
}

// Outer icon size matches web's `size-8` = 32px
const ICON = 32;
// Inner diamond (before rotation) = web's `size-4` = 16px, `rounded-sm` ≈ 2px
const INNER = 16;
const INNER_RX = 2;
// Center offset
const C = ICON / 2;

export function Logo({ colors }: LogoProps) {
  return (
    <View style={styles.row}>
      {/* Teal rounded square — web: rounded-lg at size-8 → 8px radius */}
      <View style={[styles.icon, { backgroundColor: colors.brand }]}>
        <Svg width={ICON} height={ICON} style={StyleSheet.absoluteFillObject}>
          {/* The outer square is just the View background, so only draw the inner diamond */}
          {/* Inner: 16x16 rect, rounded-sm (2px), centered at (16,16), rotated 45° */}
          <Rect
            x={C - INNER / 2}
            y={C - INNER / 2}
            width={INNER}
            height={INNER}
            rx={INNER_RX}
            ry={INNER_RX}
            fill={colors.background}
            rotation={45}
            originX={C}
            originY={C}
          />
        </Svg>
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
    width: ICON,
    height: ICON,
    // web's rounded-lg at 32px = 8px radius
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    // web: text-xl font-bold tracking-tight
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    fontFamily: "Inter_700Bold",
  },
});
