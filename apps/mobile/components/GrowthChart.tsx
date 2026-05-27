/**
 * GrowthChart — SVG-only area chart using react-native-svg.
 *
 * No native modules, no Skia, no react-native-linear-gradient.
 * react-native-svg is bundled in Expo Go so this works without a dev client.
 *
 * Draws up to 3 series:
 *   - nominal   (teal area + line)
 *   - real      (muted area + line, only when inflationEnabled)
 *   - contributions (dashed line, no fill)
 *
 * Touch tooltip via React Native's PanResponder — fires on single tap/press.
 */
import { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, useWindowDimensions, PanResponder } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line as SvgLine,
  Text as SvgText,
} from "react-native-svg";
import { useTranslation } from "react-i18next";
import type { YearPoint } from "@investio/shared";
import { formatCurrency } from "@investio/shared";
import type { SupportedLocale } from "@investio/shared";

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

// ─── geometry helpers ────────────────────────────────────────────────────────

function lerp(t: number, a: number, b: number) {
  return a + t * (b - a);
}

/** Map a data value to SVG y-coordinate (inverted, 0 = top). */
function toY(val: number, minV: number, maxV: number, top: number, bottom: number) {
  if (maxV === minV) return (top + bottom) / 2;
  return lerp((val - minV) / (maxV - minV), bottom, top);
}

/** Map a series index to SVG x-coordinate. */
function toX(idx: number, count: number, left: number, right: number) {
  if (count <= 1) return (left + right) / 2;
  return lerp(idx / (count - 1), left, right);
}

