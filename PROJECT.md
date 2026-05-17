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
- `2026-05-17` — **M0 dokončena**. T-002 + T-003 + T-004 done paralelně (jeden architect call + jeden designer call). Architect dodal `docs/data-model.md` (entity, RLS test cases, polymorfní rationale) + `docs/schema.sql` (kompletní DDL s 5 RLS policies, partial unique index, trigger, seed 6 templates). Designer sloučil T-003 + T-004 do jednoho runu (nižší overhead) — dodal `docs/design/{design-system,tokens.draft.ts,tailwind-preview.md,wireframes.md}` (Investio Teal #0f766e primary, AA contrast ověřený WCAG 2.1 luminance formulí, 10 ASCII wireframů web+mobile, chart specs pro Recharts+Victory Native XL parity). Open soft-defaults: confirm Investio Teal primary, ack `based_on_template_id` v scenario. Next: M1 odblokována — T-005 (fullstack monorepo scaffold) je vstupní brána do implementace.
