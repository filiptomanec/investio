# Investio — Data Model

> Source of truth pro DB schema. Sloupcové typy + nullability + indexy + RLS rationale + business invarianty. Companion k `docs/schema.sql` (executable DDL).
>
> **Rozhodnutí o source-of-truth** (per ADR-0001): `schema.sql` je primary source. Prisma schema (T-006) vznikne přes `prisma db pull` z aplikované migrace. Důvod: RLS policies nejsou v Prisma DSL vyjádřitelné.

## TL;DR

- 2 vlastní tabulky: `scenario` (per-user, write-protected via RLS) + `template` (global, public read).
- **Žádná vlastní `user` tabulka** — `auth.users` ze Supabase je source of truth identity. Cizí klíče přes `references auth.users(id) on delete cascade`.
- **Polymorfismus** vstupů řešen `type` discriminator + `inputs jsonb`, validace přes Zod na app layer. Žádná JSON-Schema-in-DB.
- **Soft delete** přes `archived_at timestamptz`. Hard delete jen přes Supabase dashboard (audit / undo / GDPR self-service mimo MVP).
- **ScenarioVersion DROPNUTO** v MVP — viz "Versioning" sekce níže.

## ER diagram (ASCII)

```
                   ┌────────────────────────────────┐
                   │ auth.users (Supabase managed)  │
                   │ ────────────────────────────── │
                   │ id           uuid PK           │
                   │ email        text              │
                   │ created_at   timestamptz       │
                   │ ...                            │
                   └─────────────┬──────────────────┘
                                 │ 1
                                 │
                                 │ N  (on delete cascade)
                                 ▼
   ┌──────────────────────────────────────────────────────────┐
   │ scenario                                                 │
   │ ──────────────────────────────────────────────────────── │
   │ id                  uuid PK   default gen_random_uuid()  │
   │ user_id             uuid  NOT NULL  → auth.users(id)     │
   │ name                text  NOT NULL                       │
   │ type                text  NOT NULL  CHECK in (...)       │
   │ currency            text  NOT NULL  DEFAULT 'CZK'        │
   │ inputs              jsonb NOT NULL                       │
   │ based_on_template_id uuid NULL  → template(id) ON DELETE SET NULL │
   │ archived_at         timestamptz NULL                     │
   │ created_at          timestamptz NOT NULL DEFAULT now()   │
   │ updated_at          timestamptz NOT NULL DEFAULT now()   │
   └──────────────────────────────────────────────────────────┘
                                 ▲
                                 │ N
                                 │ based_on_template_id (nullable, set null on delete)
                                 │ 0..1
                                 │
   ┌──────────────────────────────────────────────────────────┐
   │ template                                                 │
   │ ──────────────────────────────────────────────────────── │
   │ id                  uuid PK   default gen_random_uuid()  │
   │ slug                text  NOT NULL  UNIQUE               │
   │ type                text  NOT NULL  CHECK in (...)       │
   │ currency            text  NOT NULL  DEFAULT 'CZK'        │
   │ name_cs             text  NOT NULL                       │
   │ name_en             text  NOT NULL                       │
   │ description_cs      text  NULL                           │
   │ description_en      text  NULL                           │
   │ inputs              jsonb NOT NULL                       │
   │ source_citation     text  NULL                           │
   │ source_url          text  NULL                           │
   │ display_order       int   NOT NULL DEFAULT 0             │
   │ created_at          timestamptz NOT NULL DEFAULT now()   │
   └──────────────────────────────────────────────────────────┘
```

## Entity: `scenario`

| Sloupec | Typ | Nullable | Default | Poznámka |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `user_id` | uuid | NO | — | FK → `auth.users(id)` ON DELETE CASCADE — když user smaže účet, scénáře jdou s ním (GDPR pravostranně) |
| `name` | text | NO | — | 1..120 chars (validace Zod), case-insensitive unique per user na non-archived (viz indexy) |
| `type` | text | NO | — | CHECK `in ('compound', 'real_estate')` |
| `currency` | text | NO | `'CZK'` | CHECK `in ('CZK','EUR','USD')` |
| `inputs` | jsonb | NO | — | Polymorfní struktura, tvar dán Zod schématem podle `type` (viz `packages/shared/src/schemas`) |
| `based_on_template_id` | uuid | YES | NULL | FK → `template(id)` ON DELETE SET NULL — sledování provenance (z které šablony bylo zkopírováno), nevynucuje žádné business pravidlo |
| `archived_at` | timestamptz | YES | NULL | NULL = aktivní, NOT NULL = soft-deleted; obnovení = SET NULL |
| `created_at` | timestamptz | NO | `now()` | Imutable po insertu |
| `updated_at` | timestamptz | NO | `now()` | Auto-bumped trigger `update_updated_at_column()` |

