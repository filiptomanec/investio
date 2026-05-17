# Investio

Investiční kalkulačka pro porovnání nemovitostí a akciových investic. Web + native mobile, CZ + EN.

## Audience

Veřejně dostupná web/mobile aplikace — každý uživatel má svůj účet a svoje uložené scénáře. Žádná monetizace (hobby projekt, free-tier provoz).

## Scope

### Tři kalkulačky
1. **Složené úročení** — vstup: počáteční částka, měsíční vklad, roční výnos %, horizont. Výstup: konečná hodnota + graf růstu, příspěvek vkladů vs zhodnocení.
2. **Nemovitost + cashflow** — vstup: kupní cena, vlastní kapitál, hypotéka (úrok, splatnost), pronájem, náklady, daň, údržba, zhodnocení %. Výstup: měsíční cashflow, IRR / yield, equity build-up, graf hodnoty v čase.
3. **Porovnání** — side-by-side dvou scénářů (typicky 1 akciový + 1 nemovitostní). Společný horizont, normalizovaný počáteční kapitál. Graf trajektorií + finální čísla + breakdown rozdílů.

### Persistent scénáře
- Pojmenovaný scénář s vstupy + metadaty (autor, datum vytvoření, naposledy upraveno).
- Templates: předplněné scénáře (S&P 500 historie 1995-2025, průměrný CZ činovní dům, dividendové akcie). Read-only kopírovatelné do vlastních scénářů.
- Export do PDF (jeden scénář nebo porovnání).

### Multi-platform
- **Web**: Next.js 16 App Router, PWA-friendly, responsive.
- **Mobile**: Expo + React Native (iOS + Android). Sdílené Zod schémata, kalkulační logika, i18n texty s webem přes monorepo packages.
- Auth + DB sdílené (Supabase).

### i18n
- CZ default, EN secondary. i18n od začátku (next-intl pro web, expo-localization + i18next pro mobile, sdílené message bundles).
- Měna: CZK default, EUR/USD volitelně. Formátování čísel per locale.

## Stack (předběžně — architect potvrdí v ADR-0001)

- **Monorepo**: Turborepo + pnpm workspaces
- **Web**: Next.js 16 + Tailwind + shadcn/ui + Recharts
- **Mobile**: Expo SDK 53+ + React Native + React Native Reanimated + Victory Native (graf)
- **Shared packages**: `@investio/shared` (Zod schemes + calc logic), `@investio/i18n` (messages), `@investio/db` (Prisma client + types)
- **Backend**: Next.js Route Handlers + Supabase (Postgres + Auth + RLS) + Prisma
- **PDF**: `react-pdf` (klient-side, sdílené mezi web a mobile)
- **Monitoring**: Sentry (web + mobile), žádný PostHog v MVP (hobby)
- **Hosting**: Vercel (web) + EAS preview (mobile), Supabase free tier

## Deploy targety

- **Web preview**: Vercel auto-deploy z `main`
- **Mobile preview**: EAS preview build per PR (jen pro testing, žádný store submission)
- **Production**: Vercel `main`, store submission **mimo MVP** (odložit do následující fáze)

## Deadlines

Hobby — žádný hard deadline. Sequenced milestones:

- **M0 — Architecture & design** (architect + designer): ADR-0001/0002/0003, schema, wireframes. **Checkpoint s userem před M1.**
- **M1 — Monorepo + shared packages + DB** (fullstack): Turborepo, Supabase migrace, sdílené Zod + calc logika, Vitest na calc functions.
- **M2 — Web MVP** (fullstack + designer + content): 3 kalkulačky + auth + scénáře + porovnání + grafy, i18n CZ+EN.
- **M3 — Mobile MVP** (mobile + content): Expo app s 3 kalkulačkami + scénáře + porovnání.
- **M4 — Templates + PDF export** (fullstack + content): Předplněné šablony, PDF export.
- **M5 — QA & polish** (qa + security + designer): E2E web (Playwright) + Maestro mobile, OWASP review, a11y audit, perf.
- **M6 — Deploy & launch prep** (devops + marketing): Sentry wiring, landing page se SEO. Žádný hard store submission.

