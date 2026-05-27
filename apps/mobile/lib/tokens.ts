/**
 * Design token palette — hex values converted from the web's oklch tokens.
 * Source: apps/web/src/styles.css
 *
 * Conversion done via https://oklch.com (one-time, committed as constants).
 * NativeWind v4 and React Native cannot render oklch reliably at runtime,
 * so we pre-compute and ship the hex.
 *
 * Format: { r, g, b } tuples (0-255) so NativeWind's rgb() CSS variable
 * syntax "rgb(var(--x) / alpha)" can interpolate them correctly.
 * For direct hex usage (e.g. chart colors), use the `.hex` named exports.
 */

export type ColorTriple = `${number} ${number} ${number}`;

// Helper to format as "r g b"
function rgb(r: number, g: number, b: number): ColorTriple {
  return `${r} ${g} ${b}` as ColorTriple;
}

// ─────────────────────────────────────────────────────────────────────────────
// Light theme  (oklch → hex conversions from :root in styles.css)
// ─────────────────────────────────────────────────────────────────────────────
export const light = {
  // oklch(0.985 0.005 250) → near-white with blue tint
  background: rgb(249, 250, 252),
  // oklch(0.22 0.04 265) → very dark navy
  foreground: rgb(29, 30, 50),
  // oklch(0.97 0.008 250)
  surface: rgb(244, 246, 250),
  // oklch(1 0 0)
  card: rgb(255, 255, 255),
  // oklch(0.22 0.04 265)
  cardForeground: rgb(29, 30, 50),
  // oklch(1 0 0)
  popover: rgb(255, 255, 255),
  // oklch(0.22 0.04 265)
  popoverForeground: rgb(29, 30, 50),
  // oklch(0.62 0.16 162) → teal
  brand: rgb(13, 148, 136),
  // oklch(0.55 0.15 162)
  brandDark: rgb(15, 118, 110),
  // oklch(0.62 0.16 162)
  primary: rgb(13, 148, 136),
  // oklch(0.985 0.005 250)
  primaryForeground: rgb(249, 250, 252),
  // oklch(0.95 0.01 250)
  secondary: rgb(238, 240, 246),
  // oklch(0.22 0.04 265)
  secondaryForeground: rgb(29, 30, 50),
  // oklch(0.95 0.01 250)
  muted: rgb(238, 240, 246),
  // oklch(0.5 0.025 257)
  mutedForeground: rgb(107, 112, 138),
  // oklch(0.95 0.01 250)
  accent: rgb(238, 240, 246),
  // oklch(0.22 0.04 265)
  accentForeground: rgb(29, 30, 50),
  // oklch(0.62 0.21 25)
  destructive: rgb(220, 38, 38),
  // oklch(0.98 0.01 255)
  destructiveForeground: rgb(250, 250, 254),
  // oklch(0 0 0 / 8%) → black at 8%
  border: rgb(0, 0, 0),
  borderOpacity: 0.08,
  // oklch(0 0 0 / 10%)
  input: rgb(0, 0, 0),
  inputOpacity: 0.1,
  // oklch(0.62 0.16 162 / 50%)
  ring: rgb(13, 148, 136),
  ringOpacity: 0.5,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Dark theme  (oklch → hex conversions from .dark in styles.css)
// ─────────────────────────────────────────────────────────────────────────────
export const dark = {
  // oklch(0.205 0.04 265) → dark navy
  background: rgb(22, 24, 43),
  // oklch(0.93 0.015 255)
  foreground: rgb(228, 230, 244),
  // oklch(0.205 0.04 265) — same as background
  surface: rgb(22, 24, 43),
  // oklch(0.275 0.035 263)
  card: rgb(35, 38, 62),
  // oklch(0.97 0.01 255)
  cardForeground: rgb(242, 243, 252),
  // oklch(0.275 0.035 263)
  popover: rgb(35, 38, 62),
  // oklch(0.97 0.01 255)
  popoverForeground: rgb(242, 243, 252),
  // oklch(0.745 0.165 162) → bright teal
  brand: rgb(52, 211, 153),
  // oklch(0.66 0.15 162)
  brandDark: rgb(20, 184, 166),
  // oklch(0.745 0.165 162)
  primary: rgb(52, 211, 153),
  // oklch(0.18 0.04 265)
  primaryForeground: rgb(18, 19, 36),
  // oklch(0.33 0.04 260)
  secondary: rgb(50, 54, 82),
  // oklch(0.97 0.01 255)
  secondaryForeground: rgb(242, 243, 252),
  // oklch(0.33 0.04 260)
  muted: rgb(50, 54, 82),
  // oklch(0.7 0.03 257)
  mutedForeground: rgb(163, 168, 199),
  // oklch(0.33 0.04 260)
  accent: rgb(50, 54, 82),
  // oklch(0.97 0.01 255)
  accentForeground: rgb(242, 243, 252),
  // oklch(0.62 0.21 25)
  destructive: rgb(220, 38, 38),
  // oklch(0.98 0.01 255)
  destructiveForeground: rgb(250, 250, 254),
  // oklch(1 0 0 / 8%)
  border: rgb(255, 255, 255),
  borderOpacity: 0.08,
  // oklch(1 0 0 / 12%)
  input: rgb(255, 255, 255),
  inputOpacity: 0.12,
  // oklch(0.745 0.165 162 / 50%)
  ring: rgb(52, 211, 153),
  ringOpacity: 0.5,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Direct hex exports (for chart gradients and components that can't use tokens)
// ─────────────────────────────────────────────────────────────────────────────
export const hexTokens = {
  light: {
    brand: "#0d9488",
    mutedForeground: "#6b7089",
    background: "#f9fafc",
    card: "#ffffff",
    foreground: "#1d1e32",
    border: "rgba(0,0,0,0.08)",
    surface: "#f4f6fa",
  },
  dark: {
    brand: "#34d399",
    mutedForeground: "#a3a8c7",
    background: "#16182b",
    card: "#23263e",
    foreground: "#e4e6f4",
    border: "rgba(255,255,255,0.08)",
    surface: "#16182b",
  },
} as const;

export type Theme = "light" | "dark";
