# BACKLOG — Investio

> Single source of truth pro delivery. Šablona: `templates/BACKLOG.md`. Workflow: `docs/playbooks/backlog-workflow.md`.

## Stav

- **Projekt**: `workspaces/investio/`
- **Aktivní fáze**: M0 — Architecture & design (čeká na T-001 spawn)
- **Last sync**: 2026-05-17 — backlog vytvořen orchestratorem
- **Linear team**: Filiptomanec (Linear handoff neaktivní pro MVP — file-based BACKLOG.md stačí, ticketů ~25)
- **Repo**: TBD — fullstack založí v T-005 (`filiptomanec/investio`)

## Konvence

Standardní per `templates/BACKLOG.md`. Append-only. Owner = jeden agent. AC = testovatelné checkboxy.

## Tickety

### M0 — Architecture & design

#### T-001 — Architecture & ADRs

- **Owner**: architect
- **Status**: done
- **Blocks**: T-002, T-005
- **Blocked by**: —
- **Brief**: Navrhnout system architecture pro web+mobile monorepo s sdílenými packages, vybrat stack v ADR formátu. Tři ADR: stack, auth, i18n strategie. Plus `docs/architecture.md`, `docs/api.md` (plánované routes), `docs/risks.md`.
- **Inputs**:
  - `PROJECT.md` (audience, scope, předběžný stack)
  - `templates/BACKLOG.md` (ticket schema, pokud potřebuje doplnit)
  - `memory/adr-index.md` (ADR šablona)
  - `memory/learnings.md` (cross-project gotchas — Next.js+Prisma, paralelní agenty)
- **Acceptance criteria**:
  - [x] `docs/decisions/ADR-0001-stack.md` — Turborepo + pnpm, Next.js 16 web, Expo SDK 53 mobile, Recharts + Victory Native XL separate, 5 shared packages
  - [x] `docs/decisions/ADR-0002-auth.md` — Supabase Auth email+Google OAuth (no magic link), `@supabase/ssr` cookies web, `expo-secure-store` mobile, RLS `auth.uid() = user_id` default-deny
  - [x] `docs/decisions/ADR-0003-i18n.md` — `next-intl` web + `i18next` mobile, sdílené ICU bundles `packages/i18n/locales/`, `Intl.NumberFormat` formátování, CI parity check
  - [x] `docs/architecture.md` — monorepo tree, deploy topology, data flow web+mobile separate paths, **Calc primitives** sekce s vzorci + edge cases + IRR algoritmem + CZ daň
  - [x] `docs/api.md` — 9 endpointů, Zod discriminated union schemas, mobile-skips-API note
  - [x] `docs/risks.md` — 5 rizik (RLS bypass, calc chyby, parita drift, i18n drift, perf) s konkrétními mitigacemi
  - [x] `memory/adr-index.md` — 3 nové entries v `investio` sekci
- **Cost note**: Opus — design fáze, decision-heavy
- **Notes**: První projekt po Etapě C → orchestrator si chce ověřit, že ADR-driven design opravdu vede k použitelnému planu. Architect by NEMĚL psát žádný kód, jen design. Při review tickety k implementačnímu backlogu (T-005+).
- **Hand-back**: 7 souborů viz AC. Klíčová rozhodnutí: (1) Recharts+Victory Native XL ne unified Skia kvůli PDF SVG; (2) email+Google OAuth bez magic link kvůli mobile deeplink complexity; (3) sdílený single JSON bundle ICU pro CZ+EN, dva loadery; (4) calc primitives plně specifikované — fullstack T-007 bez dalších otázek; (5) CZ daň zjednodušená 15/23 % na taxableIncome=max(0, grossIncome - interest), žádný paušál ani solidární zvýšení v MVP, UI disclaimer.
  Open soft-defaults: auth methods (magic link?), CZ daň pásmo default, default currency CZK, doménový name TBD.

#### T-002 — Data model + schema.sql

