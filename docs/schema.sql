-- ============================================================================
-- Investio — initial schema
-- ----------------------------------------------------------------------------
-- Source of truth pro DB schema. Tento soubor je kopírovaný 1:1 do
-- supabase/migrations/<timestamp>_initial.sql při T-006 setup.
--
-- Závislosti:
--   - Supabase managed Postgres (verze 15+)
--   - auth.users tabulka existuje (Supabase Auth runtime)
--
-- Pravidla:
--   - Source-of-truth pro DDL je TENTO soubor. Prisma schema vznikne přes
--     `prisma db pull` po aplikaci migrace.
--   - RLS = default deny, povolujeme jen explicit policies.
--   - Žádné JSON Schema validation v DB — Zod na app layer pokrývá tvar `inputs`.
--   - Soft delete přes `archived_at`; hard delete jen přes service role.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
-- gen_random_uuid() je v Postgresu 13+ v core (pgcrypto), Supabase ho má,
-- ale uuid-ossp historicky používaná konvence — držíme obě dostupné.
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";


-- ============================================================================
-- Helper: updated_at trigger function
-- ----------------------------------------------------------------------------
-- Šťouchne `updated_at = now()` při každém UPDATE. Bezpečnější než app-layer
-- update — klient nemůže timestamp falšovat.
-- ============================================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================================
-- Table: public.template
-- ----------------------------------------------------------------------------
-- Read-only předplněné scénáře (S&P 500 historie, CZ činovní dům, atd.).
-- Sdílené mezi všemi usery (public read přes RLS). Write jen přes service role
-- — žádné insert/update/delete policies → default deny pro authenticated/anon.
-- ============================================================================
create table if not exists public.template (
  id                uuid          primary key default gen_random_uuid(),
  slug              text          not null unique,
  type              text          not null check (type in ('compound', 'real_estate')),
  currency          text          not null default 'CZK' check (currency in ('CZK', 'EUR', 'USD')),
  name_cs           text          not null,
  name_en           text          not null,
  description_cs    text,
  description_en    text,
  inputs            jsonb         not null,
  source_citation   text,
  source_url        text,
  display_order     int           not null default 0,
  created_at        timestamptz   not null default now()
);

comment on table public.template is
  'Read-only seed scénáře, public read, write jen přes service role.';
comment on column public.template.slug is
  'Stabilní identifikátor pro klient (např. "sp500-1995-2025"). Nikdy se nemění.';
comment on column public.template.inputs is
  'Polymorfní jsonb — tvar dán Zod schématem v packages/shared podle column "type".';

-- Indexy
create index if not exists template_type_idx
  on public.template (type);

create index if not exists template_display_order_idx
  on public.template (display_order, slug);


-- ============================================================================
-- Table: public.scenario
-- ----------------------------------------------------------------------------
-- Uživatelův pojmenovaný scénář. Per-user, RLS-protected. Polymorfní vstupy
-- přes type + inputs jsonb. Soft delete přes archived_at.
-- ============================================================================
create table if not exists public.scenario (
  id                    uuid          primary key default gen_random_uuid(),
  user_id               uuid          not null references auth.users(id) on delete cascade,
  name                  text          not null,
  type                  text          not null check (type in ('compound', 'real_estate')),
  currency              text          not null default 'CZK' check (currency in ('CZK', 'EUR', 'USD')),
  inputs                jsonb         not null,
  based_on_template_id  uuid          references public.template(id) on delete set null,
  archived_at           timestamptz,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now()
);

comment on table public.scenario is
  'Per-user scénář. RLS enforced, archived_at = soft delete.';
comment on column public.scenario.user_id is
  'FK na auth.users; on delete cascade — smazání účtu odstraní scénáře (GDPR).';
comment on column public.scenario.inputs is
  'Polymorfní jsonb — tvar dán Zod discriminated union podle column "type".';
comment on column public.scenario.archived_at is
  'NULL = aktivní; NOT NULL = soft-deleted timestamp. Archivované scénáře nejsou editovatelné (vynuceno na app layer).';
comment on column public.scenario.based_on_template_id is
  'Provenance — nullable, on delete set null. Smazání template nesmaže scénáře z něj odvozené.';

