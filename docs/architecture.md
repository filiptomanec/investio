# Investio — System Architecture

> High-level architecture pro Investio MVP. Slouží jako companion k ADR-0001/0002/0003 a vstup pro implementační tickety T-005+.

## TL;DR

- **Monorepo** Turborepo + pnpm workspaces.
- **Web**: Next.js 16 App Router na Vercel.
- **Mobile**: Expo SDK 53 (iOS + Android) přes EAS preview.
- **Backend**: Supabase managed (Postgres + Auth + Storage), data přístup přes Next.js Route Handlers (web) a Supabase JS client (mobile).
- **Sdílené packages**: `shared` (calc + Zod + types), `i18n` (messages), `auth` (Supabase clients), `db` (Prisma, web-only), `design-tokens`.
- **Charts**: Recharts (web) + Victory Native XL (mobile) — sdílené pouze datové vstupy, ne komponenty.

## Repo layout (high-level)

```
investio/
├── apps/
│   ├── web/                    Next.js 16 — pages, API routes, server-rendered
│   └── mobile/                 Expo + expo-router — native iOS/Android
│
├── packages/
│   ├── shared/                 Pure TS — calc, Zod schemas, formatters, types
│   ├── i18n/                   cs.json + en.json + key types
│   ├── auth/                   Supabase client factories (browser/server/native)
│   ├── db/                     Prisma client wrapper (web-only consumer)
│   ├── design-tokens/          JS exports — colors, spacing, typography
│   └── config/                 Shared tsconfig, eslint, prettier
│
├── supabase/                   migrations, seeds, config.toml
├── docs/                       this folder
├── .github/workflows/          CI: lint, typecheck, test, parity-i18n, deploy
├── turbo.json
└── pnpm-workspace.yaml
```

Detailní strom viz ADR-0001.

## Deploy topology

```
                ┌─────────────────────────────────────────────┐
                │  GitHub: filiptomanec/investio (private)    │
                └──────────────────┬──────────────────────────┘
                                   │ push origin <branch>
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
        ┌───────────────┐                  ┌─────────────────┐
        │ Vercel (web)  │                  │ EAS Build       │
        │ - main = prod │                  │ - preview / PR  │
        │ - PR previews │                  │ - free tier     │
        └───────┬───────┘                  │   build minutes │
                │                          └────────┬────────┘
                │ httpOnly cookies                  │ app bundle
                ▼                                   ▼
        ┌────────────────────────────────────────────────────┐
        │                  Supabase (managed)                │
        │  - Postgres (free tier: 500 MB, 2 GB egress)       │
        │  - Auth (unlimited MAU on free)                    │
        │  - Storage (1 GB free — only for PDF cache later)  │
        │  - RLS enforced on all user tables                 │
        └────────────────────────────────────────────────────┘
```

**Production URL**: TBD `investio.app` (user koupí doménu nebo Vercel přiřadí `<project>.vercel.app`).
**Preview**: každý PR → unique Vercel URL + EAS QR code v PR komentáři.

## Data flow

### Web (authenticated request)

```
Browser
  │ 1. fetch /api/scenarios (cookie sb-*-auth-token)
  ▼
Next.js Route Handler (apps/web/app/api/...)
  │ 2. createServerClient(cookies) z @investio/auth
  │ 3. const { data: { user } } = await supabase.auth.getUser()
  │ 4. Zod parse request body
  ▼
Prisma client (@investio/db)
  │ 5. SELECT * FROM scenario WHERE user_id = $1
  │    (Supabase Postgres + RLS — i kdyby Prisma neměla user_id WHERE,
  │     RLS by ji odřízla. Belt + suspenders.)
  ▼
Postgres (Supabase)
  │ 6. řádky vrácené po RLS check
  ▼
Route Handler
  │ 7. Zod serialize response, return JSON
  ▼
Browser
```