- **Owner**: architect
- **Status**: done
- **Blocks**: T-006
- **Blocked by**: T-001
- **Brief**: ER model pro Investio entity (User implicitně přes Supabase Auth, Scenario, ScenarioVersion, Template). Postgres schema s RLS policies. Konkrétní SQL.
- **Inputs**:
  - `docs/decisions/ADR-0001-stack.md`
  - `docs/decisions/ADR-0002-auth.md`
  - PROJECT.md scope (scenário s metadata, templates jako read-only seed)
- **Acceptance criteria**:
  - [x] `docs/data-model.md` — ER diagram, atributy, vztahy, indexy, business invarianty, polymorfní rationale + exit kritéria, RLS test cases
  - [x] `docs/schema.sql` — kompletní DDL (extensions, template+scenario, partial unique index, trigger, 5 RLS policies, seed 6 templates s `on conflict do nothing`)
  - [x] `-- RATIONALE:` komentář u každé policy (5/5)
  - [x] Scenario CRUD owner-only, Template public read, no write policies (service role only)
- **Cost note**: Opus
- **Notes**: Schema musí počítat s tím, že Scenario obsahuje vstupy pro 2 typy kalkulaček (stock vs real estate) — buď polymorfní design (`type` + `params jsonb`) nebo dvě tabulky. Architect rozhodne, dokumentuje trade-off.
- **Hand-back**: 2 soubory: `docs/data-model.md`, `docs/schema.sql`. Rozhodnutí: (1) single-table polymorphism `type + inputs jsonb`, exit kritéria dokumentovaná; (2) ScenarioVersion dropnut z MVP — `updated_at` + client undo stačí; (3) soft delete + case-insensitive unique scoped na non-archived `(user_id, lower(name)) WHERE archived_at IS NULL`. **Poznámka**: architect přidal `based_on_template_id` sloupec (`on delete set null`) protože byl v `api.md` `ScenarioDetailSchema`; konzistentní s API kontraktem, čeká na ack.

#### T-003 — Design system + tokens

- **Owner**: designer
- **Status**: done
- **Blocks**: T-010
- **Blocked by**: T-001
- **Brief**: Vizuální identita Investio. Design tokens (barvy, typo, spacing) v sdílené formě (CSS vars pro web, JS export pro mobile). shadcn/ui theme. Finance vibe ale ne korporátní — friendly + důvěryhodné.
- **Inputs**:
  - `docs/architecture.md`
  - `docs/decisions/ADR-0001-stack.md` (designer vidí, že existuje web + mobile a tokeny musí být sdílené)
- **Acceptance criteria**:
  - [x] `docs/design/tokens.draft.ts` — pure TS exports (palette, colors light+dark, fontFamilies, fontSize, fontWeight, spacing, breakpoints, radii, shadows, motion, zIndex). Připravené k 1:1 přesunu do `packages/design-tokens/` v T-005.
  - [x] `docs/design/tailwind-preview.md` — ukázka globals.css (HSL CSS vars) + tailwind.config.ts mapping + RN useInvestioTheme preview
  - [x] `docs/design/design-system.md` — brand voice, paletta, typography, contrast tabulka pro AA
  - [x] a11y: všechny FG/BG páry mají měřený AA kontrast (≥4.5:1 normal, ≥3:1 large/UI), success/warning posunuty na 700-step varianty kvůli kontrastu
- **Cost note**: Opus
- **Notes**: Brand voice: friendly + důvěryhodné, žádné křiklavé barvy, žádné stock-broker neon. Inspirace: Lunch Money, You Need a Budget, Finmap.
- **Hand-back**: 3 soubory pro T-003: `docs/design/{design-system,tokens.draft.ts,tailwind-preview.md}`. Rozhodnutí: (1) **Investio Teal #0f766e** primary (důvěra modré + hint růstu zelené, bez crypto neonu); amber #f59e0b secondary; slate neutrals. (2) Type scale 1.2 ratio (minor third), system fonts, tabular numbers povinné. (3) Chart series tokens distinguishable v deuteranopia/protanopia. **Open**: confirm primary brand color teal (5-min swap pokud user chce jinou).