### Indexy

| Index | Sloupce | Důvod |
|---|---|---|
| `scenario_pkey` | `id` | Implicit PK |
| `scenario_user_id_idx` | `user_id` | Veškerý listing dashboard query (`WHERE user_id = $1`). Selektivní (small N per user, ale RLS šťouchne `user_id` predikát do plánu). |
| `scenario_user_name_unique` | `(user_id, lower(name)) WHERE archived_at IS NULL` | Case-insensitive uniqueness scoped na non-archived. Archivované scénáře pravidlem unique nesvazují → user může archivovat "Můj plán" a vytvořit nový "Můj plán". |
| `scenario_user_updated_at_idx` | `(user_id, updated_at DESC)` | Dashboard řadí "naposledy upraveno" desc. Composite eliminuje sort. |
| `scenario_based_on_template_idx` | `(based_on_template_id) WHERE based_on_template_id IS NOT NULL` | Partial — analytics dotaz "kolik scenarii vzniklo z template X" (nice-to-have, žádný hot path) |

### Business invarianty

- **`name` case-insensitive unique per user, scoped na non-archived** — dokumentováno přes partial unique index. INSERT/UPDATE může selhat s `23505`; API to mapuje na `409 CONFLICT`.
- **`archived_at` semantika**:
  - `archived_at IS NULL` → aktivní, listovaný v defaultním dashboardu, započítaný do uniqueness.
  - `archived_at IS NOT NULL` → soft-deleted, NEzapočítaný do uniqueness, listing jen s `?archived=true`.
  - **Archived scénáře NESMÍ být upravitelné** přes `PATCH /api/scenarios/:id` mimo "obnovit". Pravidlo vynuceno **na app layer (Route Handler)**, NE v DB. Důvod: zbytečná složitost CHECK constraintu (multi-column conditional update) — Zod refinement v handleru je čitelnější.
- **`based_on_template_id` SET NULL** — když adminstrace smaže template, scénáře z něj odvozené zůstanou platné, ztratí jen provenance. Důvod: nechceme cascade smazat usery data jen proto, že refreshujeme content.
- **`updated_at` se NEnastavuje z API** — vždy přes trigger. Tím nelze "falšovat" timestamp z klienta.
- **`inputs` musí být shape-kompatibilní s `type`** — vynuceno Zod na app layer (discriminated union). DB drží jen `jsonb not null`.
- **Měna scénáře je imutable po vytvoření?** — Ne, MVP povoluje `PATCH` měny (ale ne re-konverze hodnot). Trade-off: user může přepnout CZK → EUR a inputs zůstanou stejná čísla; je to user error, nikoli DB invariant. Pokud se v praxi ukáže matoucí, T-014 přidá UI guard.

## Entity: `template`

| Sloupec | Typ | Nullable | Default | Poznámka |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `slug` | text | NO | — | UNIQUE; stable identifier (např. `sp500-1995-2025`). API listing může klient referovat přes slug, ne UUID. |
| `type` | text | NO | — | CHECK `in ('compound','real_estate')` |
| `currency` | text | NO | `'CZK'` | CHECK `in ('CZK','EUR','USD')` |
| `name_cs` | text | NO | — | i18n inlined v DB (2 jazyky → nepotřebujeme normalizační translation table v MVP) |
| `name_en` | text | NO | — | |
| `description_cs` | text | YES | NULL | |
| `description_en` | text | YES | NULL | |
| `inputs` | jsonb | NO | — | Stejný shape jako `scenario.inputs` (per `type`) |
| `source_citation` | text | YES | NULL | Lidský text — např. "Yahoo Finance, S&P 500 Total Return 1995-01-01 to 2025-01-01" |
| `source_url` | text | YES | NULL | Volitelný URL na zdroj |
| `display_order` | int | NO | `0` | Pro stabilní řazení v UI; menší = výš |
| `created_at` | timestamptz | NO | `now()` | |