**Důležité**: Web používá **dvě cesty** do Supabase:
1. **Auth** přes `@supabase/ssr` cookie session (na úrovni Next.js middleware + Route Handler).
2. **Data** přes Prisma s **Supabase service role** ?  → **NE**. Prisma se přihlašuje jako stejný authenticated user (přes Postgres role + `set local auth.uid`).
   - Alternativa: použít `@supabase/supabase-js` server-side a vůbec ne Prisma. **Rozhodnutí**: Prisma pro typed query DX, ale **musíme nastavit Postgres connection s `pgbouncer` v session mode** + per-request `SET request.jwt.claims = ...` aby RLS fungovala. Tohle je řešitelné přes connection string + middleware na Prisma.
   - **TL;DR**: T-006 implementuje Prisma extension, který před každou query sets JWT claims z aktuální session. Pokud se ukáže příliš složité, fallback je `@supabase/supabase-js` server-side bez Prisma (typed přes generated types z Supabase CLI).

### Mobile (authenticated request)

```
React Native app
  │ 1. supabase.from('scenario').select('*')
  │    (session token z expo-secure-store)
  ▼
Supabase PostgREST (auto-generated REST API)
  │ 2. JWT verify, set auth.uid()
  │ 3. SELECT * FROM scenario  ← RLS applied
  ▼
Postgres
  │
  ▼
PostgREST → JSON → app
```

**Mobile NEpoužívá** Next.js Route Handlers. Jde přímo proti Supabase. Důvody:
- Méně network hops, lepší offline-ready cache (přes `@tanstack/react-query` + Supabase realtime).
- Žádný duplikovaný API layer.

**Trade-off**: některá business logika (např. server-side validace komplikovaných Scenario state transitions) by musela být v DB triggerech / RLS policies, ne v Route Handler. Pro MVP tohle je OK — všechny mutace jsou simple CRUD, validace běží přes Zod **na klientu** (i mobile čte schémata z `@investio/shared`) + RLS v DB.

## Auth flow

Detail viz ADR-0002. Shrnutí:

- **Web**: `@supabase/ssr` + httpOnly cookies.
- **Mobile**: `@supabase/supabase-js` + `expo-secure-store` adapter.
- **Shared types** z `@investio/auth`: `Session`, `User`, `AuthError`.
- **RLS** přes `auth.uid() = user_id` na všech uživatelských tabulkách.

## Calc primitives

> Kritická sekce — fullstack v T-007 podle ní implementuje `packages/shared/src/calc/`. Žádné rozhodnutí o vzorcích zde není volné na pozdější diskusi.

### 1. Compound interest — FV with periodic contributions

**Vstupy**:
- `initialAmount: number` (CZK), `≥ 0`
- `monthlyContribution: number` (CZK), `≥ 0`
- `annualReturnPct: number` (např. `0.07` = 7 % p.a.), může být **negativní** (medvědí scénář)
- `horizonYears: number`, **integer ≥ 1, ≤ 50**
- `contributionTiming: "begin" | "end"` (default `"end"` — vklad na konci měsíce; výnos se počítá až další měsíc)

**Vzorec** (uzavřená forma, žádná iterace):

```
FV = P * (1 + r)^n + C * [((1 + r)^n - 1) / r] * (1 + r * t)
```

kde:
- `P` = initialAmount
- `r` = monthlyRate = `(1 + annualReturnPct)^(1/12) - 1` (efektivní měsíční sazba z nominální roční; **pozn.**: alternativa je `annualReturnPct / 12` — používáme **efektivní geometrický** přepočet, protože je matematicky správnější pro "annual return"; dokumentovat v UI tooltipu)
- `n` = totalMonths = `horizonYears * 12`
- `C` = monthlyContribution
- `t` = 1 pokud `contributionTiming === "begin"` else 0

**Edge cases**:
- `r === 0` → degenerate vzorec na `FV = P + C * n` (test musí pokrýt).
- `annualReturnPct < 0` → vzorec funguje, ale `r` je negativní → výsledek může být `< P + (C * n)`. OK, dokumentovat v UI.
- `horizonYears === 0` → vrátit `P` (žádné vklady, žádný výnos).

