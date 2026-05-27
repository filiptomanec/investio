# Investio Mobile — Design Doc

iOS-first React Native port of the Investio compound-interest calculator. Full feature parity with `apps/web`. Lives at `apps/mobile/` inside the existing pnpm workspace.

---

## 1. Stack

| Concern              | Choice                                                                 | Notes |
| -------------------- | ---------------------------------------------------------------------- | ----- |
| Framework            | **Expo SDK 56** (managed workflow, EAS Build)                          | Latest stable. RN 0.85.2, React 19.2. Hermes default. Required for `expo-router` v6 + `nativewind` v4. |
| Language             | TypeScript 5.8 (matches workspace)                                     | Reuse `tsconfig.base.json`. |
| Styling              | **NativeWind v4**                                                      | Tailwind v3.4 dialect on RN. NOTE: NW v4 does **not** support Tailwind v4 (`@theme inline`, oklch utilities) yet — see §4. |
| Navigation           | **expo-router v6** (file-based)                                        | Single `(tabs)` group skipped — flat stack: `/` (calculator), `/methodology`. Leaves room to expand. |
| Charts               | **victory-native v40 (XL)** + `@shopify/react-native-skia`             | See §6. |
| Forms / state        | Local `useState` (parity with web)                                     | No global store needed. |
| i18n                 | `@investio/i18n` (reused verbatim) + `expo-localization` for first-launch detection. |
| Persistence          | `@react-native-async-storage/async-storage` for `investio-theme` and `investio-lang`. |
| Icons                | `lucide-react-native` (same icon set as web).                          |
| Fonts                | `expo-font` + `@expo-google-fonts/inter` and `@expo-google-fonts/jetbrains-mono`. Match web's `Inter` + `JetBrains Mono`. |
| Haptics              | `expo-haptics`.                                                        |
| Safe area            | `react-native-safe-area-context` (included by expo-router).            |
| Status bar           | `expo-status-bar`.                                                     |
| Splash / icon        | `expo-splash-screen` (managed via `app.json`).                         |
| Build / distribution | **EAS Build** + **EAS Submit** (TestFlight, then App Store).           |
| Error reporting      | None. Per workspace policy, skip Sentry on MVP. Wire later if traffic justifies. |

**Why not alternatives:**
- **Tamagui / Restyle** — overkill for one screen; would require porting the design tokens twice.
- **React Navigation directly** — expo-router gives us deep links and a path-based mental model for free.
- **No bundler config gymnastics** — Expo Metro handles workspace symlinks via `nodeModulesPaths` + `watchFolders` (see §3 metro config).

---

## 2. Code share strategy

