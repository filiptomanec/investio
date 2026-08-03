# Investio

Investio is a modern financial calculator for exploring long-term investments, retirement income, and mortgage repayment strategies.

**Live demo:** [investio.filiptomanec.cz](https://investio.filiptomanec.cz)

![Investio investment calculator](docs/images/investio-screen.png)

## Features

- Compound-interest projections with monthly contributions
- Inflation-adjusted results in today's purchasing power
- Optional contribution increases based on inflation
- Retirement-income calculator with a configurable withdrawal rate
- Mortgage repayment calculator with annual principal and interest breakdowns
- Comparison of extra mortgage repayments versus investing
- Interactive charts and yearly projections
- Czech and English localization
- Responsive light and dark themes
- Web and iOS applications powered by the same React codebase

## Technology

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Tailwind CSS and shadcn/ui
- Recharts
- i18next
- Vitest
- Capacitor for iOS
- pnpm workspaces and Turborepo
- Vercel

## Architecture

Investio is organized as a monorepo:

- `apps/web` contains the responsive SSR web application and the Capacitor iOS wrapper.
- `packages/shared` contains framework-independent financial calculations, input formatting, and locale-aware formatters.
- `packages/i18n` contains the Czech and English translation catalogs.

The financial logic is kept separate from the user interface so it can be tested and reused across platforms. Unit tests cover the core investment and retirement calculations as well as inflation-data handling.

## Getting started

### Requirements

- Node.js 20 or newer
- pnpm 9 or newer

### Installation

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The development server is available at [http://localhost:3000](http://localhost:3000).

Sentry is optional. Leave `VITE_SENTRY_DSN` empty to disable error reporting locally.

## Available commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm test` | Run unit tests |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Create the production web build |
| `pnpm --filter @investio/web build:spa` | Create the static build used by Capacitor |

## Project structure

```text
investio/
├── apps/
│   └── web/             Web application and Capacitor iOS project
├── packages/
│   ├── shared/          Financial calculations and formatters
│   └── i18n/            Czech and English translations
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Disclaimer

Investio is intended for educational and informational purposes only. Its calculations are estimates and do not constitute financial or investment advice. Actual investment returns, inflation, interest rates, fees, and taxes may differ from the assumptions used in the application.
