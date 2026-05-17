// @investio/db — Prisma client singleton + RLS-aware factory
//
// RLS pattern (per ADR-0001 + ADR-0002):
//   Supabase RLS policies use `auth.uid()` which reads from the JWT claims
//   set on the Postgres session. When connecting via Prisma (not PostgREST),
//   we must manually set `request.jwt.claims` before each query so that
//   `auth.uid()` resolves to the correct user.
//
// Implementation decision:
//   We use a Prisma Client Extension with `$allOperations` query interceptor.
//   Each intercepted call wraps the target query in a `$transaction` that:
//     1. Sets `request.jwt.claims` via `SET LOCAL` (session-scoped, auto-cleared
//        at transaction end — safe for connection pooling).
//     2. Runs the actual query.
//
// Why $transaction vs middleware:
//   `SET LOCAL` only persists within the current transaction. Using `$transaction`
//   guarantees the claim is set before the query and is cleared atomically when
//   the transaction ends. A plain `$executeRaw` before `query(args)` without
//   a transaction would run on potentially different pooled connections.
//
// Why not interactive transactions ($transaction callback):
//   The `$allOperations` interceptor receives the `query` function directly.
//   We use the array form of `$transaction` to keep it simple and avoid
//   nesting interactive transactions which Prisma does not allow.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Base Prisma singleton — NO RLS claims set.
 * Use this only for service-role operations (admin/seed) where RLS is
 * intentionally bypassed. In Route Handlers, always use `getPrismaForUser`.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") globalForPrisma.prisma = prisma;

/**
 * Returns a Prisma client extension scoped to `userId` for RLS enforcement.
 *
 * Every query issued through the returned client will be wrapped in a
 * Postgres transaction that first executes:
 *   SET LOCAL request.jwt.claims = '{"sub":"<userId>","role":"authenticated"}';
 *
 * This allows Supabase RLS policies using `auth.uid()` to resolve correctly,
 * because `auth.uid()` in Supabase reads `(current_setting('request.jwt.claims',true)::jsonb)->>'sub'`.
 *
 * @param userId - UUID of the authenticated user (from Supabase session).
 */
export function getPrismaForUser(userId: string) {
  // We create a fresh extension instance per request/user. Extensions are
  // lightweight wrappers — the underlying PrismaClient singleton is reused.
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const claims = JSON.stringify({ sub: userId, role: "authenticated" });
          // Array-form $transaction: [setClaimsOp, setRoleOp, queryOp]
          //
          // Two SET LOCAL calls are required for RLS to activate:
          //   1. set_config('request.jwt.claims', ...) — so auth.uid() resolves.
          //   2. SET LOCAL ROLE authenticated — so Postgres applies RLS policies
          //      scoped to the `authenticated` role. Without this, the connection
          //      runs as `postgres` (superuser) which bypasses RLS entirely.
          //
          // SET LOCAL scopes both changes to the current transaction only,
          // making this safe for connection pooling (changes auto-revert on commit).
          const [,, result] = await prisma.$transaction([
            prisma.$executeRawUnsafe(
              `SELECT set_config('request.jwt.claims', $1, TRUE)`,
              claims,
            ),
            prisma.$executeRaw`SET LOCAL ROLE authenticated`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

export default prisma;
