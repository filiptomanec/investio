# Web E2E Tests — Playwright

## Quick start

1. Make sure the Next.js dev server is running:

   ```sh
   pnpm --filter @investio/web dev
   ```

2. Run the full E2E suite:

   ```sh
   pnpm --filter @investio/web test:e2e
   ```

3. Open the Playwright UI (interactive mode):

   ```sh
   pnpm --filter @investio/web test:e2e:ui
   ```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | Override to run against a Vercel preview or staging URL |
| `NEXT_PUBLIC_SUPABASE_URL` | _(empty)_ | Required only for auth tests that call the real backend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | _(empty)_ | Required only for auth tests that call the real backend |

When `NEXT_PUBLIC_SUPABASE_URL` is not set, the app operates in "unconfigured" mode.
All calculator tests pass in this mode. Auth tests that only check client-side
validation also pass. Tests requiring a real Supabase backend are marked with
`test.skip()`.

## Test files

| File | What it covers |
|---|---|
| `calc-compound.spec.ts` | Live recalc on input change, chart rendering, locale switch CS→EN |
| `compare.spec.ts` | Default scenarios load, both columns visible, share button copies URL |
| `auth.spec.ts` | Anon redirect to /login, signup validation, Google button disabled state |
| `pdf-export.spec.ts` | **Skipped** — awaiting T-018 (PDF export) merge |

## Manual tests (not automated)

These flows require a live Supabase project with email delivery and cannot be
run in a headless environment without significant infrastructure.

### Full signup flow

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
   `apps/web/.env.local` pointing to a local or remote Supabase instance.
2. Start the dev server: `pnpm dev`
3. Navigate to `http://localhost:3000/signup`
4. Fill in a real email address (or use [Mailhog](https://github.com/mailhog/MailHog)
   locally via Supabase local auth SMTP settings).
5. Fill password (8+ characters) and confirm password.
6. Click "Registrovat se".
7. Expected: success screen "Zkontrolujte e-mail".
8. Open the confirmation email and click the link.
9. Expected: redirect to `/dashboard`.

### Login with valid credentials

Prerequisites: a confirmed user account exists.

1. Navigate to `http://localhost:3000/login`
2. Fill email and password.
3. Click "Přihlásit se".
4. Expected: redirect to `/dashboard`.

### Google OAuth

Prerequisites: Google OAuth provider configured in Supabase dashboard.

1. Navigate to `http://localhost:3000/login`
2. Click "Přihlásit se přes Google".
3. Expected: redirect to Google OAuth consent screen.

## CI integration

CI wire-up is deferred to T-022 (DevOps). The `playwright.config.ts` is already
prepared for CI:

- `retries: 2` in CI, `0` locally
- `workers: 1` in CI to avoid port conflicts
- `reuseExistingServer: false` in CI (always spawns a fresh server)

The GitHub Actions workflow (`T-022`) will need:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}

- run: pnpm --filter @investio/web exec playwright install --with-deps chromium

- run: pnpm --filter @investio/web test:e2e
  env:
    CI: true
```
