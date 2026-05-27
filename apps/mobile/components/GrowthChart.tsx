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
 * Chart smoothness: monotonic cubic interpolation (same algorithm as recharts'
 * `type="monotone"` / d3-shape curveMonotoneX). Guarantees no overshoots and
 * smooth transitions between every data point.
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
import { InfoTooltip } from "./InfoTooltip";

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

// ─── Monotonic cubic interpolation (d3-shape curveMonotoneX equivalent) ─────
//
// Algorithm: Fritsch–Carlson method.
// 1. Compute slope between each pair of consecutive points.
// 2. Initialise tangent at each point as the average of adjacent slopes.
// 3. Enforce monotonicity: if two adjacent points share the same y, zero both
//    tangents. If a tangent sign differs from the slope, zero it. Clamp the
//    ratio of tangent to slope to ≤ 3 to prevent overshoots.
// 4. Convert each cubic segment to a cubic Bézier for SVG.

interface Pt { x: number; y: number }

function monotoneTangents(pts: Pt[]): number[] {
  const n = pts.length;
  if (n === 0) return [];
  if (n === 1) return [0];

  // Step 1: inter-segment slopes
  const delta: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1]!.x - pts[i]!.x;
    delta.push(dx === 0 ? 0 : (pts[i + 1]!.y - pts[i]!.y) / dx);
  }

  // Step 2: initial tangents (average of adjacent slopes)
  const m: number[] = new Array(n).fill(0);
  m[0] = delta[0]!;
  m[n - 1] = delta[n - 2]!;
  for (let i = 1; i < n - 1; i++) {
    m[i] = (delta[i - 1]! + delta[i]!) / 2;
  }

  // Step 3: Fritsch–Carlson monotonicity constraints
  for (let i = 0; i < n - 1; i++) {
    const d = delta[i]!;
    if (d === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const alpha = m[i]! / d;
    const beta = m[i + 1]! / d;
    const h = alpha * alpha + beta * beta;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * alpha * d;
      m[i + 1] = t * beta * d;
    }
  }

  return m;
}

/**
 * Build a smooth monotonic cubic SVG path string.
 * Equivalent to recharts `type="monotone"`.
 */
function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0]!.x} ${pts[0]!.y}`;

  const m = monotoneTangents(pts);
  let d = `M ${pts[0]!.x.toFixed(2)} ${pts[0]!.y.toFixed(2)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i]!;
    const p1 = pts[i + 1]!;
    const dx = (p1.x - p0.x) / 3;
    // Control points derived from tangents
    const cp1x = p0.x + dx;
    const cp1y = p0.y + m[i]! * dx;
    const cp2x = p1.x - dx;
    const cp2y = p1.y - m[i + 1]! * dx;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
  }

  return d;
}

/** Build a closed area path (smooth line + bottom baseline). */
function areaPath(pts: Pt[], bottom: number): string {
  if (pts.length === 0) return "";
  const line = smoothPath(pts);
  const last = pts[pts.length - 1]!;
  const first = pts[0]!;
  return `${line} L ${last.x.toFixed(2)},${bottom} L ${first.x.toFixed(2)},${bottom} Z`;
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
  // 16 px screen padding each side + 24 px card inner padding each side = 80 px total
  const svgWidth = screenWidth - 80;
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

  const maxV = useMemo(
    () => Math.max(...nominals, ...reals, ...contribs),
    [nominals, reals, contribs],
  );
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
        .map((p) => {
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
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        setTooltipIdx(null);
      },
    }),
  ).current;

  function handleTouch(touchX: number) {
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
      {/* Legend — matches web layout: dots + labels, contributions last */}
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
            <InfoTooltip
              text={t("chart.realExplainer")}
              size={12}
              colors={{
                mutedForeground: colors.mutedForeground,
                card: colors.card,
                border: colors.border,
                foreground: colors.foreground,
              }}
              accessibilityLabel={t("chart.realExplainerInfo")}
            />
          </View>
        )}
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { backgroundColor: colors.mutedForeground, opacity: 0.4 },
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
            {/* Gradient matches web: brand 0.55 → 0 */}
            <SvgLinearGradient id="gradNominal" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.brand} stopOpacity="0.55" />
              <Stop offset="100%" stopColor={colors.brand} stopOpacity="0" />
            </SvgLinearGradient>
            {/* Real gradient: mutedForeground 0.35 → 0 */}
            <SvgLinearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.mutedForeground} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={colors.mutedForeground} stopOpacity="0" />
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
              strokeDasharray="3,3"
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

          {/* Contributions dashed line — drawn first (bottom layer) */}
          <Path
            d={smoothPath(contribPts)}
            fill="none"
            stroke={colors.mutedForeground}
            strokeWidth={1.5}
            strokeDasharray="4,4"
            opacity={0.7}
          />

          {/* Real area — below nominal */}
          {inflationEnabled && (
            <>
              <Path
                d={areaPath(realPts, bottom)}
                fill="url(#gradReal)"
              />
              <Path
                d={smoothPath(realPts)}
                fill="none"
                stroke={colors.mutedForeground}
                strokeWidth={2}
              />
            </>
          )}

          {/* Nominal area — on top */}
          <Path d={areaPath(nominalPts, bottom)} fill="url(#gradNominal)" />
          <Path
            d={smoothPath(nominalPts)}
            fill="none"
            stroke={colors.brand}
            strokeWidth={2.5}
          />

          {/* Crosshair + dot when pressing */}
          {tooltipIdx !== null && tooltipX !== null && (
            <>
              <SvgLine
                x1={tooltipX}
                y1={top}
                x2={tooltipX}
                y2={bottom}
                stroke={colors.mutedForeground}
                strokeWidth={1}
                opacity={0.4}
              />
              {/* Nominal dot */}
              <SvgLine
                x1={tooltipX}
                y1={nominalPts[tooltipIdx]?.y ?? top}
                x2={tooltipX}
                y2={nominalPts[tooltipIdx]?.y ?? top}
                stroke={colors.brand}
                strokeWidth={7}
                strokeLinecap="round"
              />
            </>
          )}
        </Svg>

        {/* Tooltip overlay — RN View outside SVG */}
        {tooltipPoint != null && tooltipX !== null && (
          <View
            pointerEvents="none"
            style={[
              styles.tooltip,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                left: Math.min(
                  Math.max(tooltipX - 60, left),
                  svgWidth - 148,
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
    marginBottom: 16,
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
    borderRadius: 12,
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
