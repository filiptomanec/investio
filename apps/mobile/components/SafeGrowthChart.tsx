import { View, Text } from "react-native";
import type { ComponentType } from "react";

// react-native-skia + victory-native have native modules that aren't bundled in
// Expo Go. Wrapping the import in try/catch lets the rest of the app boot even
// when Skia fails to resolve. In dev/production builds the real chart loads.
type AnyChartProps = Record<string, unknown>;
let GrowthChartImpl: ComponentType<AnyChartProps> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GrowthChartImpl = require("./GrowthChart").GrowthChart;
} catch {
  GrowthChartImpl = null;
}

interface SafeGrowthChartProps extends AnyChartProps {
  colors: { surface: string; border: string; mutedForeground: string };
}

export function SafeGrowthChart(props: SafeGrowthChartProps) {
  if (GrowthChartImpl) {
    const Impl = GrowthChartImpl;
    return <Impl {...props} />;
  }
  return (
    <View
      style={{
        height: 240,
        borderRadius: 16,
        backgroundColor: props.colors.surface,
        borderWidth: 1,
        borderColor: props.colors.border,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text style={{ color: props.colors.mutedForeground, fontSize: 12, textAlign: "center" }}>
        Graf je dostupný jen v dev/production buildu — Expo Go nepodporuje react-native-skia.
      </Text>
    </View>
  );
}