**Výstup**:
```ts
type CompoundResult = {
  finalValue: number;              // FV
  totalContributions: number;      // P + C * n
  totalGains: number;              // FV - totalContributions
  timeSeries: Array<{              // měsíční snapshot pro graf
    month: number;                 // 0..n
    contributions: number;         // kumulativně vloženo
    value: number;                 // FV ke konci měsíce
  }>;
};
```

Time series generován **iterativně** (pro graf), žádný FV uzavřená forma per měsíc — efektivnější jediný loop:

```
balance = P
for month = 1..n:
  balance = balance * (1 + r) + C (if "end") or
  balance = balance + C; balance = balance * (1 + r) (if "begin")
  push { month, contributions: P + C*month, value: balance }
```

**Acceptance**: FV z loopu == FV z uzavřené formy (tolerance `1e-6` relative). Vitest unit test.

### 2. Real estate — cashflow + IRR + equity build-up

**Vstupy**:
- `purchasePrice: number` (CZK)
- `downPayment: number` (CZK), `0 ≤ downPayment ≤ purchasePrice`
- `mortgage`: `{ annualRatePct: number; termYears: number }` — termYears typically 20–30
- `monthlyRent: number`
- `monthlyExpenses: number` (správa, fond oprav, pojištění)
- `vacancyRatePct: number` (default 0.05 = 5 % průměrná prázdnota)
- `maintenancePctOfRent: number` (default 0.05)
- `annualAppreciationPct: number` (default 0.03)
- `annualRentGrowthPct: number` (default 0.02)
- `incomeTaxPct: number` (0 = abstrahuje daň; default 0.15 = CZ fyzická osoba 15 %, volitelně 0.23 pro vyšší pásmo)
- `horizonYears: number`, integer 1–30
- `exitMonth?: number` — volitelný "prodej" v určitém měsíci (default: konec horizontu)

**Vypočítané hodnoty**:

a) **Hypoteční splátka** (annuita, fixed rate):
```
loanAmount = purchasePrice - downPayment
i = mortgage.annualRatePct / 12       // bankovní konvence pro hypotéky v CZ
N = mortgage.termYears * 12
monthlyPayment = loanAmount * (i * (1+i)^N) / ((1+i)^N - 1)
```
**Pozor**: pokud `horizonYears > termYears`, mortgage je splacená v měsíci `termYears * 12`, dál `monthlyPayment = 0` a `interestPayment = 0`.

**Edge case**: `i === 0` (nominal 0% rate, hypoteticky) → `monthlyPayment = loanAmount / N`. Test pokryje.

**Edge case**: `loanAmount === 0` (cash buy, no mortgage) → `monthlyPayment = 0`, vše ostatní funguje.

b) **Měsíční cashflow** (pro každý měsíc):
```
effectiveRent = currentMonthlyRent * (1 - vacancyRatePct)
maintenance = effectiveRent * maintenancePctOfRent
grossIncome = effectiveRent - monthlyExpenses - maintenance
interestPayment = remainingBalance * i
principalPayment = monthlyPayment - interestPayment
taxableIncome = max(0, grossIncome - interestPayment)
                // interest je odpočitatelný v CZ; depreciation NEzahrnujeme v MVP
tax = taxableIncome * incomeTaxPct
netCashflow = grossIncome - monthlyPayment - tax
remainingBalance = remainingBalance - principalPayment
```

c) **Hodnota nemovitosti** (geometrický růst):
```
propertyValue(month) = purchasePrice * (1 + monthlyAppreciation)^month
  where monthlyAppreciation = (1 + annualAppreciationPct)^(1/12) - 1
```

d) **Equity build-up**:
```
equity(month) = propertyValue(month) - remainingBalance(month)
```

e) **IRR** — annualized internal rate of return.

