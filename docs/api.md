# Investio — API Surface

> Plánované Next.js Route Handler endpointy. Mobile **nepoužívá** tyto endpointy — jde přímo proti Supabase PostgREST. Tento dokument je tedy specifikací **web API**, ale **request/response schémata jsou shared přes `packages/shared`** a mohou být reusable, pokud později přidáme mobile-shared API layer.

## Konvence

- Všechny endpointy pod `/api/*`.
- Auth: ze Supabase session cookie (`@supabase/ssr` server client). Pokud `getUser()` vrací `null` a endpoint vyžaduje auth → `401 Unauthorized`.
- Content-Type: `application/json` request + response.
- Validace: Zod schémata z `@investio/shared/schemas` — **stejné** schéma pro client form i server Route Handler.
- Errors: konzistentní shape `{ error: { code: string; message: string; details?: unknown } }`.
- Rate limiting: defer post-MVP (Vercel hobby tier nemá native rate limit; pokud potřeba, použijeme `@upstash/ratelimit` později).

## Error codes

| Code | HTTP | Význam |
|---|---|---|
| `UNAUTHORIZED` | 401 | Chybí nebo invalid session |
| `FORBIDDEN` | 403 | Auth OK, ale akce zakázaná (RLS by to v normální cestě nepustila; zde jen jako safety) |
| `VALIDATION_ERROR` | 400 | Zod parse fail |
| `NOT_FOUND` | 404 | Resource neexistuje nebo není uživatelův |
| `CONFLICT` | 409 | Např. duplikát názvu scénáře u uživatele (pokud uniqueness constraint) |
| `INTERNAL_ERROR` | 500 | Catch-all |

## Endpointy

### 1. `GET /api/scenarios`

**Auth**: required.
**Účel**: vrátit uživatelovy scénáře pro dashboard.

**Query params** (Zod):

```ts
import { z } from "zod";

export const ListScenariosQuerySchema = z.object({
  type: z.enum(["compound", "real_estate", "all"]).default("all"),
  archived: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),  // pagination, default first page
});
```

**Response 200**:

```ts
export const ListScenariosResponseSchema = z.object({
  scenarios: z.array(ScenarioSummarySchema),  // see below
  nextCursor: z.string().uuid().nullable(),
});

export const ScenarioSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(["compound", "real_estate"]),
  currency: z.enum(["CZK", "EUR", "USD"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  archivedAt: z.string().datetime().nullable(),
});
```

### 2. `POST /api/scenarios`

**Auth**: required.
**Účel**: vytvořit nový scénář.

**Request body** (Zod, discriminated union):

```ts
export const CompoundInputsSchema = z.object({
  type: z.literal("compound"),
  initialAmount: z.number().nonnegative(),
  monthlyContribution: z.number().nonnegative(),
  annualReturnPct: z.number().min(-1).max(1),    // -100 % to +100 %
  horizonYears: z.number().int().min(1).max(50),
  contributionTiming: z.enum(["begin", "end"]).default("end"),
});

export const RealEstateInputsSchema = z.object({
  type: z.literal("real_estate"),
  purchasePrice: z.number().positive(),
  downPayment: z.number().nonnegative(),
  mortgage: z.object({
    annualRatePct: z.number().min(0).max(0.5),
    termYears: z.number().int().min(1).max(40),
  }),
  monthlyRent: z.number().nonnegative(),
  monthlyExpenses: z.number().nonnegative(),
  vacancyRatePct: z.number().min(0).max(1).default(0.05),
  maintenancePctOfRent: z.number().min(0).max(1).default(0.05),
  annualAppreciationPct: z.number().min(-0.2).max(0.5).default(0.03),
  annualRentGrowthPct: z.number().min(-0.2).max(0.2).default(0.02),
  incomeTaxPct: z.number().min(0).max(0.5).default(0.15),
  horizonYears: z.number().int().min(1).max(30),
  exitMonth: z.number().int().positive().optional(),
}).refine((d) => d.downPayment <= d.purchasePrice, {
  message: "Down payment can't exceed purchase price",
  path: ["downPayment"],
});

export const ScenarioInputsSchema = z.discriminatedUnion("type", [
  CompoundInputsSchema,
  RealEstateInputsSchema,
]);

export const CreateScenarioBodySchema = z.object({
  name: z.string().min(1).max(120),
  currency: z.enum(["CZK", "EUR", "USD"]).default("CZK"),
  inputs: ScenarioInputsSchema,
  basedOnTemplateId: z.string().uuid().optional(),  // pokud kopírováno z templatu
});
```

**Response 201**:

```ts
export const ScenarioDetailSchema = ScenarioSummarySchema.extend({
  inputs: ScenarioInputsSchema,
  basedOnTemplateId: z.string().uuid().nullable(),
});

export const CreateScenarioResponseSchema = z.object({
  scenario: ScenarioDetailSchema,
});
```

**Errors**: 400 (validation), 401, 500.