## Otevřené otázky

- **Externí data** (Yahoo Finance pro ETF výnosy, CNB pro hypoteční sazby) — odloženo, MVP plně manuální vstupy.
- **Auth provider**: Supabase Auth s email/password + Google OAuth? Architect doporučí v ADR-0002.
- **Grafing**: Recharts (web) + Victory Native (mobile) vs unified Skia? Architect rozhodne v ADR-0001.
- **PDF**: client-side `react-pdf` vs server-side puppeteer? Architect rozhodne při review M4.

## Activity log

- `2026-05-17` — Projekt založen. Intake interview hotovo. Audience: public. Platforms: web + native mobile. Scope: full (kalkulačky + persistence + templates + PDF). Lokalizace: CZ + EN. Next: T-001 (architect) — ADR + schema + monorepo structure.
- `2026-05-17` — T-001 done. Architect (Opus) dodal 3 ADR (stack/auth/i18n), `docs/architecture.md` s detailní "Calc primitives" sekcí, `docs/api.md` s 9 endpoints, `docs/risks.md`. Klíčové rozhodnutí: Recharts (web) + Victory Native XL (mobile) ne unified Skia, kvůli PDF SVG export. Email/password + Google OAuth, žádný magic link v MVP. CZ daň zjednodušená 15/23 % aplikovaná na taxableIncome = max(0, grossIncome - interestPayment). Open soft-defaults (non-blocking): magic link?, daň pásmo default, default currency. Next: T-002 (architect, data model + schema.sql) + paralelně T-003 (designer, tokens) lze spustit.
- `2026-05-17` — **MVP DOKONČENO** — všech 23/23 ticketů done v jeden den. Web: landing+SEO, 3 calculators, comparison, dashboard+auth, PDF export, Sentry, Playwright E2E. Mobile: 4 tabs, Victory Native XL charts, auth UI stubs, Maestro flows, EAS preview profile. Backend: Supabase migration + RLS + 6 templates + CRUD API + i18n CZ+EN. Sec review PASS (0 critical/high, 6 medium se 5 follow-up tickets navrženo). Stack volby z M0 zůstaly stabilní celý projekt. Total ~$10-12 spent v Sonnet (implementation) + ~$1-2 Opus (architect + designer + security review). Wall-clock: ~3-4 hodiny aktivní práce. **Production readiness blokery**: 1) Supabase remote project setup (user-bound OAuth), 2) Vercel env vars vyplnění real Supabase URLs/keys, 3) optional Sentry projects + DSN, 4) follow-up tickets T-024..T-028 (post-launch hardening, ne MVP-blocking).
- `2026-05-17` — **M3 dokončena + Vercel deploy live**. PR #11 fix `prepare: prisma generate` (build na Vercelu failoval bez typed Prisma client). PR #12-15: T-012 comparison + T-013 dashboard+auth + T-014/15/16 mobile + T-017 templates content. 4 paralelní agenti přes worktree, ~16 min wall-clock. Vercel preview READY pro PR branch, production deploy pro main triggered post-merge. **Stav**: 19/23 ticketů done. Web má /calc/{compound,realestate}, /compare, /login, /signup, /dashboard (auth-gated), /api/scenarios + /api/templates. Mobile má 4 tabs (compound/real-estate/compare/dashboard) + auth UI stubs. 6 templates seeded s realistic CZ data. Next: T-018 PDF export (M4), T-019/T-020 E2E (M5), T-021 security review, T-022 Sentry, T-023 landing+SEO (M6).
- `2026-05-17` — **M2 dokončena** (PR #6, #7, #8, #9 merged). 4 paralelní agenti přes worktree, ~14 min wall-clock, ~$3 celkem. T-008 CRUD API (4 endpoints + 11 integration testů). T-010 compound web (shadcn `base-nova` init + 8 testů). T-011 real estate web (accordion form + 2 charts + 14 testů). T-014 mobile parity (auth UI stubs + EAS profile expanded). **Shadcn variant konflikt**: T-010 použil shadcn init s `base-nova` style (`@base-ui/react`), T-011 sub-agent přidal **manuálně** Radix komponenty (`@radix-ui/react-tooltip`, `@radix-ui/react-accordion`). Vyřešen merge: ponechat T-010 base-ui tooltip (z main), T-011 page upravena drop `asChild` prop (Radix-specific API). Trade-off: web app teď má **obě** primitives knihovny (base-ui + radix) — bloat, ale funkční. Cleanup ticket pro pozdě. Next: M2-zbytek T-012 (comparison) + T-013 (dashboard) + M3 mobile + M4 templates.
- `2026-05-17` — **M1 dokončena** — PR #3 + #4 merged orchestratorem (user povolil scoped merge). Konflikty v `pnpm-lock.yaml` (regen přes `pnpm install`) a `packages/shared/package.json` (union test scripts + `@vitest/coverage-v8` dep). Post-merge tests: 79/79 shared (calc 64 + formatters 15) + 6/6 RLS. Next: M2 paralelizace T-008/T-010/T-011/T-014.
- `2026-05-17` — **M1 trojka review paralelně** (3 fullstack agenti přes worktree, ~11 min wall-clock all 3, ~$1.30 celkem). **PR #2** T-007 calc logic — coverage 97.68 % stmts / 100 % funcs / 64 testů, golden masters cross-checked 0 % delta. **PR #3** T-006 Supabase+Prisma — schema napsán ručně (db pull P4002 cross-schema), RLS extension používá `SET LOCAL ROLE authenticated` + `set_config(request.jwt.claims)`, 6/6 integration testů. **PR #4** T-009 i18n — next-intl web + i18next mobile + formatters (15 testů) + check-parity skript, curl `/cs` redirect na `/`, `/en` 200. 5 nových learnings v memory/. Next: user mergne 3 PR; pak M2 paralelizace T-008/T-010/T-011/T-014.
- `2026-05-17` — **T-005 review** (fullstack, Sonnet). PR #1 https://github.com/filiptomanec/investio/pull/1 — monorepo scaffold (apps/web + apps/mobile + 6 packages), build/typecheck green, dev server 200 OK. Drobné odchylky od ADR-0001: Expo SDK 54 místo 53 (latest stable, ne breaking), Tailwind v4 místo v3 (Next.js 16 default; `globals.css` použít `@theme inline` directive — designer's `tailwind-preview.md` je stale pro v4 ale tokens jsou kompatibilní). Vercel setup čeká na user OAuth (instrukce v PR description). Po merge PR #1 + Vercel napojení odblokuje M1 paralelizace.
- `2026-05-17` — **M0 dokončena**. T-002 + T-003 + T-004 done paralelně (jeden architect call + jeden designer call). Architect dodal `docs/data-model.md` (entity, RLS test cases, polymorfní rationale) + `docs/schema.sql` (kompletní DDL s 5 RLS policies, partial unique index, trigger, seed 6 templates). Designer sloučil T-003 + T-004 do jednoho runu (nižší overhead) — dodal `docs/design/{design-system,tokens.draft.ts,tailwind-preview.md,wireframes.md}` (Investio Teal #0f766e primary, AA contrast ověřený WCAG 2.1 luminance formulí, 10 ASCII wireframů web+mobile, chart specs pro Recharts+Victory Native XL parity). Open soft-defaults: confirm Investio Teal primary, ack `based_on_template_id` v scenario. Next: M1 odblokována — T-005 (fullstack monorepo scaffold) je vstupní brána do implementace.