### Indexy

| Index | Sloupce | Důvod |
|---|---|---|
| `template_pkey` | `id` | PK |
| `template_slug_unique` | `slug` | Unique + lookup by slug |
| `template_type_idx` | `type` | Filtr `?type=compound` (cardinality 2, ale tabulka je tak malá že full scan je OK; index defensive) |
| `template_display_order_idx` | `display_order, slug` | Stable ordering v listingu |

### Business invarianty

- **Žádný `user_id`** — template je globální, sdílený mezi všemi uživateli.
- **Write přes service role** — admin migrace + seedy. Klientský write je default-deny přes RLS (žádná insert/update/delete policy).
- **i18n inlined v sloupcích** — `name_cs`, `name_en` (a description). **Alternativa** byla translation table (`template_translation (template_id, locale, name, description)`). Skipped: 2 jazyky, low cardinality, JOIN navíc neospravedlnitelný. Pokud přidáme 3+ jazyk, refaktor.

## Verzování (`scenario_version`) — DROPNUTO v MVP

**Rozhodnutí**: NEzavádíme samostatnou `scenario_version` tabulku v MVP. Místo toho:

- `updated_at` na `scenario` + client-side undo (single-step) v editu pokrývá 95 % case.
- Pokud user řekne "vrať mi včerejší verzi", odkážeme na Postgres point-in-time recovery (Supabase pro tier; free tier ne — známé omezení dokumentované v `risks.md`).
- Pokud telemetrie po launchi ukáže reálný request na verzování, přidáme `scenario_version (id, scenario_id, snapshot jsonb, created_at, created_by)` v M5+. Migrace je nedestruktivní (append-only table).

**Důvod skipu**: kombinace [tabulka + UI history viewer + diff renderer + restore endpoint] = ~3 ticky práce za ficici, kterou hobby user nepoužije v prvních 6 měsících. YAGNI.

## Polymorfní design rationale (`type + inputs jsonb`)

### Co jsme zvolili

**Single table `scenario` s diskriminátorem `type` + payload v `inputs jsonb`.** Validace tvaru `inputs` přes Zod discriminated union na app layer (`packages/shared/src/schemas`).

### Co jsme zvážili a NEvybrali

| Alternativa | Plus | Mínus | Verdict |
|---|---|---|---|
| **Single table polymorphism (vybráno)** | 1 tabulka, 1 set RLS policies, 1 listing query (`SELECT * FROM scenario`), žádné JOINy. Snadné přidat 3. kalkulačku ("crypto staking") — nová Zod schema, nic v DB. | DB nevidí strukturu `inputs` (žádné CHECK na pole). Případné indexy na pole `inputs` vyžadují GIN nebo expression indexy. | **Vybráno** |
| **Class table inheritance** (`scenario_base` + `scenario_compound` + `scenario_real_estate`) | DB-level typed columns, FK z child na parent, snadný GROUP BY na typed fields. | 3 tabulky, 3× RLS, listing = JOIN nebo UNION ALL, přidání kalkulačky = migrace + Prisma + RLS změny. | Skipped — moc boilerplate na 2 typy. |
| **JSON Schema validation v DB** (`inputs jsonb CHECK (jsonb_matches_schema(...))` přes `pg_jsonschema` extension) | Defense-in-depth — i kdyby Zod selhala, DB neuloží invalid payload. | Vyžaduje custom extension (Supabase free tier povoluje `pg_jsonschema`, ale verze schémat se musí synchronně držet se Zod). Double-source-of-truth. | Skipped — Zod stačí, RLS pokrývá main attack vector (ne data integrity z důvěryhodného Route Handleru). |
| **Sloupce per pole** (`initial_amount`, `monthly_contribution`, `purchase_price`, ...) — wide table | DB indexy na konkrétní pole. | NULL columns balast pro irelevantní typ. Migrace na novou kalkulačku = `ALTER TABLE ADD COLUMN`. Nečisté. | Skipped jasně. |

