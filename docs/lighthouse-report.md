# Lighthouse audit — 2026-05-22
Production URL: https://investio.filiptomanec.cz/

Audit run with Lighthouse 13.3.0, headless Chrome, desktop preset.

## Scores — BEFORE fixes (measured)

| Route | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| / (root) | 95 | 100 | 100 | 92 |
| /cs/calc/compound | 81 | 100 | 96 | 92 |
| /cs/compare | 70 | 96 | 100 | 92 |

SEO target was ≥ 95; all three routes failed.
Accessibility was strong except /cs/compare (color contrast + table headers).

## Core Web Vitals — Homepage (/)

| Metric | Value | Target | Status |
|---|---|---|---|
| LCP | 2.1 s | ≤2.5 s | ✓ |
| TBT | 240 ms | ≤200 ms | ⚠ |
| CLS | 0 | ≤0.1 | ✓ |
| FCP | 1.0 s | ≤1.8 s | ✓ |
| TTI | 6.0 s | ≤3.8 s | ✗ |
| Speed Index | 1.0 s | ≤3.4 s | ✓ |

## Core Web Vitals — /cs/calc/compound

| Metric | Value | Target | Status |
|---|---|---|---|
| LCP | 3.1 s | ≤2.5 s | ✗ |
| TBT | 490 ms | ≤200 ms | ✗ |
| CLS | 0 | ≤0.1 | ✓ |
| FCP | 0.9 s | ≤1.8 s | ✓ |
| TTI | 6.0 s | ≤3.8 s | ✗ |

## Core Web Vitals — /cs/compare

| Metric | Value | Target | Status |
|---|---|---|---|
| LCP | 5.5 s | ≤2.5 s | ✗ |
| TBT | 370 ms | ≤200 ms | ✗ |
| CLS | 0 | ≤0.1 | ✓ |
| FCP | 0.9 s | ≤1.8 s | ✓ |
| TTI | 5.5 s | ≤3.8 s | ✗ |

---

## Top findings (P0/P1)

### LH-001 — Canonical URL domain mismatch (P0, SEO)
- **Where**: `app/[locale]/layout.tsx:9`, `app/sitemap.ts:3`, `app/robots.ts:3`
- **Impact**: Lighthouse score 0 on `canonical` audit across all three audited routes. SEO ≤ 92 instead of target ≥ 95.
- **Root cause**: `BASE_URL` was hardcoded to `https://investio.app` but the production deployment is `https://investio.filiptomanec.cz`. Lighthouse detects "canonical points to another hreflang location" because the canonical href domain didn't match the serving domain.
- **Fix**: Replaced hardcoded `investio.app` with `NEXT_PUBLIC_SITE_URL` env var (fallback to `https://investio.filiptomanec.cz`) across all four files that referenced the domain. Also documented new env var in `.env.example`. **Must set `NEXT_PUBLIC_SITE_URL=https://investio.filiptomanec.cz` in Vercel environment variables.**

### LH-002 — Sub-page canonical not set (P0, SEO)
- **Where**: `app/[locale]/calc/compound/`, `app/[locale]/calc/real-estate/`, `app/[locale]/compare/`
- **Impact**: Lighthouse reports "canonical points to another hreflang location (`/calc/compound`)" on the calc page because the locale layout's `generateMetadata` only sets the locale root canonical, not the sub-page canonical.
- **Root cause**: The `"use client"` pages cannot export `generateMetadata`. No per-page server component wrapper existed.
- **Fix**: Added `layout.tsx` next to each `page.tsx` for compound, real-estate, and compare routes. Each layout exports `generateMetadata` with the correct per-route canonical and hreflang alternates. CS canonical is non-prefixed (matching `localePrefix: "as-needed"` serving behaviour).

### LH-003 — Hydration error #418 on calc pages (P1, Performance / React)
- **Where**: `app/[locale]/layout.tsx`
- **Impact**: React error #418 (text content mismatch) thrown at runtime on calc pages, visible in Lighthouse `errors-in-console` audit (score 0). Causes jank and TBT inflation.
- **Root cause**: Locale layout used inline `style={{ fontFamily: ... }}` system-font stack while root layout applied Geist variable via `next/font`. This created a font class mismatch between server and client HTML.
- **Fix**: Locale layout now loads Geist via `next/font/google` (same as root layout) and applies `geist.variable` on `<html>` + `font-sans` Tailwind class. System font stack inline style removed.

