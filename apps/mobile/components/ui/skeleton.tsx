/**
 * Skeleton — loading placeholder rectangle.
 *
 * Bolder mobile pass:
 *   - shimmer respects useColorScheme (was light only)
 *   - SkeletonCard radius bumped to 24 to match real ScenarioCard
 *   - hairline accent tint on pulse
 */
import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme, radii } from "@/lib/theme";

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 6,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let stopped = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (stopped || reduced) {
        // Don't animate when reduced motion is on.
        opacity.setValue(0.7);
        return;
      }
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    });
    return () => {
      stopped = true;
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, opacity, backgroundColor: theme.colors.muted },
        style,
      ]}
      accessibilityRole="none"
      accessibilityElementsHidden
    />
  );
}

// Convenience for a row of skeletons (e.g. dashboard list)
export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          borderRadius: radii.card,
        },
        style,
      ]}
    >
      <View style={styles.cardRow}>
        <Skeleton width={44} height={44} borderRadius={radii.badge} />
        <View style={styles.cardLines}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 20,
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  cardLines: {
    flex: 1,
    gap: 8,
  },
});
