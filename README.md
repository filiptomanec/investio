# Investio

Kalkulačka složeného úročení — webová aplikace (responzivní), CZ + EN.

Mobilní RN aplikace přijde v další fázi se stejným designem.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **Web** (`apps/web`): Vite + TanStack Start (SSR via Nitro) + React 19 + Tailwind v4 + shadcn/ui + Recharts
- **Shared logic** (`packages/shared`): Pure-TS compound interest math + locale-aware formatters
- **i18n** (`packages/i18n`): react-i18next + CZ/EN message catalogs
- **Monitoring**: Sentry (`@sentry/react`, opt-in via `VITE_SENTRY_DSN`)
- **Hosting**: Vercel (TanStack Start + Nitro Vercel preset)

## Local setup

```bash
# Requires Node 20+ and pnpm 9+
pnpm install
cp .env.example .env.local      # fill VITE_SENTRY_DSN if you want client errors reported
pnpm dev                         # runs apps/web on http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server for web app |
| `pnpm build` | Build all workspaces (production) |
| `pnpm typecheck` | Type-check all workspaces |
| `pnpm lint` | ESLint across all workspaces |
| `pnpm format` | Prettier write across the repo |

## Monorepo layout

```
investio/
├── apps/
│   └── web/                Vite + TanStack Start app
├── packages/
│   ├── shared/             Compound interest math + formatters
│   └── i18n/               i18next config + CS / EN messages
├── package.json            workspace root
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```
