# QA Strategy — Investio MVP

## Overview

Two E2E suites cover the main user flows:

- **Web**: Playwright (Chromium, headless)
- **Mobile**: Maestro (iOS simulator or Android emulator, EAS dev build)

Unit and integration tests live in each package (`vitest`). This document
focuses on the E2E layer.

---

## Web E2E — Playwright

### Location

`apps/web/e2e/`

### How to run

```sh
# Requires dev server running first:
pnpm --filter @investio/web dev

# Run all tests:
pnpm --filter @investio/web test:e2e

# Interactive UI mode:
pnpm --filter @investio/web test:e2e:ui
```

### Flows covered

| Spec file | Flows |
|---|---|
| `calc-compound.spec.ts` | Live recalc on input change; chart card (`data-testid="compound-chart"`) renders SVG; locale switch CS → EN; no JS errors on reload |
| `compare.spec.ts` | Default scenarios load without URL params; both scenario columns visible; share button copies URL with `?a=&b=` params to clipboard |
| `auth.spec.ts` | Anon visit to `/dashboard` redirects to `/login`; signup empty-email validation; signup mismatched-password validation; login Google button disabled in unconfigured mode |
| `pdf-export.spec.ts` | **Skipped** — T-018 (PDF export) not merged at time of authoring |

### Flows intentionally NOT automated

- **Full signup → email confirm → session**: requires a live Supabase instance
  with email delivery. Documented as a manual checklist in
  `apps/web/e2e/README.md`.
- **Login with valid credentials**: same reason — needs real Supabase.
- **Google OAuth**: requires Google OAuth provider configured in Supabase dashboard.
- **PDF export**: see `pdf-export.spec.ts` — pending T-018 merge.

### Configuration

`apps/web/playwright.config.ts`:

- `baseURL`: defaults to `http://localhost:3000`, overrideable via `E2E_BASE_URL`
  environment variable (enables running against Vercel preview URLs).
- `timeout`: 30 s per test.
- `retries`: 2 in CI, 0 locally.
- `projects`: Chromium only (MVP scope; mobile viewports to be added later).
- `webServer`: auto-starts `pnpm dev`; uses `reuseExistingServer` locally.

---

## Mobile E2E — Maestro

### Location

`apps/mobile/.maestro/`

### Prerequisites

- Maestro CLI installed (`brew install --cask maestro`)
- iOS simulator or Android emulator running
- **EAS dev build** installed (not Expo Go — Skia native module requires it)

### How to run

```sh
cd apps/mobile
maestro test .maestro/
```

### Flows covered

| Flow file | What it tests |
|---|---|
| `01-launch.yaml` | App launches; compound tab visible in tab bar |
| `02-calc-compound.yaml` | Navigate to compound tab; enter initial amount; result hero card visible |
| `03-dashboard.yaml` | Navigate to dashboard; graceful unconfigured-backend banner visible |

### Flows intentionally NOT automated (mobile)

- **Signup / login**: requires live Supabase. The auth screens exist
  (`apps/mobile/app/(auth)/login.tsx`, `signup.tsx`) but the backend is
  placeholder in dev builds.
- **Scenario save**: T-013 wired this to a stub in the current build. Full flow
  requires Supabase + RLS integration test (T-006 covers this at the DB layer).
- **Real estate calculator**: mirrors compound structure; a `04-calc-real-estate.yaml`
  flow can be added in a follow-up ticket.

---

## CI Integration Roadmap (T-022 — out of scope here)

This is a reference for the DevOps ticket.

### Web (Playwright)

```yaml
# .github/workflows/e2e-web.yml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}

- run: pnpm --filter @investio/web exec playwright install --with-deps chromium

- run: pnpm --filter @investio/web test:e2e
  env:
    CI: true
    E2E_BASE_URL: ${{ vars.VERCEL_PREVIEW_URL }}   # optional — omit to use localhost
```

### Mobile (Maestro)

Maestro requires a device or cloud service for CI. Options:

- **Maestro Cloud** (`maestro cloud --apiKey ...`): managed SaaS, easiest setup.
- **BrowserStack App Automate**: enterprise alternative.
- **Self-hosted iOS**: GitHub Actions `macos-latest` runner with simulator, but
  setup time is ~10 min per run.

Recommendation: defer mobile CI to post-MVP. Priority is web CI (T-022).

---

## Risk coverage

| Risk | Covered by |
|---|---|
| R-02: Calc errors destroy trust | `calc-compound.spec.ts` — live recalc produces a visible result |
| R-03: Web/mobile parity drift | Maestro flows use same input values as Playwright compound tests |
| R-04: i18n key drift | `calc-compound.spec.ts` locale switch; no raw keys visible in EN render |
| R-05: Performance — live recalc | `calc-compound.spec.ts` recalc test: result updates within 5 s on default hardware |
