# @investio/db

Prisma client wrapper for Investio. Provides a typed database client with RLS (Row Level Security) enforcement via per-user JWT claims.

## Fresh setup

### Prerequisites

- Docker running
- Supabase CLI installed (`brew install supabase/tap/supabase`)
- pnpm 9+

### Steps

1. Install monorepo dependencies from root:

   ```sh
   pnpm i
   ```

2. Start local Supabase (applies migrations automatically):

   ```sh
   supabase start
   ```

3. Reset database and apply migrations + seed:

   ```sh
   supabase db reset
   ```

4. Copy `.env.example` to `.env` and fill values from Supabase status:

   ```sh
   cp packages/db/.env.example packages/db/.env
   supabase status -o json
   # Fill DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
   # SUPABASE_ANON_KEY, JWT_SECRET from the JSON output.
   ```

5. Generate Prisma client:

   ```sh
   pnpm --filter @investio/db exec prisma generate
   ```

6. Run RLS integration tests:

   ```sh
   pnpm --filter @investio/db test
   ```

All 6 tests should pass, proving RLS isolation works correctly.

## Usage

### Basic (no RLS — service role)

```ts
import { prisma } from "@investio/db";

// Bypasses RLS — use only in server-side admin scripts / seeds.
const templates = await prisma.template.findMany();
```

### Per-user (RLS enforced)

```ts
import { getPrismaForUser } from "@investio/db";

// In a Next.js Route Handler:
const { data: { user } } = await supabase.auth.getUser();
const db = getPrismaForUser(user.id);

// All queries will be scoped to user.id via RLS.
const scenarios = await db.scenario.findMany();
```

## RLS implementation

`getPrismaForUser(userId)` returns a Prisma client extension that wraps every query in a Postgres transaction with two `SET LOCAL` calls:

1. `SELECT set_config('request.jwt.claims', '{"sub":"<userId>","role":"authenticated"}', TRUE)` — allows `auth.uid()` to resolve.
2. `SET LOCAL ROLE authenticated` — activates RLS policies scoped to the `authenticated` role. Without this, the `postgres` superuser connection bypasses RLS entirely.

Both `SET LOCAL` calls are transaction-scoped and auto-revert on commit, making this safe for connection pooling.

## Schema

Source of truth: `docs/schema.sql`. Prisma schema at `prisma/schema.prisma` is manually maintained (not generated via `prisma db pull`) because Prisma cannot introspect cross-schema FK `scenario.user_id → auth.users(id)`.

To resync after schema changes:
1. Edit `docs/schema.sql`
2. Create a new migration in `supabase/migrations/`
3. Run `supabase db reset`
4. Update `prisma/schema.prisma` manually
5. Run `pnpm --filter @investio/db exec prisma generate`

## Remote Supabase setup (user-bound steps)

These steps require interactive browser login — to be done by the developer:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy the project reference ID from the dashboard URL
3. Link the CLI: `supabase link --project-ref <project-ref>`
4. Push migrations to remote: `supabase db push`
5. Copy the remote connection strings from the Supabase dashboard (Settings > Database) into `.env`:
   - `DATABASE_URL`: Session mode pooler URL (port 5432)
   - `DIRECT_URL`: Direct connection URL (port 5432, no pooler)
6. Run `pnpm --filter @investio/db exec prisma generate` to regenerate the client for the remote DB