### 3. `GET /api/scenarios/:id`

**Auth**: required.
**Účel**: detail scénáře.

**Path params**:

```ts
export const ScenarioIdParamSchema = z.object({
  id: z.string().uuid(),
});
```

**Response 200**: `{ scenario: ScenarioDetailSchema }`.
**Errors**: 401, 404.

### 4. `PATCH /api/scenarios/:id`

**Auth**: required.
**Účel**: update jména, inputs, archived stavu.

**Request body** (Zod):

```ts
export const UpdateScenarioBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  inputs: ScenarioInputsSchema.optional(),
  archived: z.boolean().optional(),  // true = archivovat (soft delete), false = obnovit
});
```

**Response 200**: `{ scenario: ScenarioDetailSchema }`.
**Errors**: 400, 401, 404.

### 5. `DELETE /api/scenarios/:id`

**Auth**: required.
**Účel**: soft delete (`archived_at = now()`). Hard delete neexponujeme v MVP — vyžádá si user manuálně přes Supabase dashboard nebo budoucí "Permanently delete" UI.

**Response 200**: `{ ok: true }`.
**Errors**: 401, 404.

### 6. `POST /api/scenarios/:id/duplicate`

**Auth**: required.
**Účel**: zkopírovat scénář (typicky z template do user space, ale i z vlastního).

**Request body**:

```ts
export const DuplicateScenarioBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),  // default: "Kopie {original.name}"
});
```

**Response 201**: `{ scenario: ScenarioDetailSchema }`.
**Errors**: 401, 404.

### 7. `GET /api/templates`

**Auth**: **NOT required** (public read).
**Účel**: list předplněných templates.

**Query params**:

```ts
export const ListTemplatesQuerySchema = z.object({
  type: z.enum(["compound", "real_estate", "all"]).default("all"),
  locale: z.enum(["cs", "en"]).default("cs"),
});
```

**Response 200**:

```ts
export const TemplateSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),                       // např. "sp500-1995-2025"
  type: z.enum(["compound", "real_estate"]),
  name: z.string(),                       // localized podle ?locale=
  description: z.string(),                // localized
  inputs: ScenarioInputsSchema,
  currency: z.enum(["CZK", "EUR", "USD"]),
  sourceUrl: z.string().url().nullable(),
});

export const ListTemplatesResponseSchema = z.object({
  templates: z.array(TemplateSchema),
});
```

### 8. `POST /api/auth/callback` (Supabase OAuth callback)

**Auth**: handled by Supabase SDK.
**Účel**: výměna OAuth `code` za session, set cookies, redirect.

Implementace standardní per `@supabase/ssr` docs. Žádný Zod schema — řeší SDK.

### 9. `POST /api/log/error` (frontend error reporter — pre-Sentry)

**Auth**: optional (logujeme i anonymous errors).
**Účel**: jednoduchý error sink, dokud Sentry není zapojen (T-022).

**Request body**:

```ts
export const ClientErrorReportSchema = z.object({
  message: z.string().max(2000),
  stack: z.string().max(10000).optional(),
  url: z.string().url().optional(),
  userAgent: z.string().max(500).optional(),
});
```

**Response 200**: `{ ok: true }`.
**Notes**: rate-limited per IP (10/min). Loguje přes `pino` na Vercel logs.

## Endpointy NEPOSKYTOVANÉ v MVP

- `POST /api/scenarios/:id/calculate` — calc běží 100 % na klientu, ne na serveru.
- `POST /api/scenarios/:id/pdf` — PDF generování řešíme client-side přes `@react-pdf/renderer`, žádný server endpoint.
- `POST /api/users` / `DELETE /api/users/me` — user management plně přes Supabase Auth (signup, password reset, atd. handles SDK). Account deletion → manuálně přes Supabase dashboard v MVP, později self-service.

## Mobile data access (žádný shared HTTP API)

Mobile používá **`@supabase/supabase-js` přímo proti PostgREST**:

```
// pseudo, ne kód do MVP
supabase.from('scenario').select('*').eq('archived_at', null);
supabase.from('scenario').insert({ name, type, inputs });
supabase.from('template').select('*');
```

RLS na DB úrovni zajišťuje stejnou izolaci jako Route Handlers. **Zod validace** vstupů se děje na klientu před `insert/update` voláním — stejné schémata z `@investio/shared/schemas`.

## OpenAPI / typed client

V MVP **negenerujeme** OpenAPI spec — schémata Zod jsou single source of truth, web frontend volá fetch s typed schemas přes thin client v `apps/web/lib/api-client.ts` (T-008 ho založí). Pokud později přijde external API consumer, vygenerujeme OpenAPI z Zod schémat přes `@asteasolutions/zod-to-openapi`.

## Reference

- ADR-0001 (Route Handlers + Zod + Prisma decisions)
- ADR-0002 (auth — Route Handler boundary)
- `docs/architecture.md` — calc primitives + data flow
- Supabase PostgREST docs: https://postgrest.org
