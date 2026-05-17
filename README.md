# Investio

Investiční kalkulačka pro porovnání nemovitostí a akciových investic. Web + native mobile, CZ + EN.

## Co je Investio

Tři kalkulačky v jedné aplikaci:
- **Složené úročení** — konečná hodnota investice při pravidelných vkladech
- **Nemovitost + cashflow** — IRR, yield, equity build-up hypoteční investice
- **Porovnání** — side-by-side srovnání akciové vs nemovitostní investice

Více viz [PROJECT.md](./PROJECT.md) a [BACKLOG.md](./BACKLOG.md).

## Tech stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Web**: Next.js 16 App Router + Tailwind + shadcn/ui
- **Mobile**: Expo SDK 53 + React Native + Expo Router
- **Backend**: Supabase (Postgres + Auth) + Prisma
- **Shared**: `@investio/shared` (calc + Zod), `@investio/i18n`, `@investio/auth`, `@investio/design-tokens`

Architektura: [docs/decisions/ADR-0001-stack.md](./docs/decisions/ADR-0001-stack.md)

## Lokální setup

### Prerekvizity

- Node.js >= 20
- pnpm >= 9

### Instalace

```bash
# 1. Naklonuj repo
git clone https://github.com/filiptomanec/investio.git
cd investio

# 2. Nainstaluj závislosti
pnpm install

# 3. Nastav environment variables
cp .env.example .env.local
# Edituj .env.local — doplň Supabase URL + klíče z https://app.supabase.com

# 4. Spusť dev server (web)
pnpm dev
```

Web app bude dostupná na `http://localhost:3000`.

### Spuštění jen webu

```bash
pnpm --filter @investio/web dev
```

### Spuštění jen mobile

```bash
pnpm --filter @investio/mobile start
```

### Build

```bash
pnpm build
```

### Typecheck + lint

```bash
pnpm typecheck
pnpm lint
```

## Monorepo struktura

```
investio/
├── apps/
│   ├── web/        Next.js 16 — webová app
│   └── mobile/     Expo SDK 53 — iOS + Android
├── packages/
│   ├── shared/     Calc logika + Zod schémata (pure TS)
│   ├── i18n/       CZ + EN message bundles
│   ├── auth/       Supabase auth helpery
│   ├── db/         Prisma client wrapper (web-only)
│   ├── design-tokens/ Design tokeny (barvy, typografie, spacing)
│   └── config/     Sdílený tsconfig + eslint
├── docs/           Architektura, ADR, design
└── supabase/       DB migrace + seeds
```