/** Build a smooth SVG path string using cubic bezier control points. */
function smoothPath(
  points: { x: number; y: number }[],
  tension = 0.3,
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const dx = (curr.x - prev.x) * tension;
    d += ` C ${prev.x + dx},${prev.y} ${curr.x - dx},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
}

/** Build a closed area path (line + bottom baseline). */
function areaPath(
  points: { x: number; y: number }[],
  bottom: number,
  tension = 0.3,
): string {
  if (points.length === 0) return "";
  const line = smoothPath(points, tension);
  const last = points[points.length - 1]!;
  const first = points[0]!;
  return `${line} L ${last.x},${bottom} L ${first.x},${bottom} Z`;
}

/** Build a dashed path approximation (we simulate dashes via SVG strokeDasharray). */
function linePath(points: { x: number; y: number }[], tension = 0.3): string {
  return smoothPath(points, tension);
}

// ─── component ───────────────────────────────────────────────────────────────

const CHART_HEIGHT = 220;
const AXIS_LABEL_WIDTH = 44;
const AXIS_LABEL_HEIGHT = 20;
const PADDING_TOP = 16;
const PADDING_RIGHT = 8;

export function GrowthChart({
  series,
  inflationEnabled,
  locale,
  colors,
}: GrowthChartProps) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  // 16 px card padding each side + 20 px card inner padding each side = 32 px each side
  const svgWidth = screenWidth - 32 - 32;
  const svgHeight = CHART_HEIGHT;

  // Drawing area bounds
  const left = AXIS_LABEL_WIDTH;
  const right = svgWidth - PADDING_RIGHT;
  const top = PADDING_TOP;
  const bottom = svgHeight - AXIS_LABEL_HEIGHT;

  const fmt = (n: number) => formatCurrency(n, locale);

  // ── data extents ──
  const nominals = useMemo(() => series.map((p) => p.nominal), [series]);
  const reals = useMemo(() => series.map((p) => p.real), [series]);
  const contribs = useMemo(() => series.map((p) => p.contributions), [series]);

  const maxV = useMemo(() => Math.max(...nominals, ...reals, ...contribs), [nominals, reals, contribs]);
  const minV = 0;

  // ── SVG point arrays ──
  const nominalPts = useMemo(
    () =>
      series.map((p, i) => ({
        x: toX(i, series.length, left, right),
        y: toY(p.nominal, minV, maxV, top, bottom),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, left, right, top, bottom, maxV],
  );
  const realPts = useMemo(
    () =>
      series.map((p, i) => ({
        x: toX(i, series.length, left, right),
        y: toY(p.real, minV, maxV, top, bottom),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, left, right, top, bottom, maxV],
  );
  const contribPts = useMemo(
    () =>
      series.map((p, i) => ({
        x: toX(i, series.length, left, right),
        y: toY(p.contributions, minV, maxV, top, bottom),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, left, right, top, bottom, maxV],
  );

  // ── Y-axis ticks ──
  const yTicks = useMemo(() => {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => {
      const val = (maxV / count) * i;
      const y = toY(val, minV, maxV, top, bottom);
      return { val, y };
    });
  }, [maxV, top, bottom]);

  const formatYTick = (val: number) => {
    const k = val / 1000;
    if (k >= 1000) return `${Math.round(k / 1000)}M`;
    if (k >= 1) return `${Math.round(k)}k`;
    return "0";
  };

  // ── X-axis ticks (every 5 years) ──
  const xTicks = useMemo(
    () =>
      series
        .filter((p) => p.year % 5 === 0)
        .map((p, _i) => {
          const idx = series.indexOf(p);
          return {
            year: p.year,
            x: toX(idx, series.length, left, right),
          };
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, left, right],
  );

  // ── Tooltip ──
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        handleTouch(touchX);
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        handleTouch(touchX);
      },
      onPanResponderRelease: () => {
        setTooltipIdx(null);
      },
    }),
  ).current;

  function handleTouch(touchX: number) {
    // Find nearest series index by x-position
    let nearest = 0;
    let minDist = Infinity;
    for (let i = 0; i < series.length; i++) {
      const px = toX(i, series.length, left, right);
      const dist = Math.abs(px - touchX);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }
    setTooltipIdx(nearest);
  }

  const tooltipPoint = tooltipIdx !== null ? series[tooltipIdx] : null;
  const tooltipX = tooltipIdx !== null ? toX(tooltipIdx, series.length, left, right) : null;

  return (
    <View>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.brand }]} />
          <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>
            {t("chart.legendNominal")}
          </Text>
        </View>
        {inflationEnabled && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.mutedForeground }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>
              {t("chart.legendReal")}
            </Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.mutedForeground, opacity: 0.5 },
            ]}
          />
          <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>
            {t("chart.legendContributions")}
          </Text>
        </View>
      </View>

      {/* SVG Chart */}
      <View style={{ height: svgHeight }} {...panResponder.panHandlers}>
        <Svg width={svgWidth} height={svgHeight}>
          <Defs>
            <SvgLinearGradient id="gradNominal" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.brand} stopOpacity="0.55" />
              <Stop offset="100%" stopColor={colors.brand} stopOpacity="0.02" />
            </SvgLinearGradient>
            <SvgLinearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.mutedForeground} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={colors.mutedForeground} stopOpacity="0.02" />
            </SvgLinearGradient>
          </Defs>

          {/* Grid lines */}
          {yTicks.map(({ y }, i) => (
            <SvgLine
              key={i}
              x1={left}
              y1={y}
              x2={right}
              y2={y}
              stroke={colors.border}
              strokeWidth={0.5}
            />
          ))}

          {/* Y-axis labels */}
          {yTicks.map(({ val, y }, i) => (
            <SvgText
              key={i}
              x={left - 4}
              y={y + 4}
              fontSize={10}
              fill={colors.mutedForeground}
              textAnchor="end"
            >
              {formatYTick(val)}
            </SvgText>
          ))}

          {/* X-axis labels */}
          {xTicks.map(({ year, x }) => (
            <SvgText
              key={year}
              x={x}
              y={svgHeight - 2}
              fontSize={10}
              fill={colors.mutedForeground}
              textAnchor="middle"
            >
              {`${year}${t("units.yearShort")}`}
            </SvgText>
          ))}

          {/* Contributions dashed line */}
          <Path
            d={linePath(contribPts)}
            fill="none"
            stroke={colors.mutedForeground}
            strokeWidth={1.5}
            strokeDasharray="4,4"
            opacity={0.7}
          />

          {/* Real area — only when inflation enabled */}
          {inflationEnabled && (
            <>
              <Path
                d={areaPath(realPts, bottom)}
                fill="url(#gradReal)"
              />
              <Path
                d={linePath(realPts)}
                fill="none"
                stroke={colors.mutedForeground}
                strokeWidth={2}
              />
            </>
          )}

          {/* Nominal area */}
          <Path d={areaPath(nominalPts, bottom)} fill="url(#gradNominal)" />
          <Path
            d={linePath(nominalPts)}
            fill="none"
            stroke={colors.brand}
            strokeWidth={2.5}
          />

          {/* Crosshair + tooltip dot when user is pressing */}
          {tooltipIdx !== null && tooltipX !== null && (
            <>
              <SvgLine
                x1={tooltipX}
                y1={top}
                x2={tooltipX}
                y2={bottom}
                stroke={colors.mutedForeground}
                strokeWidth={1}
                opacity={0.5}
              />
              <SvgLine
                x1={tooltipX}
                y1={nominalPts[tooltipIdx]?.y ?? top}
                x2={tooltipX}
                y2={nominalPts[tooltipIdx]?.y ?? top}
                stroke={colors.brand}
                strokeWidth={6}
                strokeLinecap="round"
              />
            </>
          )}
        </Svg>

        {/* Tooltip overlay — RN View outside SVG */}
        {tooltipPoint !== null && tooltipPoint !== undefined && tooltipX !== null && (
          <View
            pointerEvents="none"
            style={[
              styles.tooltip,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                // Clamp tooltip so it stays within chart bounds
                left: Math.min(
                  Math.max(tooltipX - 60, left),
                  svgWidth - 144,
                ),
                top: 8,
              },
            ]}
          >
            <Text style={[styles.tooltipYear, { color: colors.mutedForeground }]}>
              {t("chart.tooltipYearLabel", { year: tooltipPoint.year })}
            </Text>
            <Text style={[styles.tooltipVal, { color: colors.brand }]}>
              {fmt(tooltipPoint.nominal)}
            </Text>
            {inflationEnabled && (
              <Text style={[styles.tooltipVal, { color: colors.mutedForeground }]}>
                {fmt(tooltipPoint.real)} {t("breakdown.real")}
              </Text>
            )}
            <Text style={[styles.tooltipVal, { color: colors.mutedForeground, opacity: 0.7 }]}>
              {fmt(tooltipPoint.contributions)} {t("breakdown.contributions")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
  },
  tooltip: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    minWidth: 120,
  },
  tooltipYear: {
    fontSize: 10,
    marginBottom: 3,
  },
  tooltipVal: {
    fontSize: 11,
    fontFamily: "JetBrainsMono_400Regular",
    lineHeight: 16,
  },
});