### Kdy migrovat pryč ze single-table polymorphismu

Tracker pro budoucí re-evaluation, NE plán:

1. **Když dotazy na konkrétní fielda v `inputs` přesáhnou ~1k řádků/scan** — např. analytics "jaká je medián horizonYears napříč usery?". Tehdy buď přidáme generated columns (`horizon_years int generated always as ((inputs->>'horizonYears')::int) stored`) + index na ně, nebo refaktor na class-table.
2. **Když 4. kalkulačka přidá víc než 20 nových polí v `inputs`** — Zod schemata začnou být nepřehledná. Tehdy class-table per kalkulačku + sdílený `scenario_base`.
3. **Když potřebujeme cross-type query** ("najdi všechny scénáře s horizontem > 25 let bez ohledu na typ") — generated column + index řeší 80 % případů bez refaktoru.

Migrace bude **nedestruktivní**: nová tabulka s typed sloupci, dual-write období, backfill přes `INSERT INTO ... SELECT (inputs->>'...')::T FROM scenario`, swap. Žádný downtime.

## RLS strategie

Detail v ADR-0002. Stručné shrnutí:

- `scenario`: 4 policies (select/insert/update/delete) — všechny `using (auth.uid() = user_id)`, insert/update navíc `with check (auth.uid() = user_id)`. Default deny.
- `template`: 1 policy (`select` pro `anon` + `authenticated`, `using (true)`). Žádné insert/update/delete policy → DB blokuje vše ostatní než service role.

### RLS test cases (musí projít před merge T-002)

1. **Anonymous čte cizí scénář** — `SET ROLE anon; SELECT * FROM scenario;` → 0 řádků (RLS default-deny + žádná `anon` select policy). **VERIFIKACE**: dokonce i dotaz `SELECT 1 FROM scenario WHERE user_id = '00000000-0000-0000-0000-000000000000'` jako anon role vrátí 0 řádků, protože RLS odřízne před predikátem.
2. **Authenticated user A čte scénář usera B** — vsetuje JWT s `sub = A.id`, query `SELECT * FROM scenario WHERE user_id = '<B>'`. RLS odřízne, 0 řádků.
3. **Authenticated user A vytvoří scénář s `user_id = B.id`** — `with check` na insert blokuje (`new row violates row-level security policy`).
4. **Authenticated user A updatne `user_id` cizího scénáře na své** — `using` odfiltruje target row, update se "nepovede" (0 rows affected), nebo `with check` na new value blokuje (záleží na pořadí kontrol). Belt-and-suspenders, oboje.
5. **Authenticated user A smaže cizí scénář** — `using` blokuje, 0 rows affected.
6. **Anonymous čte templates** — `SELECT * FROM template` → vrátí všechny řádky (public read policy).
7. **Anonymous insertuje template** — `INSERT INTO template ...` → `permission denied` nebo `new row violates RLS` (žádná insert policy, default-deny).
8. **Service role bypass** — `SET ROLE service_role` (přes Supabase JS service client) — RLS NEplatí, vše projde. **Důležité**: service role se NIKDY nepoužívá ze user-facing Route Handler kódu, jen pro migrace a admin scripty (seed).

T-006 napíše Vitest integration test, který tyto cases pokryje (přes Supabase test instance v CI).

## Migrace / verzování schématu

- `supabase/migrations/<timestamp>_initial.sql` = obsah `docs/schema.sql` zkopírovaný (T-006 aplikuje).
- Další migrace = append-only, idempotentní (`create table if not exists`, `alter table ... if not exists`).
- Prisma `db pull` po každé migraci → regeneruje `schema.prisma`. Prisma schema NIKDY není první-source pro DDL.

## Reference

- `docs/schema.sql` — executable DDL
- ADR-0001 — stack, Prisma `db pull` rationale
- ADR-0002 — auth + RLS pattern (zdrojový vzor pro policies)
- `docs/api.md` — endpoint schémata (musí 1:1 odpovídat sloupcům + `inputs` Zod)
- `docs/risks.md` — Postgres PITR omezení na free tier
