/**
 * Investio — Design tokens (draft)
 *
 * SOURCE OF TRUTH for design decisions. Fullstack v T-005 přesune 1:1
 * do `packages/design-tokens/src/`. Soubor je záměrně PURE TS:
 *
 *   - žádné importy z React / RN / Tailwind / CSS-in-JS
 *   - žádný runtime kód, jen `as const` konstanty
 *   - žádné side effecty
 *
 * Cíl: stejné tokeny můžou být importovány z Next.js (web build),
 * Metro (mobile build) i Node skriptů (parita test, design-system check)
 * bez konfiguračního overheadu.
 *
 * Konvence:
 *   - Barvy v `colors` jsou raw paleta (50–950 scale + brand).
 *   - Sémantické názvy (background, foreground, primary, muted, danger…)
 *     jsou v `colors.light` a `colors.dark`. UI komponenty referencují
 *     POUZE sémantické názvy, ne raw paletu. Tj. nikdy nepoužívat
 *     `colors.slate[600]` přímo, ale `colors.light.muted`.
 *   - Všechna `string` čísla bez jednotek = rem (web) / dp (RN). 1rem = 16px.
 *   - Web mapuje tokeny do CSS custom properties (viz tailwind-preview.md).
 *   - Mobile mapuje tokeny do `ThemeProvider` context object.
 */

/* -------------------------------------------------------------------------- */
/*                                  COLOR                                     */
/* -------------------------------------------------------------------------- */

/**
 * Brand identity:
 *
 *   - Primary "Investio Teal" — modrozelená.
 *     Důvod: finanční appky často spadají do dvou extrémů — chladná
 *     korporátní modrá (banky), nebo neonová zelená/oranžová (trading
 *     platformy). Teal sedí mezi tím: důvěryhodné jako modrá, ale
 *     teplejší a méně sterilní. Mírně do zelena = asociace růst/wealth
 *     bez crypto-bro neonu. Inspirace: Lunch Money primárka, Linear
 *     odstín, Stripe doc UI.
 *
 *   - Accent "Amber" — teplý žlutohnědý.
 *     Použití: highlight, "compare" CTA, callouts. Komplement k tealu na
 *     12 o'clock barevném kole. Ne na primární akce (těch je málo, primary
 *     stačí), ale na sekundární zvýraznění (vybraný scénář, doporučení).
 *
 *   - Semantic colors (success/warning/danger/info) — utlumené, ne stock
 *     trading neony. Success = jemná zelená (#16a34a region, ne #00ff00).
 *     Danger = warm red, ne fire-engine. Vyhneme se "burza zelená/červená"
 *     dojmu — naše kalkulačka není trading panel.
 *
 *   - Neutral scale "Slate" — chladná šedá s nádechem do modra. Spár-uje
 *     s tealem (oba mají blue undertone) lépe než neutrální gray.
 */
export const palette = {
  /* Brand — Teal */
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6", // brand-500 (display only, ne text)
    600: "#0d9488", // brand primary — interaktivní (button bg, link)
    700: "#0f766e", // brand primary hover/active
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },

  /* Accent — Amber */
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b", // accent (highlight, badge)
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },

  /* Neutral — Slate (blueish gray, ladí s tealem) */
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },

  /* Semantic — jemné, ne neon.
   * Pozn.: 600-step varianty (#16a34a, #ca8a04) byly příliš světlé na to,
   * aby uneslo white foreground s AA contrast (3.3:1 / 3.4:1). Default
   * proto šli na 700-step (#15803d, #a16207) které dávají AA (5.0:1 / 4.9:1)
   * na white text. 600-step si necháváme v paletě pro decorative use
   * (icon fill, badge bez textu, chart series). */
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#22c55e",
    600: "#16a34a", // decorative only
    700: "#15803d", // success default (text background)
    900: "#14532d",
  },
  yellow: {
    50: "#fefce8",
    100: "#fef9c3",
    500: "#eab308",
    600: "#ca8a04", // decorative only
    700: "#a16207", // warning default (text background)
    900: "#713f12",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    500: "#ef4444",
    600: "#dc2626", // danger default (warm red, ne fire engine)
    700: "#b91c1c",
    900: "#7f1d1d",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3b82f6",
    600: "#2563eb", // info default
    700: "#1d4ed8",
    900: "#1e3a8a",
  },

  /* Absolute */
  white: "#ffffff",
  black: "#000000",
} as const;