### LH-004 — Color contrast failures on /compare (P1, Accessibility)
- **Where**: `app/[locale]/compare/page.tsx` — `DiffPanel` table headers and tooltip
- **Impact**: Accessibility score 96 on /compare; two `<th>` elements with `color: #0d9488` (3.74:1 on white, fails WCAG AA 4.5:1) and multiple elements with `color: #f59e0b` (2.14:1 on white, fails 4.5:1).
- **Fix**: Replaced hardcoded hex colors with constants `TEAL_COLOR = "#0f766e"` (5.5:1 on white, matches design token `--primary`) and `AMBER_DARK_COLOR = "#92400e"` (amber-800, 5.9:1 on white). Both pass WCAG AA.

### LH-005 — `td-has-header` violation on /compare diff table (P1, Accessibility)
- **Where**: `app/[locale]/compare/page.tsx` — `DiffPanel` `<tbody>` rows
- **Impact**: Accessibility score 96; screen readers cannot associate data cells with row labels.
- **Fix**: Changed first-column `<td>` row label cells to `<th scope="row">` so assistive technologies correctly announce the row context.

---

## Additional fixes (P2, opportunistic)

### LH-006 — OG image badge shows wrong domain (P2, SEO/Branding)
- **Where**: `app/[locale]/opengraph-image.tsx:144`
- **Fix**: Updated badge text from `investio.app` to `investio.filiptomanec.cz`.

### LH-007 — No package import optimisation for lucide-react / recharts (P2, Performance)
- **Where**: `next.config.ts`
- **Fix**: Added `experimental.optimizePackageImports: ["lucide-react", "recharts"]` to enable tree-shaking of unused icon/chart exports at build time, reducing JS bundle size.

---

## Resolution log

| ID | Finding | Status |
|---|---|---|
| LH-001 | Canonical domain mismatch | Fixed — `NEXT_PUBLIC_SITE_URL` + fallback to `investio.filiptomanec.cz` |
| LH-002 | Sub-page canonicals missing | Fixed — layout.tsx added for compound, real-estate, compare |
| LH-003 | React hydration error #418 | Fixed — Geist font via `next/font` in locale layout |
| LH-004 | Color contrast failures on /compare | Fixed — `#0f766e` teal + `#92400e` amber-800 |
| LH-005 | `td-has-header` on diff table | Fixed — `<th scope="row">` on row label cells |
| LH-006 | OG image wrong domain | Fixed — updated to `investio.filiptomanec.cz` |
| LH-007 | No package import optimisation | Fixed — `optimizePackageImports` in next.config.ts |
| LH-008 | TTI / TBT high on calc pages (JS bootup ~1.4s) | Deferred — caused by Recharts + react-hook-form hydration cost on `"use client"` pages. Fixing requires SSR/streaming refactor; out of scope for this pass. |
| LH-009 | Redirect 307 on /cs/calc/compound (+790ms) | Deferred — caused by `localePrefix: "as-needed"` next-intl middleware redirecting `/cs/...` to `/...` for default locale. Fix requires either changing localePrefix to `"always"` (breaks all CS links) or adding a Vercel rewrite rule. Deferred to a routing-strategy ticket. |
| LH-010 | Unused JS 392-546 KiB | Deferred — Next.js prefetches adjacent route chunks; this is expected behaviour. `optimizePackageImports` (LH-007) reduces worst-case size. Further reduction requires route-level lazy splitting. |

---

## Required action (Vercel)

Set `NEXT_PUBLIC_SITE_URL=https://investio.filiptomanec.cz` in the Vercel project environment variables (Production environment). Without this env var, the fallback value in code is used which is already correct, but the explicit env var is the safe long-term approach.

## Scores — AFTER fixes (expected)

Post-deploy measurements should be done after Vercel picks up the branch. Expected improvements:

| Route | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| / | 95+ | 100 | 100 | **98+** |
| /cs/calc/compound | 81+ | 100 | **100** | **98+** |
| /cs/compare | 70 | **100** | 100 | **98+** |

SEO target ≥ 95 should be met post-deploy once `NEXT_PUBLIC_SITE_URL` is set.
Performance on calc pages remains limited by Recharts JS boot cost (deferred LH-008).
