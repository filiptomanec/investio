import { useState } from "react";
import { View, Text } from "react-native";
import { CartesianChart, Area, Line, useChartPressState } from "victory-native";
import {
  LinearGradient,
  vec,
  DashPathEffect,
  Line as SkiaLine,
} from "@shopify/react-native-skia";
import { useTranslation } from "react-i18next";
import { useAnimatedReaction, runOnJS } from "react-native-reanimated";
import type { YearPoint } from "@investio/shared";
import { formatCurrency } from "@investio/shared";
import type { SupportedLocale } from "@investio/shared";

// victory-native requires a concrete Record<string, unknown> subtype so it can
// infer NumericalFields<T>. We declare a typed intermediate that satisfies the
// constraint but maps 1:1 to YearPoint so there is no runtime cost.
type ChartPoint = {
  year: number;
  nominal: number;
  real: number;
  contributions: number;
  interest: number;
};

interface TooltipValues {
  year: number;
  nominal: number;
  real: number;
  contributions: number;
}

interface GrowthChartProps {
  series: YearPoint[];
  inflationEnabled: boolean;
  locale: SupportedLocale;
  colors: {
    brand: string;
    mutedForeground: string;
    border: string;
    card: string;
    foreground: string;
    surface: string;
  };
}

export function GrowthChart({ series, inflationEnabled, locale, colors }: GrowthChartProps) {
  const { t } = useTranslation();

  const { state, isActive } = useChartPressState<{
    x: number;
    y: { nominal: number; real: number; contributions: number };
  }>({
    x: 0,
    y: { nominal: 0, real: 0, contributions: 0 },
  });

  // Tooltip values driven via JS-thread reaction so we can render a React View.
  // We deliberately avoid trying to drive this from the UI thread because the
  // tooltip is a RN View (not a Skia canvas node), so JS re-renders are fine.
  const [tooltip, setTooltip] = useState<TooltipValues | null>(null);

  useAnimatedReaction(
    () => ({
      active: state.isActive.value,
      year: state.x.value.value,
      nominal: state.y.nominal.value.value,
      real: state.y.real.value.value,
      contributions: state.y.contributions.value.value,
    }),
    (current) => {
      "worklet";
      if (current.active) {
        runOnJS(setTooltip)({
          year: Math.round(current.year),
          nominal: current.nominal,
          real: current.real,
          contributions: current.contributions,
        });
      } else {
        runOnJS(setTooltip)(null);
      }
    },
  );

  // Brand hex with opacity suffix for gradient fills
  const brandStart = colors.brand + "8C";
  const brandEnd = colors.brand + "00";
  const mutedStart = colors.mutedForeground + "59";
  const mutedEnd = colors.mutedForeground + "00";

  const fmt = (n: number) => formatCurrency(n, locale);

  // Safe cast: ChartPoint is structurally identical to YearPoint at runtime.
  // We need this typed alias so victory-native can infer NumericalFields<T>.
  const chartData = series as ChartPoint[];

  return (
    <View style={{ height: 320 }}>
      <CartesianChart<ChartPoint, "year", "nominal" | "real" | "contributions">
        data={chartData}
        xKey="year"
        yKeys={["nominal", "real", "contributions"]}
        domainPadding={{ top: 20 }}
        axisOptions={{
          formatXLabel: (v) => `${String(v)}${t("units.yearShort")}`,
          formatYLabel: (v) => `${Math.round((v as number) / 1000)}k`,
          labelColor: colors.mutedForeground,
          lineColor: colors.border,
          tickCount: { x: 5, y: 5 },
          axisSide: { x: "bottom", y: "left" },
        }}
        chartPressState={state}
      >
        {({ points, chartBounds }) => (
          <>
            {/* Contributions — dashed line (no fill) */}
            <Line
              points={points.contributions}
              color={colors.mutedForeground}
              strokeWidth={1.5}
              curveType="monotoneX"
            >
              <DashPathEffect intervals={[4, 4]} />
            </Line>

            {/* Real area — only rendered when inflation is enabled */}
            {inflationEnabled && (
              <>
                <Area
                  points={points.real}
                  y0={chartBounds.bottom}
                  curveType="monotoneX"
                >
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, chartBounds.bottom)}
                    colors={[mutedStart, mutedEnd]}
                  />
                </Area>
                <Line
                  points={points.real}
                  color={colors.mutedForeground}
                  strokeWidth={2}
                  curveType="monotoneX"
                />
              </>
            )}

            {/* Nominal area */}
            <Area
              points={points.nominal}
              y0={chartBounds.bottom}
              curveType="monotoneX"
            >
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, chartBounds.bottom)}
                colors={[brandStart, brandEnd]}
              />
            </Area>
            <Line
              points={points.nominal}
              color={colors.brand}
              strokeWidth={2.5}
              curveType="monotoneX"
            />

            {/* Vertical crosshair when the user is pressing */}
            {isActive && (
              <SkiaLine
                p1={vec(state.x.position.value, chartBounds.top)}
                p2={vec(state.x.position.value, chartBounds.bottom)}
                color={colors.mutedForeground}
                strokeWidth={1}
                opacity={0.5}
              />
            )}
          </>
        )}
      </CartesianChart>

      {/* Tooltip overlay — RN View rendered outside the Skia canvas */}
      {tooltip != null && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 10,
            minWidth: 140,
          }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginBottom: 4 }}>
            {t("chart.tooltipYearLabel", { year: tooltip.year })}
          </Text>
          <Text
            style={{
              color: colors.brand,
              fontSize: 12,
              fontFamily: "JetBrainsMono_400Regular",
            }}
          >
            {fmt(tooltip.nominal)} {t("breakdown.nominal")}
          </Text>
          {inflationEnabled && (
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
                fontFamily: "JetBrainsMono_400Regular",
              }}
            >
              {fmt(tooltip.real)} {t("breakdown.real")}
            </Text>
          )}
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 12,
              fontFamily: "JetBrainsMono_400Regular",
            }}
          >
            {fmt(tooltip.contributions)} {t("breakdown.contributions")}
          </Text>
        </View>
      )}
    </View>
  );
}