/**
 * Sémantické role — co UI komponenty skutečně používají.
 *
 *   - background / foreground = page-level
 *   - card / cardForeground = surface uvnitř background (mírně liftnutá)
 *   - muted / mutedForeground = vedlejší text, hint, placeholder
 *   - border / input = decorative lines
 *   - primary / primaryForeground = brand action button
 *   - secondary / secondaryForeground = neutral action button
 *   - accent / accentForeground = hover state nebo subtle highlight
 *   - destructive / destructiveForeground = delete / danger action
 *
 *   - success/warning/danger/info — pro inline feedback (toast, badge)
 *
 *   - chart.* — barvy datových sérií v grafech. 5 distinktních barev,
 *     volené aby byly distinguishable v color-blind simulation
 *     (deuteranopia / protanopia). Pořadí 1→5 = doporučená sekvence.
 *
 * Všechny páry foreground/background mají AA kontrast (≥ 4.5:1 na normal text,
 * ≥ 3:1 na large text / UI). Tabulka ratios viz design-system.md.
 */
export const colors = {
  light: {
    background: palette.white,
    foreground: palette.slate[900], // 17.7:1 vs white — AAA
    card: palette.white,
    cardForeground: palette.slate[900],
    popover: palette.white,
    popoverForeground: palette.slate[900],

    primary: palette.teal[700], // 5.3:1 vs white — AA na text + UI
    primaryForeground: palette.white,

    secondary: palette.slate[100],
    secondaryForeground: palette.slate[900],

    muted: palette.slate[100],
    mutedForeground: palette.slate[600], // 6.0:1 vs white — AA

    accent: palette.amber[100],
    accentForeground: palette.amber[900], // 9.4:1 — AAA

    destructive: palette.red[600],
    destructiveForeground: palette.white,

    success: palette.green[700], // 5.0:1 vs white text — AA
    successForeground: palette.white,
    warning: palette.yellow[700], // 4.9:1 vs white text — AA
    warningForeground: palette.white,
    info: palette.blue[600], // 8.6:1 vs white text — AAA
    infoForeground: palette.white,

    border: palette.slate[200],
    input: palette.slate[200],
    ring: palette.teal[700], // focus ring — 5.5:1 vs white = AA na text + UI

    /* Chart series — light mode */
    chart: {
      1: palette.teal[600], // primary series (compound, scenario A)
      2: palette.amber[500], // secondary series (real estate, scenario B)
      3: palette.blue[600], // tertiary (comparison overlay)
      4: palette.slate[500], // muted (contributions baseline)
      5: palette.red[600], // negative (drawdown, expenses)
    },
  },
  dark: {
    /* "Soft dark" — ne pure black. Pure #000 cause halo na OLED a působí
     * unpolished. slate-950 dává hluboké pozadí s mírným modrým undertone. */
    background: palette.slate[950],
    foreground: palette.slate[50], // 17.4:1 — AAA
    card: palette.slate[900],
    cardForeground: palette.slate[50],
    popover: palette.slate[900],
    popoverForeground: palette.slate[50],

    primary: palette.teal[400], // 6.8:1 vs slate-950 — AA
    primaryForeground: palette.slate[950],

    secondary: palette.slate[800],
    secondaryForeground: palette.slate[50],

    muted: palette.slate[800],
    mutedForeground: palette.slate[400], // 5.6:1 — AA

    accent: palette.amber[900],
    accentForeground: palette.amber[100], // 8.0:1 — AAA

    destructive: palette.red[500],
    destructiveForeground: palette.slate[950],

    success: palette.green[500],
    successForeground: palette.slate[950],
    warning: palette.yellow[500],
    warningForeground: palette.slate[950],
    info: palette.blue[500],
    infoForeground: palette.slate[950],

    border: palette.slate[800],
    input: palette.slate[800],
    ring: palette.teal[400],

    /* Chart series — dark mode (světlejší varianty pro kontrast vs dark bg) */
    chart: {
      1: palette.teal[400],
      2: palette.amber[400],
      3: palette.blue[500],
      4: palette.slate[400],
      5: palette.red[500],
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                                TYPOGRAPHY                                  */
/* -------------------------------------------------------------------------- */

/**
 * Žádný custom font v MVP — důvod:
 *
 *   1. Performance: zero font payload, žádný FOUT/FOIT.
 *   2. Mobile parita: stejný stack na webu i RN bez ExpoFont overheadu.
 *   3. Hobby projekt — custom font (Inter/Geist) by byl "nice to have" ale
 *      nepřidá důvěryhodnost natolik, aby ospravedlnil 30-80KB woff2.
 *
 * System stack:
 *   - Sans = SF (Apple) / Segoe (Windows) / Roboto (Android) / Inter fallback
 *   - Mono = SF Mono / Cascadia / Menlo / Consolas
 *
 * Pokud projekt vyroste, T-XX (future) může přidat Geist Sans (free od Vercelu).
 * Označit v design-system.md jako "open question, defer".
 */
export const fontFamilies = {
  sans: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Inter",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ].join(", "),
  mono: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Cascadia Mono",
    "Consolas",
    "Liberation Mono",
    "monospace",
  ].join(", "),
} as const;

/**
 * Type scale — modulární, ratio ≈ 1.200 (minor third) až na hero.
 *
 *   Důvod malého ratia: finanční UI má hodně hustých čísel v tabulkách
 *   a formech. Aggressive scale (1.333 major third) tlačí h1 moc daleko
 *   od body a UI vypadá rozkývaně. 1.2 drží content scaled jemně.
 *
 *   Heroes na landing jsou výjimka — `display` je mimo modulární scale.
 *
 * Line-heights:
 *   - tight (1.15) pro display + h1, kde se počítá visual mass
 *   - snug (1.3) pro h2/h3
 *   - normal (1.5) pro body — optimum pro czech long-form text
 *   - relaxed (1.7) pro hint/help text v formech
 *
 * Letter-spacing:
 *   - display: -0.02em (lehce stažené, action-feel)
 *   - body: 0
 *   - all-caps labels (sm/xs): 0.05em
 *
 * Weights:
 *   - 400 regular pro body
 *   - 500 medium pro UI labels, button text, table headers
 *   - 600 semibold pro h2-h4, important numbers (final value display)
 *   - 700 bold pro h1, display, hero numbers
 *
 *   Nepoužíváme 300/light (špatná čitelnost na sub-pixel rendering)
 *   ani 800/extra-bold (system fonts mají různý weight rendering).
 */
export const fontSize = {
  /* hero "Vypočítáme za vás vaši investici" / landing */
  display: { size: "3.5rem", lineHeight: 1.05, letterSpacing: "-0.02em" }, // 56px
  h1: { size: "2.25rem", lineHeight: 1.15, letterSpacing: "-0.02em" }, //   36px
  h2: { size: "1.75rem", lineHeight: 1.2, letterSpacing: "-0.01em" }, //    28px
  h3: { size: "1.375rem", lineHeight: 1.3, letterSpacing: "0" }, //         22px
  h4: { size: "1.125rem", lineHeight: 1.4, letterSpacing: "0" }, //         18px
  body: { size: "1rem", lineHeight: 1.5, letterSpacing: "0" }, //           16px
  sm: { size: "0.875rem", lineHeight: 1.45, letterSpacing: "0" }, //        14px (sekundární text, table cells)
  xs: { size: "0.75rem", lineHeight: 1.4, letterSpacing: "0.025em" }, //    12px (labels, captions)
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/**
 * Tabular numbers — kritické pro finanční UI.
 *
 * `font-variant-numeric: tabular-nums` zarovnává číslice v tabulce
 * cashflow tak, že desetinná čárka je vždy ve stejné pozici. Bez toho
 * "1 234,56" a "987,12" wobble proti sobě.
 *
 * Aplikuje se na:
 *   - všechny tabulky s čísly
 *   - hero/result hodnoty (final value, monthly cashflow)
 *   - graf axis labels
 *   - chart tooltip čísla
 *
 * Token = utility class name (web) / textStyle prop (mobile).
 */
export const numericVariant = "tabular-nums" as const;

/* -------------------------------------------------------------------------- */
/*                                  SPACING                                   */
/* -------------------------------------------------------------------------- */

/**
 * 4pt grid. Žádné magic numbery v komponentách — pouze tokeny.
 *
 *   - 0 / 1 = atomic gaps (icon vs text v buttonu, badge inner padding)
 *   - 2 / 3 = inline spacing (form input padding, button padding-y)
 *   - 4 = component-level (card padding, form gap)
 *   - 6 / 8 = section-level (block to block within page)
 *   - 12 / 16 = layout-level (page section to section)
 *
 * Pokud se v komponentě chce číslo MIMO scale, je to bug a má jít přes review.
 */
export const spacing = {
  0: "0",
  0.5: "0.125rem", // 2px — hairline gap
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
} as const;

/* -------------------------------------------------------------------------- */
/*                              BREAKPOINTS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Mobile-first. Web only — mobile native app nepoužívá CSS breakpoints
 * (řeší se přes Dimensions API + Flexbox).
 *
 *   - sm 640 — phablet / sideways phone
 *   - md 768 — tablet portrait
 *   - lg 1024 — DESKTOP CUTOVER. Pod tím je vždy single column.
 *               Nad tím split layouts (form vlevo / chart vpravo).
 *   - xl 1280 — wide desktop, max content width 1280
 *   - 2xl 1536 — ultra wide, ne často potřeba (Investio max-width zůstává 1280)
 */
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

/* -------------------------------------------------------------------------- */
/*                                  RADIUS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Radii — moderní, ale ne overly rounded. Finanční UI vypadá důvěryhodněji
 * s mírnou rounded edge než s pure square (sterilní) nebo full pill
 * (playful, ne serious).
 *
 *   - none = 0 — tabulkové buňky vnitřně
 *   - sm = 4px — chip, badge
 *   - md = 6px — input, small button
 *   - lg = 8px — DEFAULT pro většinu komponent (card, button, dialog)
 *   - xl = 12px — feature card, hero
 *   - 2xl = 16px — modal, large surface
 *   - full = pill — avatar, status dot, toggle
 */
export const radii = {
  none: "0",
  sm: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px  ← DEFAULT
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px",
} as const;

/* -------------------------------------------------------------------------- */
/*                                  SHADOWS                                   */
/* -------------------------------------------------------------------------- */

/**
 * 4 levels — víc by bylo overkill na 3-page MVP.
 *
 *   - xs = subtle elevation (button hover lift, input focus)
 *   - sm = card resting state
 *   - md = popover, dropdown
 *   - lg = modal, dialog
 *
 * Shadows jsou v light mode tlumené slate-shadow (ne pure black) —
 * jemné a "warm". V dark mode shadows nepoužíváme (na dark backgroundu
 * neviditelné), místo nich `border` separace.
 *
 * String hodnoty jsou CSS box-shadow syntax. Mobile RN je čte přes
 * styled-system adapter v `packages/design-tokens/native.ts` (převede
 * na elevation + shadowColor/Opacity/Radius).
 */
export const shadows = {
  light: {
    xs: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
    sm: "0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.04)",
    md: "0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.06)",
    lg: "0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.06)",
  },
  dark: {
    /* V dark mode preferujeme inner border separation, takže shadows
     * jsou víc decorative než elevation cue. */
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.30)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.40)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.50)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.60)",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                                  MOTION                                    */
/* -------------------------------------------------------------------------- */

/**
 * Crisp + functional motion. Žádné "delightful" 600ms bouncing easings —
 * uživatel počítá, ne hraje. Motion smí jen:
 *
 *   - sdělit state change (button hover, focus, expanded/collapsed)
 *   - zjemnit transition (modal in/out)
 *
 * Reduced-motion: VŠECHNA decorative motion musí mít `motion-safe:`
 * prefix v Tailwind, nebo guarded v `@media (prefers-reduced-motion: reduce)`.
 * Functional motion (focus ring, opacity flash) je výjimkou — ale i ta by
 * v reduced-motion měla být instant, ne přes 200ms.
 */
export const motion = {
  duration: {
    instant: "0ms",
    fast: "120ms", // micro interactions (hover, button press)
    normal: "200ms", // most state changes
    slow: "320ms", // modal in/out, drawer
    deliberate: "500ms", // chart axis tweens, occasionally
  },
  easing: {
    /* Standard CSS curves — nezavádíme custom cubic-beziers v MVP */
    linear: "linear",
    out: "cubic-bezier(0.16, 1, 0.3, 1)", // ease-out, snappy "land" — DEFAULT
    in: "cubic-bezier(0.7, 0, 0.84, 0)", // ease-in, "lift off"
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)", // ease-in-out, "smooth pass"
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                                  Z-INDEX                                   */
/* -------------------------------------------------------------------------- */

/**
 * Z-index stack. Bez tohohle se vždy někde objeví `z-index: 99999`.
 *
 *   - dropdown < sticky-nav < popover < modal < toast < tooltip
 */
export const zIndex = {
  base: 0,
  dropdown: 10,
  stickyNav: 20,
  popover: 30,
  modal: 40,
  toast: 50,
  tooltip: 60,
} as const;

/* -------------------------------------------------------------------------- */
/*                                 EXPORT                                     */
/* -------------------------------------------------------------------------- */

export const tokens = {
  palette,
  colors,
  fontFamilies,
  fontSize,
  fontWeight,
  numericVariant,
  spacing,
  breakpoints,
  radii,
  shadows,
  motion,
  zIndex,
} as const;

export type Tokens = typeof tokens;
export type ColorScheme = keyof typeof colors; // "light" | "dark"
export type SemanticColor = keyof (typeof colors)["light"];