#### T-004 — Wireframy klíčových obrazovek

- **Owner**: designer
- **Status**: done
- **Blocks**: T-010, T-011, T-012, T-013
- **Blocked by**: T-003
- **Brief**: Low-fi wireframy pro: dashboard scénářů, compound interest calc detail, real estate calc detail, comparison view (side-by-side). Pro web i mobile (responsive vs native layout).
- **Inputs**: T-003 tokens, PROJECT.md scope
- **Acceptance criteria**:
  - [x] `docs/design/wireframes.md` — Landing (web), Dashboard + 3 calc + comparison × (web + mobile) = 10 ASCII wireframů
  - [x] User flow diagram (anonymous → signup → empty dashboard → new scenario → calc → save → return → compare → export PDF)
  - [x] Chart specs: compound = stacked area, real estate = stacked area + overlay line, comparison = overlay line. Vědomě omezené na Recharts + Victory Native XL feature parity.
- **Cost note**: Opus
- **Hand-back**: 1 soubor `docs/design/wireframes.md` (sloučeno s T-003 runem — overhead nízký, stejný kontext). Empty/loading/error states tabulka navíc.

### M1 — Monorepo + DB + sdílené packages

#### T-005 — Monorepo scaffold + GitHub repo

- **Owner**: fullstack
- **Status**: done (PR #1 merged)
- **Blocks**: T-006, T-008, T-009
- **Blocked by**: T-001
- **Brief**: Inicializovat Turborepo monorepo s `apps/web` (Next.js 16), `apps/mobile` (Expo placeholder), `packages/shared` (Zod + calc logic), `packages/i18n`, `packages/db` (Prisma). Push do GitHub `filiptomanec/investio`. Vercel projekt nakonfigurovat (Git auto-deploy z `main`).
- **Inputs**: `docs/decisions/ADR-0001-stack.md`
- **Acceptance criteria**:
  - [x] `pnpm install` projde
  - [x] `pnpm --filter @investio/web build` projde, `pnpm typecheck` projde (7/7 packages)
  - [x] GitHub repo `filiptomanec/investio` private vytvořen, allowlist respektován (PR workflow)
  - [ ] Vercel projekt napojený — **čeká na usera** (interactive OAuth, step-by-step v hand-backu)
- **Cost note**: Sonnet (~$0.60–0.80 reálně, 120–150k input + 40–50k output tokens, 142 tool calls, 14 min)
- **Notes**: Pamatuj na `learnings.md` — `git push origin <branch>` (ne bare), pokud spawn paralelně s něčím jiným pak `isolation: "worktree"`.
- **Hand-back**: **PR #1**: https://github.com/filiptomanec/investio/pull/1. Drobné odchylky od ADR-0001: (1) Expo SDK 54 místo 53 (latest stable, `create-expo-app` neumožňuje pin na 53; funkčně OK); (2) Tailwind v4 místo v3 (Next.js 16 default; agent upravil `globals.css` se `@theme inline` directive Tailwind v4 way; tokens.draft.ts kopie v `packages/design-tokens/src/index.ts` beze změny). `tailwind-preview.md` je teď stale pro v4. Vercel napojení vyžaduje user OAuth — step-by-step instrukce v PR description.

#### T-006 — Supabase schema + Prisma client

- **Owner**: fullstack
- **Status**: done (PR #3 merged)
- **Blocks**: T-008
- **Blocked by**: T-002, T-005
- **Brief**: Aplikovat `docs/schema.sql` do Supabase projektu. Prisma client v `packages/db` s typed exports. Lokální dev workflow (`supabase start` + `pnpm prisma generate`).
- **Inputs**: `docs/schema.sql`, `docs/data-model.md`, `apps/web/.env.example`
- **Acceptance criteria**:
  - [x] `supabase/migrations/20260517000000_initial.sql` matches `docs/schema.sql` + git SHA header
  - [x] `supabase db reset` projde lokálně (porty 54331–54337 protože 54321 kolidoval s todo-app)
  - [x] `packages/db` exportuje typed Prisma client (`getPrismaForUser(userId)` s RLS extension) + Scenario/Template typy
  - [x] RLS integration test (6/6 pass): user A creates → user B nečte, anon nečte, cross-user update fails
- **Cost note**: Sonnet (~$0.30–0.50, 11 min, 87 tool calls — 2 debugging iterations: `db pull` selhal a `SET LOCAL ROLE` chyběl)
- **Hand-back**: **PR #3** https://github.com/filiptomanec/investio/pull/3. Fait accompli: (1) `prisma db pull` selhal s P4002 (cross-schema reference do `auth.users`); schema napsán ručně, modely Scenario+Template s `user_id String @db.Uuid // references auth.users(id)`. (2) RLS extension musí volat `SET LOCAL ROLE authenticated` PLUS `set_config('request.jwt.claims', ...)` ve stejné transakci — bez `ROLE authenticated` lokální Postgres connection jako superuser RLS bypassuje. (3) Remote Supabase setup je user-bound (interactive `supabase link`), step-by-step v hand-backu.

#### T-007 — Calc logic v `packages/shared`

- **Owner**: fullstack
- **Status**: done (PR #2 merged)
- **Blocks**: T-010, T-011, T-012, T-016
- **Blocked by**: T-005
- **Brief**: Čistá kalkulační logika (žádný UI) v `packages/shared/src/calc/`. Compound interest (FV with periodic contributions), real estate cashflow + IRR + equity build-up, comparison (normalize na společný horizont). Zod schemas pro vstupy. Vitest pokrytí.
- **Inputs**: PROJECT.md scope (vzorce a vstupy), žádné UI rozhodnutí
- **Acceptance criteria**:
  - [x] `compound.ts` + `realEstate.ts` + `irr.ts` + `comparison.ts` per architecture.md (closed-form + iterative time series, mortgage annuita, Newton-Raphson + bisect, normalize 2 scenarios)
  - [x] Zod schémata (CompoundInput, RealEstateInputBase + Refined, ScenarioInput discriminated union)
  - [x] Vitest coverage: **97.68 % statements, 100 % functions, 87.77 % branches, 64 tests** (over 90 % gate)
  - [x] Golden master fixtures cross-checked s 0 % delta vs Node.js eval ground truth
- **Cost note**: Sonnet (~8.5 min, 60 tool calls)
- **Notes**: Toto je matematické jádro celé appky. Bez korektních vzorců je MVP neuvěřitelný. Architect v T-001 nech vybrat vzorce (FV with periodic contribution formula, IRR via Newton-Raphson or binary search, …) a explicitně dokumentovat v `docs/architecture.md` sekci „Calc primitives".
- **Hand-back**: **PR #2** https://github.com/filiptomanec/investio/pull/2. Fait accompli: Zod `discriminatedUnion` + `refine` nekompatibilní (refine vrací ZodEffects, ne ZodObject) → split na `RealEstateInputBaseSchema` (do discriminated union) + `RealEstateInputSchema` (standalone s refine). Typ `RealEstateInput` inferován z base — identické chování.

#### T-008 — Scenarios CRUD API

- **Owner**: fullstack
- **Status**: pending
- **Blocks**: T-013
- **Blocked by**: T-006, T-007
- **Brief**: Next.js Route Handlers pro Scenario CRUD. Zod input/output sdílené přes `packages/shared`. RLS-respecting queries přes Prisma + Supabase session.
- **Inputs**: `docs/api.md`, `packages/db`, `packages/shared` Zod schemas
- **Acceptance criteria**:
  - [ ] `GET /api/scenarios` — vrací moje scenarios
  - [ ] `POST /api/scenarios` — vytvoří
  - [ ] `PATCH /api/scenarios/:id` — update
  - [ ] `DELETE /api/scenarios/:id` — soft delete (archived flag)
  - [ ] `GET /api/templates` — vrací read-only templates
  - [ ] Integration testy (Vitest + supertest nebo Playwright API) — auth required, RLS enforced
- **Cost note**: Sonnet
- **Hand-back**: <vyplní fullstack>

#### T-009 — i18n setup (CZ + EN)

- **Owner**: fullstack
- **Status**: done (PR #4 merged)
- **Blocks**: T-010, T-011, T-012, T-013, T-016, T-020
- **Blocked by**: T-005
- **Brief**: Sdílené message bundles v `packages/i18n/locales/{cs,en}.json`. Web: `next-intl`. Mobile: `i18next` + `expo-localization`. Měna a číslo formátování per locale.
- **Inputs**: `docs/decisions/ADR-0003-i18n.md`
- **Acceptance criteria**:
  - [x] `packages/i18n/locales/{cs,en}.json` — 37 klíčů v namespacech (common, auth, dashboard, calc.compound, calc.realEstate, comparison, errors)
  - [x] Web: next-intl@4 + `proxy.ts` (Next.js 16 rename `middleware.ts → proxy.ts`) + `app/[locale]/layout.tsx` s `NextIntlClientProvider`
  - [x] Mobile: i18next@23 + react-i18next + expo-localization, init v `apps/mobile/lib/i18n.ts`, fallback `cs`
  - [x] `formatCurrency`, `formatPercent`, `formatDate`, `formatCompact` v `packages/shared/src/formatters/` + 15 testů green
  - [x] CI parity check (`packages/i18n/scripts/check-parity.ts`) + turbo task `check-parity`
- **Cost note**: Sonnet (~10.5 min, 133 tool calls — větší scope na dva apps + formatters + script)
- **Hand-back**: **PR #4** https://github.com/filiptomanec/investio/pull/4. Fait accompli: Next.js 16 přejmenoval `middleware.ts` → `proxy.ts` (deprecation warning); použit `proxy.ts`, funkčnost identická. `/cs` → 307 redirect na `/` (default locale `localePrefix: "as-needed"`), `/en` → 200 přímo. Curl ověřený.

### M2 — Web MVP

#### T-010 — Compound interest calculator (web)

- **Owner**: fullstack
- **Status**: pending
- **Blocks**: T-012
- **Blocked by**: T-003, T-007, T-009
- **Brief**: Web stránka `/calc/compound`. Form (Zod-validated, hookform), live graf (Recharts), výsledek (FV breakdown). Read-only mode pro template, edit mode pro save.
- **Inputs**: T-003 tokens, T-004 wireframe, T-007 calc, T-009 i18n
- **Acceptance criteria**:
  - [ ] Stránka `/calc/compound` interaktivní
  - [ ] Recharts: 2-line chart (vklady kumulativně vs zhodnocení)
  - [ ] Form errors z Zod (CZ + EN)
  - [ ] „Uložit jako scénář" → POST /api/scenarios
  - [ ] Component test (Vitest + Testing Library)
- **Cost note**: Sonnet
- **Hand-back**: <vyplní fullstack>

#### T-011 — Real estate + cashflow calculator (web)

- **Owner**: fullstack
- **Status**: pending
- **Blocks**: T-012
- **Blocked by**: T-003, T-007, T-009
- **Brief**: Web stránka `/calc/real-estate`. Form (kupní cena, vlastní kapitál, hypotéka, pronájem, náklady, daň, údržba, zhodnocení %). Cashflow tabulka + grafy (cashflow per měsíc, equity build-up, hodnota nemovitosti vs hypotéka).
- **Inputs**: T-007 calc.realEstate, T-003 tokens, T-004 wireframe
- **Acceptance criteria**:
  - [ ] Stránka interaktivní s live updatem
  - [ ] 2 grafy (cashflow over time + equity build-up)
  - [ ] Souhrn metrik: měsíční cashflow, roční yield, IRR, break-even month
  - [ ] Component test
- **Cost note**: Sonnet
- **Hand-back**: <vyplní fullstack>

#### T-012 — Comparison view (web)

- **Owner**: fullstack
- **Status**: pending
- **Blocks**: —
- **Blocked by**: T-010, T-011
- **Brief**: Stránka `/compare?a=<scenarioId>&b=<scenarioId>`. Vedle sebe vstupy obou scénářů, společný graf trajektorií, finální čísla diff, breakdown rozdílu.
- **Inputs**: T-007 calc.comparison
- **Acceptance criteria**:
  - [ ] Side-by-side layout (responsive — na mobilu under each other)
  - [ ] Společný graf 2 trajektorií (Recharts, dual line)
  - [ ] Tabulka rozdílu: konečná hodnota, kumulativní cashflow, ROI %
  - [ ] „Sdílet" link — kopíruje URL s query parametry
- **Cost note**: Sonnet
- **Hand-back**: <vyplní fullstack>

#### T-013 — Scenarios dashboard + auth (web)

- **Owner**: fullstack
- **Status**: pending
- **Blocks**: —
- **Blocked by**: T-008, T-009
- **Brief**: `/dashboard` — seznam mých scénářů + akce (otevřít, duplikovat, smazat, sdílet). `/login`, `/signup`. Supabase Auth UI.
- **Inputs**: T-008 CRUD API, T-003 tokens, T-009 i18n
- **Acceptance criteria**:
  - [ ] `/login` + `/signup` (email + Google OAuth pokud ADR-0002 schválil)
  - [ ] `/dashboard` chráněný middleware (redirect na /login pro anon)
  - [ ] Seznam scenarios s filtry (typ: compound / real estate / all)
  - [ ] Duplikovat → nová kopie s upraveným názvem
  - [ ] E2E happy path: signup → vytvoření scénáře → návrat na dashboard → otevření
- **Cost note**: Sonnet
- **Hand-back**: <vyplní fullstack>

### M3 — Mobile MVP

#### T-014 — Expo scaffold + sdílené packages

- **Owner**: mobile
- **Status**: pending
- **Blocks**: T-015, T-016, T-017, T-018
- **Blocked by**: T-005, T-007, T-009
- **Brief**: Expo SDK 53+ projekt v `apps/mobile`, sdílí `packages/shared`, `packages/i18n`. Navigace (Expo Router). Auth Supabase přes shared session strategy. EAS preview build pipeline.
- **Inputs**: ADR-0001 (mobile stack), T-005 monorepo struktura
- **Acceptance criteria**:
  - [ ] `apps/mobile` s `expo-router` navigací
  - [ ] Import z `packages/shared` funguje
  - [ ] Auth flow přes Supabase (login screen, persistent session)
  - [ ] `eas build --profile preview` projde lokálně
- **Cost note**: Sonnet
- **Hand-back**: <vyplní mobile>

#### T-015 — Mobile screens (3 kalkulačky)

- **Owner**: mobile
- **Status**: pending
- **Blocks**: T-018
- **Blocked by**: T-014
- **Brief**: 3 native obrazovky: compound, real estate, comparison. Sdílí kalkulační logiku s webem. Native chart (Victory Native nebo Skia).
- **Inputs**: T-007 calc, T-014 mobile setup, T-004 wireframe
- **Acceptance criteria**:
  - [ ] 3 screens interaktivní
  - [ ] Native chart komponenty (smooth, animované)
  - [ ] Číselné inputy s native keyboard
  - [ ] Parita s webem v základní funkčnosti
- **Cost note**: Sonnet
- **Hand-back**: <vyplní mobile>

#### T-016 — Mobile scenarios dashboard

- **Owner**: mobile
- **Status**: pending
- **Blocked by**: T-014, T-008
- **Brief**: Mobile screen `/dashboard` — seznam scénářů, swipe akce, pull-to-refresh.
- **Acceptance criteria**:
  - [ ] List rendering s native FlatList
  - [ ] Swipe-to-delete / swipe-to-duplicate
  - [ ] Pull-to-refresh přes Supabase query refetch
- **Cost note**: Sonnet
- **Hand-back**: <vyplní mobile>

### M4 — Templates + PDF export

#### T-017 — Predefined templates

- **Owner**: content
- **Status**: pending
- **Blocks**: —
- **Blocked by**: T-006
- **Brief**: 6 realistických templates: 3 stock (S&P 500 1995-2025, MSCI World, CZ dividendové), 3 real estate (CZ činovní dům, holiday rental, městský byt). Vstupy + komentář k volbě parametrů. Seed do DB jako read-only templates.
- **Inputs**: `docs/schema.sql` (template tabulka), `docs/data-model.md`
- **Acceptance criteria**:
  - [ ] `supabase/seeds/templates.sql` (nebo migration) s 6 templates
  - [ ] `docs/content/templates.md` — popis každého templatu + zdroj dat (citace)
  - [ ] CZ + EN názvy/popisy
- **Cost note**: Sonnet (potřebuje fact-checking přes Exa MCP)
- **Hand-back**: <vyplní content>

#### T-018 — PDF export

- **Owner**: fullstack
- **Status**: pending
- **Blocked by**: T-012
- **Brief**: Export scénáře nebo comparison view do PDF. `react-pdf` client-side (sdílené komponenty mezi web a mobile, nebo prozatím jen web).
- **Acceptance criteria**:
  - [ ] „Export PDF" tlačítko na scenario detail a comparison view
  - [ ] PDF obsahuje: vstupy, výsledky, graf (renderovaný jako SVG nebo image), datum exportu
  - [ ] Funguje min. ve web (mobile lze odložit)
- **Cost note**: Sonnet
- **Hand-back**: <vyplní fullstack>

### M5 — QA & polish

#### T-019 — E2E web (Playwright)

- **Owner**: qa
- **Status**: pending
- **Blocked by**: T-013
- **Brief**: Playwright suite pro happy paths: signup → create scenario → compare → export PDF. + form validation tests.
- **Acceptance criteria**:
  - [ ] ≥ 5 E2E testů
  - [ ] Běží v CI proti Vercel preview deploy
  - [ ] Hlavní happy path < 30 s
- **Cost note**: Sonnet
- **Hand-back**: <vyplní qa>

#### T-020 — Mobile E2E (Maestro)

- **Owner**: qa
- **Status**: pending
- **Blocked by**: T-015
- **Brief**: Maestro flows pro mobile: signup, vytvoření compound scénáře, návrat na dashboard.
- **Acceptance criteria**:
  - [ ] Maestro YAML flows v `apps/mobile/.maestro/`
  - [ ] Min. 3 happy path flows
  - [ ] Dokumentace jak spustit lokálně
- **Cost note**: Sonnet
- **Hand-back**: <vyplní qa>

#### T-021 — Security review

- **Owner**: security
- **Status**: pending
- **Blocked by**: T-013, T-015
- **Brief**: OWASP review, RLS policy audit, secrets scan, dep audit. Acceptance bar: žádné high/critical vulnerabilities, RLS pokrývá všechny tabulky, žádný secret v repu.
- **Acceptance criteria**:
  - [ ] `docs/security-review.md` — findings + fixes nebo accepted-risk
  - [ ] `pnpm audit` clean nebo dokumentovaný triage
  - [ ] RLS: anon role nemá žádný `SELECT` na user data
- **Cost note**: Opus
- **Hand-back**: <vyplní security>

### M6 — Deploy & launch prep

#### T-022 — Sentry + monitoring

- **Owner**: devops
- **Status**: pending
- **Blocked by**: T-013, T-015
- **Brief**: Sentry projekt pro web + mobile. Source maps. Release tagging.
- **Acceptance criteria**:
  - [ ] Sentry SDK na web (`@sentry/nextjs`)
  - [ ] Sentry SDK na mobile (`@sentry/react-native`)
  - [ ] Test error vyvolaný a viděn v Sentry dashboardu
- **Cost note**: Sonnet
- **Hand-back**: <vyplní devops>

#### T-023 — Landing page + SEO

- **Owner**: marketing
- **Status**: pending
- **Blocked by**: T-013
- **Brief**: `/` (landing) s hero, 3 feature sekcemi, CTA na signup. Meta tagy, JSON-LD, sitemap. CZ + EN.
- **Acceptance criteria**:
  - [ ] Landing live na production URL
  - [ ] Lighthouse SEO ≥ 95
  - [ ] OG image + Twitter card
- **Cost note**: Sonnet
- **Hand-back**: <vyplní marketing>

---

## Activity log

- `2026-05-17` — Backlog vytvořen po intake interview. 23 ticketů ve 6 milestones. T-001 (architect) je první. Next: orchestrator čeká na user approval, pak spawn architect přes Agent tool.
- `2026-05-17` — T-001 done (architect, Opus). Shipnuto: 3 ADR + architecture.md (s calc primitives detail), api.md (9 endpointů, Zod discriminated union), risks.md (5 rizik). Adr-index.md má 3 nové entries. Next: T-002 (architect, data model + schema.sql) odblokovaný; v paralelu lze spawn T-003 (designer, design tokens).
- `2026-05-17` — **M1 dokončena** (PR #2 + #3 + #4 merged). User mergnul PR #2, pak povolil orchestratorovi mergovat zbytek scoped na Investio repo. PR #3 + #4 měly konflikty v `pnpm-lock.yaml` + jeden v `packages/shared/package.json` (union test scripts + coverage dep) — vyřešeno postupně přes `merge origin/main → packages/shared/package.json manual + pnpm install regen lockfile → squash merge`. Tests post-merge: 79/79 shared (calc 64 + formatters 15), 6/6 RLS integration. Next: **M2 paralelizace** T-008 (CRUD API) + T-010 (compound web) + T-011 (real estate web) + T-014 (Expo scaffold).
- `2026-05-17` — **M1 trojka paralelně review** (worktree, ~11 min wall-clock pro all 3, ~$1.30 celkem). PR #2 T-007 calc logic (64 testů, coverage 97.68 % stmts). PR #3 T-006 Supabase+Prisma+RLS (6/6 RLS integration testy). PR #4 T-009 i18n (next-intl web + i18next mobile + formatters + parity check). 5 nových learnings zachyceno (Prisma db pull + auth schema, RLS local Postgres role bypass, Zod discriminatedUnion + refine, Next.js 16 proxy.ts rename, Supabase port collision). Next: user mergne 3 PR; pak M2 paralelizace T-008 (CRUD API) + T-010 (compound web) + T-011 (real estate web) + T-014 (Expo scaffold parita).
- `2026-05-17` — T-005 review (fullstack, Sonnet, ~14 min, ~$0.70). Monorepo scaffold + GitHub repo `filiptomanec/investio` (private) + PR #1. 7 packages typecheck green, web build green, dev server vrací 200. Drobné fait accompli: Expo SDK 54 (ne 53), Tailwind v4 (ne v3). Vercel setup vyžaduje user OAuth. Next: user mergne PR #1 + napojí Vercel; pak M1 paralelizace T-006 (Supabase+Prisma) + T-007 (calc logic) + T-009 (i18n) přes isolation:worktree.
- `2026-05-17` — T-002 + T-003 + T-004 done (paralelně). Architect: `docs/data-model.md` + `docs/schema.sql` (5 RLS policies s RATIONALE, single-table polymorphism, soft delete s partial unique index, seed 6 templates s `on conflict do nothing`, dropnut ScenarioVersion, přidán `based_on_template_id` aby seděl s api.md). Designer: `docs/design/{design-system,tokens.draft.ts,tailwind-preview.md,wireframes.md}` (Investio Teal #0f766e primary, type scale 1.2, system fonts, 10 ASCII wireframů web+mobile, AA contrast měřený). Next: M0 hotová, M1 odblokovaná — T-005 (fullstack monorepo scaffold) je první.
