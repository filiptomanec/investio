// @investio/db — Prisma client singleton
//
// TODO(T-006): Add Prisma extension to set JWT claims for RLS:
//   prisma.$extends({
//     query: { $allModels: { async $allOperations({ operation, model, args, query }) {
//       const [, result] = await prisma.$transaction([
//         prisma.$executeRaw`SELECT set_config('request.jwt.claims', ${jwtClaims}, TRUE)`,
//         query(args),
//       ])
//       return result
//     }}}
//   })
// See docs/architecture.md "Data flow" section for RLS + Prisma integration details.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") globalForPrisma.prisma = prisma;

export default prisma;
