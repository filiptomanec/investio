# @investio/web

The Investio web + iOS app. Single React codebase that runs as:

1. **Web (SSR)** — TanStack Start + Nitro, deployed at https://investio-web.vercel.app
2. **iOS (Capacitor)** — Same React components served via WKWebView from a static SPA build

## Tech stack

- React 19 + TanStack Router (file-based routing)
- Tailwind CSS 4 + shadcn/ui components
- Recharts for the compound interest chart
- i18next for CS/EN localisation
- Capacitor 8 for iOS native shell

## Development

```bash
# Web dev server (SSR)
pnpm dev

# Production web build (Nitro → Vercel)
pnpm build

# Type check
pnpm typecheck
```

## Dual build targets

### Web (SSR — Vercel)

```bash
pnpm build
```

Uses `vite.config.ts` → TanStack Start + Nitro preset `vercel`. Output goes to `.vercel/output/` (Vercel Build Output API v3). **Do not change this.** The live web at https://investio-web.vercel.app is served from this build.

### iOS SPA (Capacitor)

```bash
pnpm build:spa
```

Uses `vite.spa.config.ts` → plain Vite + `@vitejs/plugin-react`. Output goes to `dist-spa/`. No server-side rendering — pure client-side React + TanStack Router. Capacitor's WKWebView loads `dist-spa/index.html`.

**Run after every code change before syncing to iOS:**

```bash
pnpm build:spa
pnpm cap:sync       # copies dist-spa/ → ios/App/App/public/
```

## iOS development

### Prerequisites

- macOS with Xcode 16+ installed
- Apple Developer account (Team ID already configured)
- Bundle ID `com.tomanec.investio` already registered in App Store Connect

### Open in Xcode

```bash
pnpm build:spa
pnpm cap:sync
pnpm cap:open      # opens ios/App/App.xcodeproj in Xcode
```

In Xcode: select **iPhone 17 Pro Max** simulator → **Cmd+R** to build and run.

### CLI build (simulator only)

```bash
cd ios/App
xcodebuild \
  -project App.xcodeproj \
  -scheme App \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  build
```

### Submitting to TestFlight / App Store

1. `pnpm build:spa && pnpm cap:sync`
2. Open Xcode (`pnpm cap:open`)
3. Product → Archive
4. Distribute App → App Store Connect → Upload
5. Build appears in TestFlight in ~5 minutes

## Assets

App icons, splash screens, and App Store listing content are preserved at `ios-assets/`:

```
ios-assets/
  icon.png              1024×1024 RGB — app icon source
  splash.png            1284×2778 RGB — splash screen source
  adaptive-icon.png     RGBA — Android foreground (unused for iOS)
  store/                App Store screenshots + MANIFEST.md
  store-listing/        Per-locale listing copy + privacy policy
```

## Native plugins (iOS only)

All calls are gated on `Capacitor.isNativePlatform()` — **no-ops on the web**.

| Plugin | Trigger |
|--------|---------|
| `@capacitor/splash-screen` | Hidden after React tree mounts (`__root.tsx`) |
| `@capacitor/status-bar` | Synced with theme on every theme toggle (`index.tsx`) |
| `@capacitor/haptics` | Light impact on theme toggle + language toggle |

See `src/lib/native.ts` for the wrapper functions.

## Privacy policy

Live at https://investio-web.vercel.app/privacy — this URL is registered in App Store Connect and must never 404. Route: `src/routes/privacy.tsx`. Source content: `ios-assets/store-listing/privacy-policy.md`.
