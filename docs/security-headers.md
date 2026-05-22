# Security HTTP Headers (T-025 / SR-002)

All security headers are injected by the `headers()` function in `apps/web/next.config.ts`
and apply to every route (`source: "/(.*)"` pattern).

## Headers applied

### Strict-Transport-Security (HSTS)

```
max-age=63072000; includeSubDomains; preload
```

Forces all browsers that have visited the site to use HTTPS for the next 2 years (63 072 000 seconds).
`includeSubDomains` covers every subdomain. `preload` makes the domain eligible for submission to
the HSTS preload list maintained by browsers, so new visitors also get HTTPS-only enforcement
without needing a prior visit.

### X-Frame-Options

```
DENY
```

Prevents the page from being loaded inside an `<iframe>`, `<frame>`, or `<object>` element on any
origin, blocking clickjacking attacks. `frame-ancestors 'none'` in the CSP directive does the same
at a more modern level; both are included for defence in depth across older and newer browsers.

### X-Content-Type-Options

```
nosniff
```

Instructs browsers not to guess (sniff) the MIME type of a response. Without this header, some
browsers might execute a JavaScript file served as `text/plain` if it looks like a script, which
is a common vector for MIME-sniffing attacks.

### Referrer-Policy

```
strict-origin-when-cross-origin
```

When navigating within the same origin, the full URL (path + query) is sent in the `Referer` header.
When navigating cross-origin, only the origin (scheme + host + port) is sent. When navigating from
HTTPS to HTTP, nothing is sent. This prevents leaking sensitive query-string data (e.g. access
tokens in URLs) to third-party servers while preserving useful same-origin analytics.

### Permissions-Policy

```
camera=(), microphone=(), geolocation=()
```

Disables access to the device camera, microphone, and geolocation APIs for the application and any
embedded third-party content. Investio does not use these APIs; disabling them reduces the attack
surface if a dependency is ever compromised.

### Content-Security-Policy (CSP)

The CSP is built dynamically in `buildCsp()` using `NEXT_PUBLIC_SUPABASE_URL` to whitelist the
Supabase endpoint. The full policy:

| Directive | Value | Reason |
|-----------|-------|--------|
| `default-src` | `'self'` | Catch-all: only same-origin resources allowed by default |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | Next.js webpack runtime requires `unsafe-eval`; inline scripts are used by SSG/RSC hydration |
| `style-src` | `'self' 'unsafe-inline'` | Next.js injects inline styles for critical CSS |
| `img-src` | `'self' data: blob:` | Same-origin images + data URIs (base64 avatars) + blob URLs |
| `font-src` | `'self'` | Only self-hosted fonts |
| `connect-src` | `'self' <SUPABASE_URL> <SUPABASE_WSS> https://*.sentry.io https://sentry.io` | Supabase REST API + Realtime WebSocket + Sentry error reporting |
| `frame-ancestors` | `'none'` | No iframes embedding (reinforces X-Frame-Options) |
| `form-action` | `'self'` | Form submissions only to same origin |
| `base-uri` | `'self'` | Prevents `<base>` tag injection attacks |
| `object-src` | `'none'` | Disables Flash and other plugins |

## Report-only mode vs enforce mode

### Default: report-only

The header key defaults to `Content-Security-Policy-Report-Only`, which means violations are logged
(in the browser DevTools Console and in any configured report endpoint) but **do not block content**.
This is the safe starting mode — it lets you observe what would be blocked without breaking the app.

### Switching to enforce mode

Once you have observed CSP violations (ideally in Sentry or a dedicated CSP report endpoint) and
addressed all legitimate violations, switch to enforce mode by setting the environment variable:

```
CSP_REPORT_ONLY=false
```

Add this to your Vercel environment variables (Settings → Environment Variables). The header key will
change to `Content-Security-Policy` on the next deployment, and browsers will actively block any
policy violations.

### Monitoring CSP violations in Sentry

1. In Sentry, go to **Settings → Security Headers** for your project.
2. Copy the report URI (e.g. `https://o123.ingest.sentry.io/api/456/security/?sentry_key=...`).
3. Add a `report-uri` directive to the CSP in `buildCsp()`:
   ```ts
   `report-uri ${process.env["SENTRY_CSP_REPORT_URI"] ?? ""}`,
   ```
4. Set `SENTRY_CSP_REPORT_URI` in Vercel.
5. Violations will appear in Sentry under **Security** → **CSP Reports**.

## Verifying headers in production

```bash
# Replace with your production URL
curl -sI https://investio.cz/cs/dashboard | grep -iE \
  "strict-transport|x-frame|x-content-type|referrer|permissions|content-security"
```

Expected output: all 6 header keys present.

## Changes required when adding new third-party services

When integrating a new third-party service, update `buildCsp()` in `apps/web/next.config.ts`:

- **External CDN scripts** → add to `script-src`
- **Fonts from Google Fonts** → add `https://fonts.googleapis.com` to `style-src` and
  `https://fonts.gstatic.com` to `font-src`
- **Analytics pixel** → add domain to `img-src`
- **API endpoint** → add domain to `connect-src`