-- Indexy
create index if not exists scenario_user_id_idx
  on public.scenario (user_id);

-- Case-insensitive uniqueness scope na non-archived.
-- Archivovaný scénář blokuje název uvolňuje → user může vytvořit nový se stejným jménem.
create unique index if not exists scenario_user_name_unique
  on public.scenario (user_id, lower(name))
  where archived_at is null;

-- Composite pro listing dashboard ("naposledy upraveno desc")
create index if not exists scenario_user_updated_at_idx
  on public.scenario (user_id, updated_at desc);

-- Partial index pro analytics ("kolik scénářů vzniklo z template X")
create index if not exists scenario_based_on_template_idx
  on public.scenario (based_on_template_id)
  where based_on_template_id is not null;

-- Trigger: auto-update `updated_at`
drop trigger if exists scenario_set_updated_at on public.scenario;
create trigger scenario_set_updated_at
  before update on public.scenario
  for each row
  execute function public.update_updated_at_column();


-- ============================================================================
-- Row Level Security — scenario
-- ----------------------------------------------------------------------------
-- Default deny. 4 policies (select/insert/update/delete) — vše scoped na
-- auth.uid() = user_id. Žádná service-role-only logika v policies (service
-- role bypassuje RLS by default).
-- ============================================================================
alter table public.scenario enable row level security;

-- Drop existing policies (idempotence při re-run migrace)
drop policy if exists "scenario_select_own"   on public.scenario;
drop policy if exists "scenario_insert_own"   on public.scenario;
drop policy if exists "scenario_update_own"   on public.scenario;
drop policy if exists "scenario_delete_own"   on public.scenario;

-- RATIONALE: User vidí jen vlastní scénáře (aktivní i archivované); izolace dat per uživatel.
create policy "scenario_select_own"
  on public.scenario
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RATIONALE: User může vytvořit scénář jen pro sebe — chrání před injection cizího user_id v API payloadu.
create policy "scenario_insert_own"
  on public.scenario
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RATIONALE: User upraví jen vlastní řádky a NESMÍ změnit user_id na cizí (with check zakáže ownership transfer).
create policy "scenario_update_own"
  on public.scenario
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RATIONALE: User smaže jen vlastní; API stejně používá soft delete, hard delete přijde jen ze Supabase dashboard / migration.
create policy "scenario_delete_own"
  on public.scenario
  for delete
  to authenticated
  using (auth.uid() = user_id);


-- ============================================================================
-- Row Level Security — template
-- ----------------------------------------------------------------------------
-- Public read (anon + authenticated). Žádný write přes klient. Insert/update/
-- delete běží jen přes service role (migrace + seed v tomto souboru).
-- ============================================================================
alter table public.template enable row level security;

drop policy if exists "template_select_public" on public.template;

-- RATIONALE: Templates jsou veřejný marketing/onboarding obsah; čte i nepřihlášený návštěvník landing page.
create policy "template_select_public"
  on public.template
  for select
  to anon, authenticated
  using (true);

-- ŽÁDNÉ insert/update/delete policies → default-deny pro anon i authenticated.
-- Write jde pouze přes service role (Supabase service_role key obchází RLS).


-- ============================================================================
-- Seed: template placeholders
-- ----------------------------------------------------------------------------
-- Slugs definované teď, aby T-006 (Prisma client + migrace) měl něco
-- aplikovatelného. Skutečný content (name_cs/en, description, inputs JSON)
-- doplní T-017 (content agent).
--
-- Konvence:
--   - `name_cs` / `name_en` = placeholder text, T-017 přepíše.
--   - `inputs` = minimální platný JSON pro daný `type`, T-017 přepíše reálnými
--     hodnotami (S&P 500 historic, CZ apartment data, atd.). Placeholder splňuje
--     Zod schemu (compound s defaultními poli, real_estate s minimem).
--   - `display_order` deterministicky vzestupně.
--
-- Po editu T-017 se UPSERT přes `on conflict (slug) do update set ...`.
-- Tato sekce je idempotentní (re-run nevadí).
-- ============================================================================