Cashflow sequence pro IRR:
```
CF[0] = -downPayment - closingCosts  (closingCosts = 0 v MVP, parametr lze přidat později)
CF[1..n-1] = netCashflow(month)
CF[n] = netCashflow(n) + propertyValue(n) - remainingBalance(n)  // exit: prodej, splatí hypotéku
```

**Algoritmus**: **Newton-Raphson** s fallbackem na **bisekci**.

```
function irr(cashflows, guess = 0.1, maxIter = 100, tol = 1e-7):
  // Newton-Raphson
  rate = guess
  for i in 0..maxIter:
    npv = sum(cf[t] / (1 + rate)^t for t in 0..n)
    dnpv = sum(-t * cf[t] / (1 + rate)^(t+1) for t in 0..n)
    if abs(dnpv) < tol: break  // derivative too small, switch to bisect
    newRate = rate - npv / dnpv
    if abs(newRate - rate) < tol: return newRate
    rate = newRate
  // fallback: bisekce mezi -0.99 a 10.0
  return bisect(cashflows, -0.99, 10.0, tol)
```

**Edge cases**:
- **Žádný kladný cashflow** → IRR neexistuje / je hluboko negativní. Vrátit `null` v Result a UI ukáže "IRR nelze spočítat".
- **Více znaménkových změn** (cashflow + investice + cashflow + reinvestice + ...) → IRR může mít víc řešení, Newton-Raphson najde lokální. Pro MVP toto je akceptabilní — naše cashflow sekvence je vždycky `[-init, +/-, +/-, ..., +exit]`, max 1–2 znaménkové změny.
- **Convergence failure** → fallback bisekce; pokud i ta selže (`npv` má stejné znaménko na obou koncích intervalu), `return null`.

**Yield** (alternativní, jednodušší metric):
```
grossYield = (12 * monthlyRent) / purchasePrice
netYield = (12 * (effectiveRent - monthlyExpenses - maintenance)) / purchasePrice
```

f) **CZ daň konkrétně** (MVP scope):
- Daň z příjmu z pronájmu: aplikujeme `incomeTaxPct` na `taxableIncome` per měsíc.
- Default 0.15 (FO základní pásmo), uživatel může přepnout na 0.23 (vyšší pásmo nad cca 1.5M CZK/rok).
- **NEZAHRNUJEME v MVP**: solidární zvýšení, daň z nabytí (zrušená 2020), DPH (FO běžně neplatí), odpočet daňových paušálů (30 % pro pronájem).
- **NEZAHRNUJEME**: prokázané daňové odpočty (úroky z hypotéky na vlastní bydlení — ale my modelujeme INVESTIČNÍ nemovitost, kde úroky jsou náklad proti příjmu z pronájmu, což už modelujeme).
- Komentář v UI: "Zjednodušený daňový model. Konkrétní daňové dopady konzultujte s daňovým poradcem."

**Výstup**:
```ts
type RealEstateResult = {
  monthlyPayment: number;
  initialEquity: number;          // downPayment
  finalEquity: number;            // propertyValue(n) - remainingBalance(n)
  totalCashflow: number;          // sum(netCashflow)
  averageMonthlyCashflow: number;
  grossYield: number;
  netYield: number;
  irr: number | null;             // annualized
  breakEvenMonth: number | null;  // první měsíc kde cumulative cashflow > 0
  timeSeries: Array<{
    month: number;
    rent: number;
    effectiveRent: number;
    expenses: number;
    interest: number;
    principal: number;
    tax: number;
    netCashflow: number;
    cumulativeCashflow: number;
    propertyValue: number;
    remainingBalance: number;
    equity: number;
  }>;
};
```

### 3. Comparison — normalize 2 scenarios

**Vstupy**: 2× `Scenario` (compound nebo realEstate), s vlastními kalk. výstupy.

**Normalizace**:
1. **Common horizon**: `min(scenarioA.horizonYears, scenarioB.horizonYears)`. Pokud diff, truncate longer one.
2. **Common initial capital**: užít user-input `normalizedInitialCapital` (default = max z obou initial inputs).
3. **Common currency**: user volí display currency, žádný FX převod v MVP (assumes both already in chosen currency).

