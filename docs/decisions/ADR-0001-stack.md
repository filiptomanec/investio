# ADR-0001 — Stack & Monorepo Structure

- **Status**: accepted
- **Date**: 2026-05-17
- **Tags**: stack, infra
- **Deciders**: architect

## Kontext

Investio je multi-platform (web + native mobile) hobby projekt. Klíčový design constraint: kalkulační logika a Zod schémata MUSÍ být sdílené mezi web a mobile — bez sdílení riskujeme divergenci výsledků, což ničí důvěru v "kalkulačku". Současně chceme free-tier provoz (Vercel hobby, Supabase free, EAS free) a minimální maintenance overhead.

Existující předběžný stack v PROJECT.md je solidní — odchýlení by muselo přinést dost hodnoty, aby ospravedlnilo deviation cost. Boring tech wins.

## Rozhodnutí

**Monorepo**: pnpm workspaces + Turborepo. **Web**: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts. **Mobile**: Expo SDK 53 + React Native + Expo Router + Victory Native XL. **Backend**: Next.js Route Handlers + Supabase (Postgres + Auth + Storage) + Prisma. **PDF**: `@react-pdf/renderer` (web only v MVP, mobile odložen).

### Monorepo layout

```
investio/
├── apps/
│   ├── web/                       # Next.js 16 App Router
│   │   ├── app/
│   │   │   ├── [locale]/          # next-intl routed locale
│   │   │   ├── api/               # Route Handlers
│   │   │   └── layout.tsx
│   │   ├── components/            # web-only komponenty (shadcn/ui)
│   │   ├── lib/                   # web-only utils (supabase server client, etc.)
│   │   ├── middleware.ts          # locale + auth
│   │   └── next.config.ts         # transpilePackages: ["@investio/*"]
│   │
│   └── mobile/                    # Expo SDK 53
│       ├── app/                   # expo-router file-based
│       │   ├── (auth)/
│       │   ├── (tabs)/
│       │   └── _layout.tsx
│       ├── components/            # native-only komponenty
│       ├── lib/                   # mobile-only (supabase client, secure storage)
│       ├── app.config.ts
│       └── eas.json
│
├── packages/
│   ├── shared/                    # PURE TS, žádné React, žádné Node-specific API
│   │   ├── src/
│   │   │   ├── calc/              # compound, realEstate, comparison, irr
│   │   │   ├── schemas/           # Zod input/output schemata
│   │   │   ├── formatters/        # formatCurrency, formatPercent, formatDate
│   │   │   └── types/             # cross-platform domain types
│   │   ├── tsconfig.json          # target ES2022, no DOM, no Node
│   │   └── package.json
│   │
│   ├── i18n/                      # message bundles (žádný runtime kód)
│   │   ├── locales/
│   │   │   ├── cs.json
│   │   │   └── en.json
│   │   ├── src/
│   │   │   └── keys.ts            # typed key path helpers (generated)
│   │   └── package.json
│   │
│   ├── db/                        # Prisma client wrapper
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   ├── client.ts          # PrismaClient export
│   │   │   └── types.ts           # re-export generated types
│   │   └── package.json           # ONLY web app imports (Node-only)
│   │
│   ├── auth/                      # shared supabase auth helpers
│   │   ├── src/
│   │   │   ├── client.ts          # createBrowserClient (web)
│   │   │   ├── native.ts          # createNativeClient (mobile, secure storage)
│   │   │   ├── server.ts          # createServerClient (web SSR)
│   │   │   └── types.ts           # Session, User typing
│   │   └── package.json
│   │
│   ├── design-tokens/             # JS export, žádné CSS soubory
│   │   ├── src/
│   │   │   ├── colors.ts
│   │   │   ├── spacing.ts
│   │   │   ├── typography.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/                    # sdílené tsconfig, eslint, prettier
│       ├── tsconfig.base.json
│       ├── eslint.config.mjs
│       └── package.json
│
├── supabase/
│   ├── migrations/
│   ├── seeds/
│   └── config.toml
│
├── docs/
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

### Co JE sdílené vs co NENÍ

| Asset | Sdílené? | Kde žije | Konzumuje |
|---|---|---|---|
| Kalkulační logika (compound, IRR, real estate) | ANO | `packages/shared/src/calc` | web + mobile |
| Zod schémata (Scenario inputs/outputs) | ANO | `packages/shared/src/schemas` | web (API + form) + mobile |
| Domain typy | ANO | `packages/shared/src/types` | všechno |
| Formátery (currency, %, date) | ANO | `packages/shared/src/formatters` | web + mobile |
| i18n message JSON | ANO | `packages/i18n/locales` | web (`next-intl`) + mobile (`i18next`) |
| Design tokens | ANO | `packages/design-tokens` | web (Tailwind config import) + mobile (theme provider) |
| Auth client helpery | ANO (lehce) | `packages/auth` | web + mobile |
| Prisma client | NE (web/server only) | `packages/db` | jen `apps/web` server side |
| UI komponenty | NE | `apps/web/components`, `apps/mobile/components` | každá platforma vlastní |
| Charty | NE (odlišný render target) | každá apka vlastní | Recharts vs Victory Native XL |
| Routing | NE | per-app | Next.js vs expo-router |

### Grafing — dva separátní

**Rozhodnutí**: Recharts pro web, Victory Native XL pro mobile. **Nepoužíváme unified Skia.**

- React Native Skia + `victory-native` v6 by teoreticky umožnily sdílet chart komponenty, ale:
  - Server-side rendering na webu je peklo (Skia je canvas-based, React Server Components nepřátelské)
  - PDF export přes `@react-pdf` chce SVG, ne canvas
  - Recharts má vyšší ecosystem maturity, lepší a11y, levnější development
- Trade-off: chart komponenty musí být napsány 2×, ale **datové vstupy do grafů jsou sdílené** (calc result je jeden tvar, jen renderer se liší). Tím nedochází k divergenci hodnot.
- Konvence: graf komponenta dostává typed `TimeSeriesPoint[]` z `packages/shared`, sama řeší render. Žádný chart-specific calc na web/mobile straně.

### Build orchestration — Turborepo + pnpm workspaces

- **Turborepo** kvůli remote caching (volitelně přes Vercel Remote Cache, na hobby zdarma do limitu) a paralelnímu `turbo run build/typecheck/test`.
- **pnpm workspaces** kvůli efektivnímu node_modules (mobile + web mají hodně sdílených deps).
- `turbo.json` pipeline: `build`, `dev`, `lint`, `typecheck`, `test`. Dependsion `^build` u packages.
- **Ne Nx** — Nx je powerful, ale boilerplate-heavy pro hobby projekt. Turborepo má 80 % funkcionality za 20 % konfigurace.

### Workspace internal package konvence

- Internal packages = `@investio/*` (workspace alias).
- Export přes `"exports"` field s `"types"` + `"default"`, žádné `main`/`module` legacy.
- `packages/shared` exportuje TS source (ne built), Next.js + Metro to transpilují přes `transpilePackages` / Metro resolver. Důvod: rychlejší dev loop, žádný `tsup` build step.
- `packages/db` exportuje **built JS + types** (Prisma client je už generovaný, není důvod re-transpilovat).

## Důsledky

- **Plus**:
  - Sdílená kalk. logika = jednoznačně stejné výsledky web/mobile.
  - Free-tier kompatibilní (Turborepo zdarma do limitu, Vercel hobby, Supabase free, EAS free).
  - Boring tech — všechny komponenty mainstream, dokumentace + community velká.
  - Designer + fullstack můžou začít T-003, T-005 paralelně bez dalších ADR rozhodnutí.

- **Mínus**:
  - 2× chart implementace (Recharts + Victory Native) — nevyhnutelné, dokud se unified canvas-on-web nepřestane bránit RSC.
  - pnpm + Expo + Next.js + Metro = 4 build systémy, debug edge cases (např. Metro resolver pro workspace packages je gotcha — viz `learnings.md` přidám záznam až narazíme).
  - Prisma + Supabase: Prisma generuje typy, Supabase RLS běží v DB. Musíme držet schema.prisma jako source of truth a generovat SQL z toho, NEBO mít schema.sql jako source of truth a Prisma `db pull`. Rozhodnutí v T-002: **schema.sql je source of truth, Prisma `db pull`** — RLS policies nejsou v Prisma schema vyjádřitelné, takže SQL stejně potřebujeme.

- **Neutral**:
  - Mobile-side `packages/db` se nepoužívá — mobile mluví přímo se Supabase REST/PostgREST přes `@supabase/supabase-js`. Web mluví přes Route Handlers + Prisma. Tím dostáváme dvě cesty k datům, ale obě respektují stejnou RLS na DB úrovni.

## Alternativy zvažované

- **Nx místo Turborepo**: silnější dependency graph + generators, ale boilerplate + learning curve příliš velký na hobby projekt. Turborepo stačí.
- **Unified Skia chart (`@shopify/react-native-skia` + `victory-native@v6`)**: cool, ale fragile na webu (RSC kompatibilita, PDF export → SVG je potřeba). Skip pro MVP, možná re-evaluate v M5+.
- **Tamagui místo Tailwind/shadcn + React Native StyleSheet**: unified styling cross-platform, ale velký kus learning a Tamagui je v aktivním refaktoru (v2). Risk pro hobby. Skip.
- **Bare React Native místo Expo**: víc kontroly, ale free EAS preview build je killer feature pro distribuci preview iOS appky bez Apple Dev účtu. Expo wins.
- **tRPC místo Route Handlers**: typed end-to-end RPC zní lákavě, ale (a) mobile by potřeboval `@trpc/react-query` client navíc, (b) Route Handlers jsou trivial + Zod schémata už sdílíme. Skip.
- **Drizzle místo Prisma**: lighter, ale Prisma má lepší DX a u tohoto scope (4 tabulky) performance rozdíl irelevantní.

## Reference

- PROJECT.md scope
- `memory/learnings.md` — Vercel CLI + paralelní agenti gotchas
- Turborepo docs: https://turbo.build/repo/docs
- Expo SDK 53 release notes (Q1 2026)