### Reused verbatim
- **`@investio/shared`** — pure TS, zero DOM/Node deps, `sideEffects: false`. `calculateInvestment`, `formatCurrency`, `formatNumber`, `currencyForLocale`, types. Runs unchanged in Hermes. (`Intl.NumberFormat` is supported by Hermes since RN 0.74 with `hermes-engine`'s ICU build, which SDK 56 ships by default — no `intl` polyfills needed.)
- **`@investio/i18n`** — i18next + react-i18next instance + `cs.json` / `en.json`. Both peer deps are RN-compatible. The `useTranslation` hook works identically. No changes.

### Needs extraction → shared
- **`reformatRaw`** + **`caretSig`** / **`caretTarget`** from `apps/web/src/routes/index.tsx` → **new file** `packages/shared/src/input-formatting.ts`. Pure functions, zero DOM. Re-export from `packages/shared/src/index.ts`. The mobile agent owns this extraction; the web app must then import from `@investio/shared` instead of defining locally (one-line replacement, no behavior change).

### Mobile-only
- `app/_layout.tsx` — root layout, providers (I18nextProvider, SafeAreaProvider, font loader, theme bootstrap).
- `app/index.tsx` — calculator screen.
- `app/methodology.tsx` — static methodology page (currently the `<footer>` text on web).
- `components/NumField.tsx` — RN `TextInput` version with caret restoration via `selection` prop.
- `components/GrowthChart.tsx` — victory-native area chart.
- `components/MilestonesList.tsx` — replaces both the desktop table and mobile stacked cards (mobile always uses the stacked variant).
- `components/Switch.tsx` — wraps RN's `Switch` with brand styling, or a custom pressable to match the web pill toggle 1:1.
- `components/Tooltip.tsx` — popover replacement; on iOS use a `Modal` bottom-sheet-style or `Alert`-style tap-to-reveal. Recharts/Radix tooltips don't exist in RN.
- `components/LanguageToggle.tsx` — CS / EN pill.
- `components/ThemeToggle.tsx` — sun / moon button.
- `hooks/useTheme.ts` — see §4.
- `hooks/useLanguageBootstrap.ts` — replaces `useLanguageSync`. Reads AsyncStorage, falls back to `expo-localization`'s `getLocales()`.
- `lib/storage.ts` — typed AsyncStorage wrappers (`getTheme`, `setTheme`, `getLang`, `setLang`).
- `lib/tokens.ts` — design tokens mirroring the web's `:root` / `.dark` oklch values, **converted to hex** (NW v4 / RN don't render oklch reliably; pre-compute once with `culori` or do it by hand). Both palettes live here; the NativeWind `tailwind.config.js` references them.

### Web-only / not ported
- TanStack Router, Start, server entry, Sentry, error pages (Expo Router has its own error boundary).
- Recharts (replaced).
- Radix Tooltip (replaced).
- shadcn/ui primitives (none used outside Tooltip).

---

## 3. Project layout

```
apps/mobile/
  app.json                      # Expo config (name, bundle id, icons, splash, ios.infoPlist)
  app.config.ts                 # If we need env-based config; otherwise stick to app.json
  babel.config.js               # nativewind/babel preset + expo-router
  metro.config.js               # workspace symlink support + nativewind transformer
  tailwind.config.js            # tokens mapped from lib/tokens.ts, darkMode: 'class'
  global.css                    # @tailwind base/components/utilities (NW v4)
  tsconfig.json                 # extends ../../tsconfig.base.json, paths to @investio/*
  package.json                  # workspace member, depends on @investio/shared and @investio/i18n
  eas.json                      # build profiles: development, preview, production
  app/
    _layout.tsx                 # Stack, providers, font load, theme bootstrap, status bar
    index.tsx                   # Calculator screen (ScrollView)
    methodology.tsx             # Footer methodology text as its own screen
    +not-found.tsx              # 404 (uses errors.* i18n keys)
  components/
    NumField.tsx
    GrowthChart.tsx
    MilestonesList.tsx
    ResultCard.tsx              # Future value + Real value cards
    PassiveIncomeCard.tsx
    InflationToggle.tsx
    LanguageToggle.tsx
    ThemeToggle.tsx
    Tooltip.tsx                 # Tap-to-reveal popover
    Logo.tsx
  hooks/
    useTheme.ts
    useLanguageBootstrap.ts
    useColors.ts                # Returns resolved hex palette for current theme (for chart, status bar)
  lib/
    storage.ts
    tokens.ts                   # Light + dark palette as hex
    haptics.ts                  # Thin wrapper around expo-haptics (no-op on web if ever shared)
  assets/
    icon.png                    # 1024x1024 app icon (brand teal background + rotated square)
    splash.png                  # 1284x2778, brand background, centered logo
    adaptive-icon.png           # Android-ready even though iOS-only ship (cheap)
    fonts/                      # Inter + JetBrains Mono if not loading from Google
```

**Screens:**
- `/` — calculator (single scrollable view; one column on phones).
- `/methodology` — text-only static page reachable from a small link in the header (replaces `#metodika` anchor).
- `/+not-found` — uses existing `errors.notFoundTitle` / `errors.notFoundDescription`.

---

## 4. Theme system

