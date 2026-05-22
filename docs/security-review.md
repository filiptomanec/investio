# Security Review (T-021)

**Result:** PASS with 6 medium findings  
**Date:** 2026-04-10  
**Reviewer:** Security Architect Agent

## Findings

### SR-001 — Defense-in-depth ownership filter
**Severity:** Medium  
**Location:** `apps/web/app/api/scenarios/[id]/route.ts` (GET, PATCH, DELETE), `apps/web/app/api/scenarios/[id]/duplicate/route.ts`  
**Description:** Prisma `findUnique`/`update`/`delete` calls use only `where: { id }`, relying solely on RLS for ownership enforcement. If RLS is misconfigured or the Postgres role setup regresses, a user could access another user's scenario by guessing the UUID.  
**Recommendation:** Add `user_id: userId` predicate to every `findUnique`/`findFirst` call on user-owned resources. Return 404 (not 403) when the record is not found under the user's ownership to avoid leaking existence.

### SR-002 — Security HTTP headers missing
**Severity:** Medium  
**Location:** `apps/web/next.config.ts`  
**Description:** The application serves no `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, or `Content-Security-Policy` headers. This leaves users vulnerable to clickjacking, MIME-sniffing, and protocol downgrade attacks.  
**Recommendation:** Add a `headers()` export to `next.config.ts` applying all six headers to `source: "/(.*)"`. Start CSP in report-only mode to avoid breaking changes.

### SR-003 — OAuth redirect open-redirect vulnerability
**Severity:** Medium  
**Location:** `apps/web/app/api/auth/callback/route.ts` line 56  
**Description:** The `?next=` query parameter is used directly in `NextResponse.redirect` without validation. An attacker can craft a link like `/api/auth/callback?code=...&next=//evil.com` and redirect authenticated users to an arbitrary domain after OAuth login.  
**Recommendation:** Validate that `next` starts with `/` (not `//`), contains no `://`, no backslashes, and no dangerous URI schemes. Extract validation into a testable helper `lib/safe-redirect.ts`.

### SR-004 — Supabase Auth project hardening
**Severity:** Medium  
**Location:** Supabase Dashboard → Auth settings  
**Description:** OAuth redirect URIs whitelist not restricted to production domain. Email OTP expiry using default 24h. No MFA enforcement for admin accounts.  
**Recommendation:** Restrict redirect URIs, reduce OTP expiry to 1h, enable MFA for admin. (T-027 — user-bound config, no code change required.)

### SR-005 — Rate limiting absent on auth and scenario endpoints
**Severity:** Medium  
**Location:** All Route Handlers  
**Description:** No rate limiting on `/api/auth/*` or `/api/scenarios*`. Brute-force attacks on token exchange and scenario enumeration are possible.  
**Recommendation:** Add Upstash Redis-backed rate limiting via `@upstash/ratelimit`. (T-028 — deferred until Upstash is configured.)

### SR-006 — Dependency audit
**Severity:** Low  
**Location:** `package.json`  
**Description:** `pnpm audit` shows 3 moderate advisories in transitive dependencies. None are directly exploitable in this application's threat model.  
**Recommendation:** Track and update on next scheduled dependency update cycle.

## Follow-up tickets

| Ticket | Finding | Owner |
|--------|---------|-------|
| T-024 | SR-001 Defense-in-depth ownership filter | Engineering |
| T-025 | SR-002 Security HTTP headers | Engineering |
| T-026 | SR-003 OAuth redirect whitelist | Engineering |
| T-027 | SR-004 Supabase Auth hardening | Product/Ops |
| T-028 | SR-005 Rate limiting | Engineering (Upstash setup required) |

---

## Resolution log

| Finding | Status | Ticket | Merged | Date |
|---------|--------|--------|--------|------|
| SR-001 | Fixed | T-024 | PR security: T-024 ownership filter + T-025 headers + T-026 safe-redirect | 2026-05-22 |
| SR-002 | Fixed | T-025 | PR security: T-024 ownership filter + T-025 headers + T-026 safe-redirect | 2026-05-22 |
| SR-003 | Fixed | T-026 | PR security: T-024 ownership filter + T-025 headers + T-026 safe-redirect | 2026-05-22 |
| SR-004 | Deferred | T-027 | — | — (user-bound Supabase dashboard config) |
| SR-005 | Deferred | T-028 | — | — (requires Upstash Redis setup) |
| SR-006 | Tracked | — | — | Scheduled dependency update cycle |
