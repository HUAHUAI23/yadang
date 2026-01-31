// External product DB Prisma Client singleton for server-only usage.
import "server-only";

import { PrismaClient } from "@/prisma/generated/external";

const globalForPrisma = globalThis as unknown as {
  prismaExternal?: PrismaClient;
};

export const externalPrisma =
  globalForPrisma.prismaExternal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaExternal = externalPrisma;
}