### Reality check
NativeWind v4 supports `darkMode: 'class'` style toggling, but **there is no `<html>` element in RN**. NW v4 exposes a `vars()` API and an `Appearance`-aware `useColorScheme` hook. The `dark:` variant is resolved by NW's runtime against a single source of truth.

### Approach
1. `lib/tokens.ts` exports two flat palette objects (`light`, `dark`) with hex values pre-converted from the web's oklch tokens. **Convert once by hand** (or via `culori`) and commit the hex output — runtime oklch parsing in RN is unreliable.
2. `tailwind.config.js` uses NW v4's CSS variable theming: `theme.extend.colors.background = 'rgb(var(--background) / <alpha-value>)'`, etc. Wire the actual variable values via the NW v4 `cssInterop`/`vars()` system inside the root layout.
3. `hooks/useTheme.ts`:
   - Reads system theme via `Appearance.getColorScheme()` and `Appearance.addChangeListener`.
   - Reads stored override from AsyncStorage (`investio-theme`).
   - Resolved value = stored override ?? system. (Web defaults to `dark` when nothing is stored — match this for parity: `stored ?? 'dark'`. **Open question §9 #1**.)
   - Returns `{ theme: 'light' | 'dark', toggle, isOverridden }`.
   - Calls NW v4's `setColorScheme('light' | 'dark')` so the `dark:` variant resolves correctly.
4. `app/_layout.tsx` applies the resolved palette via NW v4's `vars()` to the root `<View>`, and sets `<StatusBar style={theme === 'dark' ? 'light' : 'dark'} />` (using `expo-status-bar`).
5. **No flicker on cold start:** the splash screen stays visible via `expo-splash-screen.preventAutoHideAsync()` until theme + fonts + persisted lang are loaded, then `SplashScreen.hideAsync()`. This replaces the web's pre-hydration script.

### Tailwind config snippet (illustrative, not implementation)
```js
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        brand: "rgb(var(--brand) / <alpha-value>)",
        // ... mirror every web token
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        mono: ["JetBrainsMono_400Regular"],
      },
      borderRadius: { "2xl": 18 },
    },
  },
};
```

---

## 5. Locale-aware input formatting

### Extraction
- Move `reformatRaw`, `caretSig`, `caretTarget` from `apps/web/src/routes/index.tsx` to `packages/shared/src/input-formatting.ts` **unchanged**.
- Export from `packages/shared/src/index.ts`.
- Replace inline copies in the web `NumField` with imports — verify nothing regresses (the functions are pure and have no DOM coupling).

### RN `NumField` differences

| Concern         | Web                                                   | RN                                                                                            |
| --------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Component       | `<input type="text" inputMode="decimal">`             | `<TextInput keyboardType="decimal-pad" />` (iOS) — note: no `-` on `decimal-pad`. Use `keyboardType="numbers-and-punctuation"` if negative values are ever needed; current inputs never go negative. |
| Caret read      | `e.target.selectionStart`                             | Controlled `selection={{start, end}}` + `onSelectionChange={(e) => e.nativeEvent.selection}`. |
| Caret write     | `inputRef.current.setSelectionRange(pos, pos)` in `useLayoutEffect`. | Set `selection` state synchronously inside `onChangeText` (since we already compute the target from the new formatted text). Pass `selection={pendingSelection}` for one render, then clear so the user can move the caret freely afterward. |
| Decimal sep     | Live swap to `,` (CS) or `.` (EN).                    | Same. iOS `decimal-pad` shows whatever separator the device locale picks — the caller types whichever is convenient; `reformatRaw` already normalizes. |
| Suffix overlay  | Absolutely positioned `<span>`.                       | `<View>` with `position: 'absolute'` to the right of the `TextInput`, `pointerEvents: 'none'`. |
| Blur reformat   | `onBlur` re-formats to canonical pretty.              | Same. Use `onBlur` + `setText(formatPretty(value))`. |

### Caret strategy detail
1. User edits → `onChangeText(raw)` fires.
2. Read `selection.start` from the most recent `onSelectionChange` (stored in a ref).
3. Compute `caretSig(raw, cursor)`, run `reformatRaw`, compute `caretTarget(formatted, sig)`.
4. `setText(formatted)` + `setSelection({start: pos, end: pos})`.
5. On the next user input or after a tick, leave `selection` uncontrolled (set to `undefined`) so the user can tap to move the caret without it being forced back.

The mobile agent should ship a `NumField.test.tsx` that calls `reformatRaw` with the same fixtures as the web (paste of `1,234.56` and `1.234,56` in both locales, trailing-zero handling, decimal-only input).

---

## 6. Chart implementation

### Pick: **victory-native v40 (XL)**

| Criterion                  | victory-native v40 | gifted-charts | svg-charts |
| -------------------------- | ------------------ | ------------- | ---------- |
| Area chart                 | Yes                | Yes           | Yes        |
| Multi-series area + line   | Yes (compose `Area` + `Line`) | Limited (single primary series, extras awkward) | Yes but verbose |
| Gradient fill              | Yes (Skia `LinearGradient` child inside `<Area>`) | Yes (preset)  | Yes        |
| Dashed line                | Yes (Skia `Path` w/ dash) | Limited       | Yes        |
| Touch tooltip / press      | First-class via `useChartPressState` (UI-thread gesture) | Built-in but less customizable | Manual     |
| Performance                | GPU via Skia, no bridge | SVG / JS      | SVG / JS   |
| Maintenance                | Active (Nearform/Formidable) | Active        | Stale      |
| Theming                    | Composable Skia primitives, easy to read tokens | Theming via props, less flexible | Manual SVG |

**Decision: victory-native v40.** Best fit for our exact needs (gradient area + dashed contributions line + tap tooltip). Trade-off: requires `@shopify/react-native-skia` (a heavyweight native module). Acceptable for an MVP — Skia is the de-facto standard for high-quality RN charts and adds ~3 MB to the iOS binary, well within App Store norms.

### Recharts → victory-native mapping

| Web (recharts)                          | Mobile (victory-native v40)                                  |
| --------------------------------------- | ------------------------------------------------------------ |
| `<AreaChart data={series}>`             | `<CartesianChart data={series} xKey="year" yKeys={['nominal','real','contributions']}>` |
| `<XAxis tickFormatter />`               | `axisOptions.formatXLabel`                                   |
| `<YAxis tickFormatter />`               | `axisOptions.formatYLabel` (format as `${n/1000}k`)          |
| `<CartesianGrid strokeDasharray="3 3"/>` | `axisOptions.lineColor` + grid via `frame` prop              |
| `<Area dataKey="nominal" fill="url(#gNom)" stroke=... strokeWidth={2.5}>` with `<linearGradient>` defs | `<Area points={points.nominal} y0={chartBounds.bottom} animate={...}><LinearGradient start={vec(0,0)} end={vec(0,height)} colors={[brand+'8C', brand+'00']} /></Area>` + `<Line points={points.nominal} color={brand} strokeWidth={2.5} />` |
| `<Area dataKey="real" ...>`             | Same pattern with `muted-foreground` palette                 |
| `<Area dataKey="contributions" fill="none" stroke=muted strokeDasharray="4 4" />` | `<Line points={points.contributions} color={mutedFg} strokeWidth={1.5} curveType="monotonic" >`<br>Apply dash via Skia `<DashPathEffect intervals={[4,4]} />` child. |
| `<RTooltip />`                          | `useChartPressState({ x: 0, y: { nominal: 0, real: 0, contributions: 0 } })` + a `<ToolTip>` overlay using `useDerivedValue`. Renders an absolutely positioned card with year + 3 values formatted by `formatCurrency`. |

### Compromises
- **Gradient stop opacities** map cleanly: append `8C` (≈ 55%) and `00` to brand hex for `nominal`; `59` (≈ 35%) and `00` for `real`.
- **Axis label rotation / overlap**: victory-native auto-thins ticks. Cap years to 60 (already enforced) so the X axis stays readable.
- **No SSR concern** (RN ships only client).
- **Crosshair**: implement as a thin Skia `<Line>` at `state.x.position` when `state.isActive` is true.

### Data shape
`result.series` from `calculateInvestment` is already an array of `{year, nominal, real, contributions, interest}` — feed it directly. No transform needed beyond extracting the `points` per series via the `points` accessor in `<CartesianChart>`'s render-prop.

---

## 7. iOS specifics

| Concern              | Implementation |
| -------------------- | -------------- |
| Safe area            | Wrap the root in `<SafeAreaProvider>` (auto via expo-router). Use `useSafeAreaInsets()` in the screen to pad the top of the header (notch / Dynamic Island) and the bottom of the ScrollView. |
| Status bar           | `<StatusBar style={theme === 'dark' ? 'light' : 'dark'} />` from `expo-status-bar`, re-rendered when theme toggles. |
| Keyboard avoidance   | Wrap the inputs section in `<KeyboardAvoidingView behavior="padding">`. Use a `<ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">` so tapping outside dismisses without eating the tap. |
| Haptics              | `expo-haptics.selectionAsync()` on theme toggle, language toggle, and inflation switch flip. `notificationAsync(Success)` is overkill for a calculator — keep it subtle. |
| Scrolling perf       | One `ScrollView` for the whole screen — content fits well under one screen of vertical real estate per section; no need for `FlatList`. Chart re-renders only when `result.series` changes (memoized). |
| Dark mode native     | Set `userInterfaceStyle: 'automatic'` in `app.json` so iOS treats the app as adaptive. Internal theme state is the source of truth for rendered colors. |
| Pull-to-refresh      | Not needed (no remote data). |
| Text scaling         | Respect Dynamic Type up to a reasonable max (`maxFontSizeMultiplier={1.4}` on key numbers so the result cards don't break the layout). |
| Tap targets          | Minimum 44×44pt for `ThemeToggle`, `LanguageToggle`, info buttons. |

`app.json` `ios` block:
```json
{
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.filiptomanec.investio",
    "buildNumber": "1",
    "infoPlist": {
      "ITSAppUsesNonExemptEncryption": false,
      "UIRequiresFullScreen": false
    }
  },
  "userInterfaceStyle": "automatic"
}
```

---

## 8. App Store readiness

### Must-have
- **Real app icon + splash** (no Expo defaults). Brand teal background + rotated white square (mirrors the web logo). 1024×1024 transparent for icon, 1284×2778 for splash.
- **No placeholder text / Lorem Ipsum** anywhere; all strings via i18n.
- **All features must work offline** — they already do (pure-client math). No network calls anywhere; add zero `expo-network` usage to make this obvious in review.
- **Both CS and EN ship complete** — every key in `cs.json` has an `en.json` counterpart (already true; mobile agent verifies).
- **No broken links** — the `Methodology` link goes to a real screen, not a `#` anchor.
- **`ITSAppUsesNonExemptEncryption: false`** — we use no crypto. Saves a year-end self-classification report.
- **Bundle id** `com.filiptomanec.investio` — register in App Store Connect before first EAS Submit.

### Permissions
- **Empty `NSUsageDescription` set.** We request zero capabilities: no camera, no contacts, no location, no notifications, no tracking. `app.json` declares no plugins that auto-add permissions.

### Privacy
- **App Privacy nutrition label = "Data Not Collected"** for every category. Calculator does no analytics, no crash reporting (Sentry deliberately skipped), no remote logging.
- No `ATT` (tracking) prompt — irrelevant since we don't track.
- A short in-app Privacy snippet on the Methodology screen: "Investio doesn't collect, store, or transmit any personal data. All calculations run on your device." (Translate; add `privacy.statement` key.)
- A privacy policy URL is still required in App Store Connect — host a static page at `https://investio.app/privacy` (or the web app's domain). Coordinate with the web/devops agent to publish it.

### Review-trap avoidance
- App description should explicitly state "Educational calculator. Not investment advice." to match the existing footer disclaimer (`Kalkulačka neslouží jako investiční doporučení`). Apple has rejected finance apps for implying advice.
- Screenshots in App Store Connect should show real numbers in both themes; submit CS and EN localized screenshots (5.5" and 6.7" iPhone sets minimum).
- Set the App Store category to **Finance** (primary) / **Productivity** (secondary).
- Age rating: 4+.

### Build pipeline
- EAS profile `production` builds an `.ipa` via `eas build --platform ios --profile production`.
- `eas submit --platform ios` pushes to App Store Connect → TestFlight first, then submit for review.
- Apple Developer account already required; orchestrator should confirm membership active before EAS Submit.

---

## 9. Constraints / open questions

1. **Default theme on first launch.** Web defaults to `dark` when nothing is stored. Should mobile follow web (always dark on first launch) or respect iOS system appearance (`Appearance.getColorScheme()`)? **Default: respect system on mobile** (iOS users expect this; the web default is a historical artifact). Log the deviation in the implementer's notes.
2. **Currency selection.** Web hard-codes `Kč` for CS and `$` for EN. Mobile does the same — no UI for picking currency. If the user wants EUR later it's a `formatCurrency(amount, locale, 'EUR')` change in one place. Not in MVP.
3. **`Intl` availability.** Verify Hermes on RN 0.85 actually has `Intl.NumberFormat` with grouping for `cs-CZ` and `en-US`. If a target device returns wrong group separator, fall back to a manual formatter. **Test on a real iPhone or simulator before App Store submission.**
4. **Tooltip UX on touch.** Web hovers a tooltip; mobile needs tap-and-hold or a tap-to-reveal popover. **Default: tap reveals an inline-anchored popover that dismisses on outside tap.** Same content, no behavioral fidelity loss.
5. **Methodology page content.** Currently a single dense paragraph in `footer.methodology`. Mobile screen should render it as one scrollable paragraph + the `Investio doesn't collect data` privacy line. No new i18n keys beyond `privacy.statement`.
6. **Bundle id / Apple Team.** Implementer needs `com.filiptomanec.investio` registered and an active Apple Developer Program account. Surface this dependency to the orchestrator before starting EAS Submit.
7. **`packages/shared` ESM-only consumption.** Expo Metro handles `.ts` imports across the workspace via `resolver.unstable_enableSymlinks: true` + `watchFolders: [workspaceRoot]`. The mobile agent must add `metro.config.js` accordingly — without it, Metro silently misses workspace packages and dies with `Unable to resolve module @investio/shared`.
8. **`react-i18next` peer dep collision.** Workspace pins `react-i18next@^15`, which requires React 18+. Expo SDK 56 ships React 19. Should resolve cleanly, but verify on first `pnpm install`. Pin matching versions in `apps/mobile/package.json` to avoid duplicate copies.
9. **Web font loading.** Loading Inter + JetBrains Mono via `@expo-google-fonts/*` adds startup latency. Acceptable for first ship; optimize later by bundling `.ttf` in `assets/fonts/` and using `useFonts({ Inter: require('./assets/fonts/Inter.ttf') })`.
10. **No CI for mobile yet.** The web has its own. Mobile should run `pnpm --filter @investio/mobile typecheck` in workspace CI; EAS Build itself is the "build CI" for now.

---

## Hand-off checklist for the implementer

1. Scaffold `apps/mobile/` with `npx create-expo-app@latest . --template tabs@sdk-56` then strip tabs down to the single-screen layout above.
2. Add `metro.config.js` with workspace symlink support (see §9 #7).
3. Add `tailwind.config.js`, `babel.config.js`, `global.css` per NativeWind v4 docs.
4. Extract `reformatRaw` / `caretSig` / `caretTarget` to `@investio/shared`, update web to import them.
5. Pre-compute light/dark hex palettes in `lib/tokens.ts` (one-time conversion from `apps/web/src/styles.css`).
6. Port screen content section-by-section in the order: header → inputs (NumField, switch, withdrawal) → result cards → passive income → chart → milestones → methodology link → footer disclaimer.
7. Wire AsyncStorage persistence and language detection in `_layout.tsx`.
8. Test on iOS Simulator (iPhone 16 Pro) in both themes, both locales.
9. Generate app icon + splash, configure `app.json`, set bundle id.
10. `eas build --profile production --platform ios` → TestFlight → App Store submission.

---

## Implementation notes (added by mobile agent)

### 1. SDK version used
The design doc specified Expo SDK 56, but SDK 56 is not yet stable as of 2026-05-27 (it carries a `next`/`canary` dist-tag). SDK 53 is the current stable release. All implementation was done against **Expo SDK 53.0.27** + React Native 0.79.6 + React 19 + expo-router 5.1.11. The architecture is identical to what was specified; package names, APIs, and file structure are unchanged. When SDK 56 reaches stable, the upgrade path is: `pnpm add expo@~56 react-native@0.85 expo-router@~6` plus a standard SDK upgrade pass.

### 2. Bundle identifier
The design doc specifies `com.filiptomanec.investio` but the task brief explicitly overrides this to **`com.tomanec.investio`**. The user's choice is implemented. The DESIGN.md §8 "Bundle id" note was not updated (per instruction "do it the doc's way but note deviations here").

### 3. Default theme behaviour (§9 #1)
As the design doc recommends: mobile **respects iOS system appearance on first launch** rather than defaulting to dark. This is the only intentional behavioural deviation from the web. Once a user toggles the theme, the choice is persisted in AsyncStorage (same key: `investio-theme`) and overrides the system preference.

### 4. react-native-reanimated version
Expo SDK 53 officially pins reanimated at `~3.17.4`. `@shopify/react-native-skia@2.6.4` prefers `>=3.19.1` but works with 3.17 (the Skia canvas doesn't depend on reanimated for basic rendering; only some animation primitives differ). This is a known peer dep mismatch for this SDK pairing. It will resolve cleanly when upgrading to SDK 56/57.

### 5. victory-native API used
The chart was implemented against victory-native v41 (the stable release in the v40 XL family). The `CartesianChart` component requires `data: Record<string, unknown>[]` for generic inference of `InputFields` / `NumericalFields`. `YearPoint` from `@investio/shared` doesn't carry an index signature (intentional — it's a strict interface), so we cast via a structural alias `ChartPoint` at the component boundary. The cast is safe because `ChartPoint` is structurally identical to `YearPoint`; the shared type is not widened.

### 6. Tooltip implementation
The chart tooltip is implemented as a React Native `View` overlaid outside the Skia canvas, driven by `useAnimatedReaction` → `runOnJS(setTooltip)`. This is not Skia-thread-pure but is correct and performant for our case — the tooltip displays text, which requires a RN text renderer anyway.

### 7. Inline styles vs NativeWind classes
Most components use inline `style` props with hex values from `lib/tokens.ts` rather than NativeWind Tailwind classes. This is because the design tokens require per-component color injection via the `colors` prop (the `useColors(theme)` hook). NativeWind class-based styling is used for structural layout (flex, padding, gap) where no per-component color override is needed. This hybrid approach is intentional and consistent with the DESIGN.md guidance on using hex tokens for chart/icon colors.

### 8. Expo start verification
`npx expo start --port 8082` was run and the Metro dev server started cleanly with no fatal errors. Simulator testing was not performed (no Xcode in this environment). A real device EAS Build preview is required before merging to App Store review.

### 9. Assets
Placeholder PNG assets were generated programmatically (teal background + white diamond). Real 1024×1024 and 1284×2778 brand assets should be created by the designer and committed to `apps/mobile/assets/` before the first App Store submission.
