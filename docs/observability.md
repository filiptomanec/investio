# Observability — Sentry setup guide

Sentry is **opt-in**: if the DSN env var is absent the SDK is fully disabled and no
errors are thrown during local development. Follow the steps below when you are
ready to wire up real error monitoring (recommended before M6 launch).

---

## Step 1 — Create Sentry org and projects

1. Sign in at https://sentry.io
2. Create (or re-use) an organization — note the slug, e.g. `investio-app`
3. Create two projects:
   - **investio-web** — platform: Next.js
   - **investio-mobile** — platform: React Native
4. From each project's Settings > Client Keys (DSN), copy the DSN string

---

## Step 2 — Configure env vars

### Web (Vercel)

In the Vercel dashboard for the `investio-web` project go to Settings > Environment
Variables and add the following for **Preview** and **Production** environments:

| Variable | Value | Notes |
|---|---|---|
| `SENTRY_DSN` | `https://xxx@oyyy.ingest.sentry.io/zzz` | Server-side DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | same DSN | Exposed to the browser bundle |
| `SENTRY_AUTH_TOKEN` | see Step 3 | Required for source maps upload |
| `SENTRY_ORG` | your org slug | e.g. `investio-app` |
| `SENTRY_PROJECT` | `investio-web` | Must match project slug in Sentry |
| `NEXT_PUBLIC_VERCEL_ENV` | (set automatically by Vercel) | No manual action needed |

For local development copy `apps/web/.env.example` to `apps/web/.env.local` and
fill in the values. The `.env.local` file is gitignored — never commit real DSNs.

### Mobile (EAS)

For local development add `EXPO_PUBLIC_SENTRY_DSN` to `apps/mobile/.env`.

For EAS builds, add the secret via the EAS CLI:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://xxx@..."
```

---

## Step 3 — Generate Sentry auth token (source maps)

Source maps let Sentry show readable stack traces instead of minified code.

1. In Sentry, go to Settings > Account > API > Auth Tokens
2. Create a token with scopes: `project:releases`, `org:read`
3. Add the token as `SENTRY_AUTH_TOKEN` in Vercel (see Step 2)

Without the auth token the build still succeeds — Sentry simply won't have
de-minified stack traces. You can add source maps support at any time.

---

## Step 4 — Verify: test error endpoint (web)

After deploying to a preview or production URL:

```bash
curl https://<your-vercel-url>/api/sentry-test
```

Expected response: HTTP 500 JSON error. Within ~30 seconds an event should
appear in your Sentry project under Issues. If it does not appear:

- Check that `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` are set in Vercel
- Check Vercel build logs for `@sentry/nextjs` initialization messages
- Confirm the project DSN matches the project in your Sentry org

**Note**: the `/api/sentry-test` endpoint returns 404 in production (`VERCEL_ENV=production`).
Use a preview deployment URL for this test. Delete or keep the file with the
comment explaining its purpose — it is safe to leave in for future re-verification.

---

## Step 5 — Mobile source maps (EAS, deferred)

Source maps for Expo / React Native require the Sentry org and project to be
configured in `apps/mobile/app.json` under the `@sentry/react-native/expo` plugin:

```json
["@sentry/react-native/expo", {
  "organization": "your-org-slug",
  "project": "investio-mobile"
}]
```

Replace the `TBD` placeholders with your real values. EAS will then upload
symbol files automatically during builds. This step is deferred until the Sentry
mobile project is created and confirmed to be working with the DSN.

---

## Cost reference

| Service | Plan | Cost |
|---|---|---|
| Sentry Developer (1 user) | Free | 5 000 errors/month, 10 000 transactions |
| Sentry Team | $26/month/member | 50 000 errors, unlimited transactions |

For a hobby/MVP with low traffic the **free tier is sufficient**. Upgrade only
when you exceed the free error quota (Sentry will email you before dropping events).

---

## Reference

- `apps/web/sentry.server.config.ts` — Node.js server init
- `apps/web/sentry.edge.config.ts` — Edge runtime init
- `apps/web/sentry.client.config.ts` — Browser init
- `apps/web/instrumentation.ts` — Next.js instrumentation hook
- `apps/web/app/api/sentry-test/route.ts` — manual verification endpoint
- `apps/mobile/lib/sentry.ts` — mobile init helper
- `apps/web/.env.example` — web env var template
- `apps/mobile/.env.example` — mobile env var template