**Výstup**:
```ts
type ComparisonResult = {
  horizonYears: number;
  normalizedInitialCapital: number;
  a: { finalValue: number; totalROI: number; timeSeries: TimeSeriesPoint[] };
  b: { finalValue: number; totalROI: number; timeSeries: TimeSeriesPoint[] };
  difference: {
    finalValueDelta: number;        // a.finalValue - b.finalValue
    finalValueDeltaPct: number;
    winnerKey: "a" | "b" | "tie";
  };
};

type TimeSeriesPoint = { month: number; value: number };
```

**ROI** definovaný jednoduše: `(finalValue / initialCapital) - 1`. Pro real estate `finalValue = finalEquity + cumulativeCashflow` (total accumulated wealth).

### Numerická přesnost

- Všechny calc v JS `number` (float64). Pro finanční app **přiměřená** přesnost — chyby řádu `1e-9 CZK` jsou irelevantní.
- **NEPOUŽÍVÁME `decimal.js` / `bignumber.js`** v MVP. Trade-off: čísla mohou skončit s `12345.66999999` místo `12345.67`. Mitigace: `formatCurrency` zaokrouhluje na 2 desetinná místa pro display.
- **Při summacích cashflow** (např. `totalCashflow = sum(timeSeries.map(t => t.netCashflow))`) může dojít k akumulaci floating-point chyby. Pro horizon 30 let × 12 = 360 sčítání zůstaneme dobře pod `1e-6` chybou.
- Pokud se v budoucnu objeví bug s rounding (zpráva od uživatele), refaktor na `decimal.js` je lokalizovaný v `packages/shared/src/calc/`.

### Test strategie pro calc

- **Unit testy** (Vitest) per funkce: happy path + 5–10 edge cases každá.
- **Golden master fixtures**: pro každou kalkulačku tabulka `inputs → expected output` (z. excel calc, ověřená manuálně). Soubor `packages/shared/src/calc/__fixtures__/*.json`.
- **Property-based testy** (volitelné, `fast-check`): např. "FV monotonically increases with horizon when r > 0".
- **Coverage gate**: ≥ 90 % řádků pro `calc/` directory.

## Performance considerations

- **Time series pro 30letý horizont** = 360 datapoints. Recharts i Victory Native zvládají tisíce bez problému.
- **Live recalc na každý keystroke** v form: debounce 150ms + memoize per input hash. Vitest má `useDeferredValue` pro web. Pro mobile `useState` + debounce stačí.
- **Žádné kalkulace na serveru**. Calc běží 100 % na klientu (web client komponent nebo native). Server jen ukládá vstupy + metadata, ne výsledky (výsledky jsou deterministicky odvozené ze vstupů).

## Observability

- **MVP**: žádný Sentry během M0–M4 (per user preference — `userSentryPreference`). Wired-in v T-022 (M6) před launch.
- **Logging na webu**: `console.log/error` v dev, **pino** v prod Route Handlers (JSON logs zachycuje Vercel runtime logs).
- **Frontend errors**: dokud Sentry nepřijde, `window.onerror` + `unhandledrejection` → POST `/api/log/error` (Route Handler s rate limit).

## Otevřené body předané dál

- **Doménový name**: TBD před M6. Vercel `<project>.vercel.app` stačí pro MVP.
- **PDF export**: client-side `@react-pdf/renderer` (web only v MVP). Mobile export odložen do M5+.
- **Externí data (Yahoo Finance, CNB)**: NE v MVP. Veškeré vstupy manuální.
- **Realtime sync** (web ↔ mobile při editaci stejného scénáře): odloženo. Optimistic update na klientu + refetch on focus stačí.

## Reference

- ADR-0001 (stack)
- ADR-0002 (auth)
- ADR-0003 (i18n)
- `docs/api.md` — endpoint contracts
- `docs/risks.md` — known risks
- PROJECT.md, BACKLOG.md
