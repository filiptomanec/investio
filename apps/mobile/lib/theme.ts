/**
 * Mobile theme helper — bolder design pass (PR design/investio-mobile-bolder-pass-1).
 *
 * Why this file exists:
 *   - The bolder mobile pass needs theme-aware (light + dark) styles for every
 *     surface. Previously primitives + screens grabbed `tokens.colors.light`
 *     statically, which means dark mode was broken.
 *   - `useTheme()` returns the active palette from `@investio/design-tokens`
 *     based on `useColorScheme()` (system pref).
 *   - `themePresets` carries the repeated style atoms used across screens —
 *     pill button geometry, hero number type, card rounding, accent glow.
 *
 * Stays pure React Native + design tokens. No NativeWind, no styled-components.
 *
 * IMPORTANT: We deliberately don't memoize the returned object across renders
 * — RN's StyleSheet caches by reference anyway, and the closure is cheap.
 */

import { useColorScheme } from "@/hooks/use-color-scheme";
import { tokens } from "@investio/design-tokens";
import { Platform } from "react-native";
import type { ColorValue } from "react-native";

export type ThemeMode = "light" | "dark";

/**
 * Light + dark semantic palettes have the same shape but different concrete
 * hex values, so TS narrows them to literal `"#xxx"` types because of
 * `as const`. We widen to `string` for runtime usage.
 */
export type ThemePalette = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
  border: string;
  input: string;
  ring: string;
  chart: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
};

export interface MobileTheme {
  mode: ThemeMode;
  /** Sémantická paleta z tokenů (background, foreground, primary, …). */
  colors: ThemePalette;
  /** Brand teal raw stupně — pro gradienty a halo glowy bez sémantiky. */
  teal: typeof tokens.palette.teal;
  amber: typeof tokens.palette.amber;
  slate: typeof tokens.palette.slate;
}

/**
 * Returns the active theme object. Reactively follows system colorScheme.
 */
export function useTheme(): MobileTheme {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === "dark" ? "dark" : "light";
  // `tokens.colors[mode]` is deeply readonly because of `as const` upstream
  // — we cast to the mutable shape since RN's StyleSheet types reject
  // readonly arrays inside style values (see fontVariant).
  return {
    mode,
    colors: tokens.colors[mode] as unknown as ThemePalette,
    teal: tokens.palette.teal,
    amber: tokens.palette.amber,
    slate: tokens.palette.slate,
  };
}

/**
 * Gradient stops for the hero result card.
 *   - light mode = teal-50 → teal-200 (airy, optimistic)
 *   - dark mode  = teal-900 → teal-700 (deep, premium)
 *
 * Mobile RN doesn't ship a CSS gradient — we approximate with a stacked View
 * that uses background color + accent halo. For a "true" gradient on RN you
 * need expo-linear-gradient. To avoid adding a new dependency in this pass we
 * use a solid bg color from the start of the gradient and overlay a subtle
 * radial halo via a second View. The visual effect lands close to the
 * 1280-pixel gradient ref but ships with zero deps.
 */
export function heroGradient(theme: MobileTheme): {
  background: string;
  haloColor: string;
  foreground: string;
  mutedForeground: string;
} {
  if (theme.mode === "dark") {
    return {
      background: theme.teal[900],
      haloColor: theme.teal[500],
      foreground: theme.teal[50],
      mutedForeground: theme.teal[100],
    };
  }
  return {
    background: theme.teal[50],
    haloColor: theme.teal[300],
    foreground: theme.teal[900],
    mutedForeground: theme.teal[700],
  };
}

/**
 * Accent glow — platform-specific. iOS uses shadow, Android uses elevation.
 * RN doesn't render box-shadow-style halos cross-platform, so we approximate.
 *
 * `intensity` = 0..1 (default 0.4). Translates into shadowOpacity / elevation.
 */
export function glowShadow(
  theme: MobileTheme,
  intensity: number = 0.4
): {
  shadowColor: ColorValue;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
} {
  const accent = theme.mode === "dark" ? theme.teal[400] : theme.teal[600];
  return {
    shadowColor: accent,
    shadowOffset: { width: 0, height: Platform.OS === "ios" ? 8 : 4 },
    shadowOpacity: theme.mode === "dark" ? intensity * 1.2 : intensity,
    shadowRadius: 20,
    elevation: Math.round(intensity * 12),
  };
}

/**
 * Reused style atoms — semantic, not magic numbers.
 *
 * radius scale (mobile bolder pass):
 *   - pill   = 9999  (CTA, tab pill, filter chip)
 *   - card   = 24    (hero result, scenario card, accordion)
 *   - panel  = 20    (chart panel, banner)
 *   - input  = 14    (text input, dropdown)
 *   - badge  = 999   (status pill behind a number)
 */
export const radii = {
  pill: 9999,
  card: 24,
  panel: 20,
  input: 14,
  badge: 999,
  sm: 12,
} as const;

/**
 * Typography presets — only what's reused. One-off styles stay inline.
 * Typed as plain `TextStyle` objects (not `as const`) so RN's StyleSheet
 * doesn't choke on readonly arrays inside `fontVariant`.
 */
import type { TextStyle } from "react-native";

export const typo: Record<
  "heroNumber" | "heroNumberSmall" | "pageTitle" | "authHero" | "eyebrow",
  TextStyle
> = {
  heroNumber: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  heroNumberSmall: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  authHero: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
};

/**
 * Standard paddings — kept at 4pt grid.
 */
export const space = {
  card: 20,
  gutter: 16,
  betweenCards: 14,
} as const;