insert into public.template (slug, type, currency, name_cs, name_en, description_cs, description_en, inputs, source_citation, source_url, display_order)
values
  (
    'sp500-1995-2025',
    'compound',
    'USD',
    '[PLACEHOLDER] S&P 500 1995–2025',
    '[PLACEHOLDER] S&P 500 1995–2025',
    null,
    null,
    jsonb_build_object(
      'type', 'compound',
      'initialAmount', 0,
      'monthlyContribution', 0,
      'annualReturnPct', 0.10,
      'horizonYears', 30,
      'contributionTiming', 'end'
    ),
    null,
    null,
    10
  ),
  (
    'msci-world',
    'compound',
    'USD',
    '[PLACEHOLDER] MSCI World',
    '[PLACEHOLDER] MSCI World',
    null,
    null,
    jsonb_build_object(
      'type', 'compound',
      'initialAmount', 0,
      'monthlyContribution', 0,
      'annualReturnPct', 0.08,
      'horizonYears', 30,
      'contributionTiming', 'end'
    ),
    null,
    null,
    20
  ),
  (
    'cz-dividend-stocks',
    'compound',
    'CZK',
    '[PLACEHOLDER] CZ dividendové akcie',
    '[PLACEHOLDER] CZ dividend stocks',
    null,
    null,
    jsonb_build_object(
      'type', 'compound',
      'initialAmount', 0,
      'monthlyContribution', 0,
      'annualReturnPct', 0.06,
      'horizonYears', 20,
      'contributionTiming', 'end'
    ),
    null,
    null,
    30
  ),
  (
    'cz-apartment-house',
    'real_estate',
    'CZK',
    '[PLACEHOLDER] CZ činovní dům',
    '[PLACEHOLDER] CZ apartment house',
    null,
    null,
    jsonb_build_object(
      'type', 'real_estate',
      'purchasePrice', 10000000,
      'downPayment', 2000000,
      'mortgage', jsonb_build_object('annualRatePct', 0.055, 'termYears', 25),
      'monthlyRent', 45000,
      'monthlyExpenses', 5000,
      'vacancyRatePct', 0.05,
      'maintenancePctOfRent', 0.05,
      'annualAppreciationPct', 0.03,
      'annualRentGrowthPct', 0.02,
      'incomeTaxPct', 0.15,
      'horizonYears', 25
    ),
    null,
    null,
    40
  ),
  (
    'holiday-rental',
    'real_estate',
    'CZK',
    '[PLACEHOLDER] Rekreační pronájem',
    '[PLACEHOLDER] Holiday rental',
    null,
    null,
    jsonb_build_object(
      'type', 'real_estate',
      'purchasePrice', 5000000,
      'downPayment', 1500000,
      'mortgage', jsonb_build_object('annualRatePct', 0.055, 'termYears', 20),
      'monthlyRent', 30000,
      'monthlyExpenses', 6000,
      'vacancyRatePct', 0.30,
      'maintenancePctOfRent', 0.08,
      'annualAppreciationPct', 0.025,
      'annualRentGrowthPct', 0.02,
      'incomeTaxPct', 0.15,
      'horizonYears', 20
    ),
    null,
    null,
    50
  ),
  (
    'urban-flat',
    'real_estate',
    'CZK',
    '[PLACEHOLDER] Městský byt',
    '[PLACEHOLDER] Urban flat',
    null,
    null,
    jsonb_build_object(
      'type', 'real_estate',
      'purchasePrice', 6500000,
      'downPayment', 1500000,
      'mortgage', jsonb_build_object('annualRatePct', 0.055, 'termYears', 25),
      'monthlyRent', 22000,
      'monthlyExpenses', 3500,
      'vacancyRatePct', 0.03,
      'maintenancePctOfRent', 0.04,
      'annualAppreciationPct', 0.035,
      'annualRentGrowthPct', 0.025,
      'incomeTaxPct', 0.15,
      'horizonYears', 25
    ),
    null,
    null,
    60
  )
on conflict (slug) do nothing;
-- Pozn.: `on conflict do nothing` chrání před přepsáním reálného content,
-- který T-017 vloží přes vlastní migraci (UPSERT s explicitními sloupci).


-- ============================================================================
-- Konec migrace
-- ============================================================================
