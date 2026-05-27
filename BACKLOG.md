# BACKLOG — `workspaces/investio`

> Single source of truth pro delivery. Orchestrator píše, specialisté čtou + claimují, hand-back přes status změnu + commit/PR link.
> Plné workflow viz `docs/playbooks/backlog-workflow.md`. Linear handoff (pokud používáš) viz `docs/playbooks/agent-handoff.md`.

## Stav

- **Projekt**: `workspaces/investio`
- **Aktivní fáze**: M1 — App Store submission prep (Capacitor iOS)
- **Last sync**: 2026-05-27 (fullstack — React Native → Capacitor pivot)
- **Repo**: `filiptomanec/investio`

## Konvence

- **ID**: `T-NNN`, monotónní, **append-only**. Nikdy nepřečíslovávej — láme reference.
- **Status**: `pending` → `in_progress` → `review` → `done` | `blocked` | `cancelled`
- **Owner**: jediný agent. Pokud potřebuješ dvě role, **rozštěp ticket**.
- **Acceptance criteria**: testovatelné checkboxy. „Funguje to" není kritérium.
- **Blocked by / Blocks**: dependency graf. Specialista nesmí začít, dokud blokátoři nejsou `done`.
- **Hand-back**: jediná povinná věta v ticketu po dokončení = link na PR / commit / soubor.

## Tickety

<!-- Orchestrator: nové tickety přidávej DOLŮ. Hotové tickety nesmazávej, jen `done`. -->

### T-001 — Wire `/privacy` route on the web app to render the privacy policy markdown

- **Owner**: devops
- **Status**: done
- **Blocks**: App Store submission (Privacy Policy URL must resolve before Apple review)
- **Blocked by**: —
- **Brief**: The App Store requires a live Privacy Policy URL before app review. The policy content is written and committed at `apps/web/ios-assets/store-listing/privacy-policy.md`. Wire a `/privacy` route on the web app (`https://investio-web.vercel.app/privacy`) to render the English section of that file as a static page. The Czech section can be included as-is below the English text.
- **Acceptance criteria**:
  - [x] `GET https://investio-web.vercel.app/privacy` returns HTTP 200
  - [x] Page renders English privacy policy text clearly (no raw markdown, no 404)
  - [x] Czech section also visible on the same page (below the fold or in a second section)
  - [x] Page is publicly accessible without login
  - [x] `<title>` and `<meta name="description">` present for the route
  - [x] No redirect chains — URL resolves directly
- **Hand-back**: Route implemented at `apps/web/src/routes/privacy.tsx`. Deployed on next Vercel push to `main`.

---

### T-002 — SUPERSEDED by T-006 (React Native removed)

- **Owner**: user (Filip)
- **Status**: cancelled
- **Superseded-by**: T-006
- **Brief**: Was: Fill in EAS project ID and Apple credentials. Superseded by the Capacitor pivot — EAS/Expo are no longer used.

---

### T-003 — SUPERSEDED by T-006 (React Native removed)

- **Owner**: user (Filip)
- **Status**: cancelled
- **Superseded-by**: T-006
- **Brief**: Was: Run first EAS production build + TestFlight upload. Superseded by the Capacitor pivot.

---

### T-004 — App Store submission (Capacitor)

- **Owner**: user (Filip)
- **Status**: pending
- **Blocks**: —
- **Blocked by**: T-006 (done)
- **Brief**: Submit the production Capacitor build to App Store review.
- **Acceptance criteria**:
  - [ ] Privacy policy URL resolves (`https://investio-web.vercel.app/privacy` — T-001 done)
  - [ ] App Store Connect metadata filled (store listing copy at `apps/web/ios-assets/store-listing/`)
  - [ ] Screenshots uploaded (EN + CS, stored at `apps/web/ios-assets/store/screenshots/`)
  - [ ] Open Xcode → Archive → Distribute App → App Store Connect → Upload
  - [ ] Build appears in TestFlight in App Store Connect dashboard
  - [ ] App status shows "Waiting for Review" in App Store Connect

---

### T-005 — TestFlight beta test via Capacitor build

- **Owner**: user (Filip)
- **Status**: pending
- **Blocks**: T-004
- **Blocked by**: T-006 (done)
- **Brief**: Build a release IPA via Xcode Archive and submit to TestFlight for beta testing before App Store review.
- **Acceptance criteria**:
  - [ ] `pnpm build:spa && pnpm cap:sync` run from `apps/web/`
  - [ ] Xcode: Product → Archive succeeds (no code signing errors — dev team configured)
  - [ ] Distribute App → TestFlight → upload succeeds
  - [ ] Build visible in TestFlight, installable on Filip's device

---

### T-006 — Capacitor iOS wrap (React Native pivot)

- **Owner**: fullstack
- **Status**: done
- **Blocks**: T-004, T-005
- **Blocked by**: —
- **Brief**: Remove React Native scaffold (`apps/mobile/`), preserve all assets/listings, wrap the existing TanStack Start web app with Capacitor for iOS. Single codebase — web and iOS share exact same React components.
- **Acceptance criteria**:
  - [x] `apps/mobile/` deleted (assets preserved at `apps/web/ios-assets/`)
  - [x] `pnpm build:spa` in `apps/web/` produces `dist-spa/index.html` (static SPA, no SSR)
  - [x] `apps/web/capacitor.config.ts` created with bundle ID `com.tomanec.investio`
  - [x] `apps/web/ios/` Xcode project created via `cap add ios`
  - [x] App icon (1024×1024) placed at `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
  - [x] Splash screen images generated and placed
  - [x] `ITSAppUsesNonExemptEncryption = false` in `Info.plist`
  - [x] `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/haptics` wired in React code
  - [x] `pnpm cap:sync` syncs web assets to iOS project
  - [ ] App builds in Xcode simulator (iPhone 17 Pro Max)
  - [ ] Calculator, theme toggle, lang toggle, chart all functional in simulator
- **Hand-back**: See commit `feat(ios): wrap web app with Capacitor for iOS`. Xcode project at `apps/web/ios/App/App.xcodeproj`.

---

## Activity log

- `2026-05-27` — Marketing agent shipped App Store listing copy (EN + CS) + privacy policy (EN + CS) + privacy nutrition labels + shared metadata. Files at `apps/mobile/store-listing/`. Next: T-001 (devops) to unblock App Store submission.
- `2026-05-27` — Devops: T-001 done. `/privacy` route wired at `apps/web/src/routes/privacy.tsx`. EAS Build/Submit config written (`eas.json`, `app.config.ts`, `package.json` scripts, `.github/workflows/mobile-build.yml`). Privacy link added to web footer and mobile methodology screen. Opened T-002/T-003/T-004 for remaining human-gated steps.
- `2026-05-27` — Fullstack: React Native → Capacitor pivot. `apps/mobile/` deleted, assets preserved at `apps/web/ios-assets/`. Capacitor 8 installed, `build:spa` script added, iOS Xcode project generated at `apps/web/ios/`. Native plugins (StatusBar, SplashScreen, Haptics) wired in React code. T-002/T-003 cancelled (EAS/Expo superseded). T-005/T-006 opened.
