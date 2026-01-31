// Business DB Prisma Client singleton to avoid extra connections in dev.
import "server-only";

import { PrismaClient } from "@/prisma/generated/business";

const globalForPrisma = globalThis as unknown as {
  prismaBusiness?: PrismaClient;
};

export const businessPrisma =
  globalForPrisma.prismaBusiness ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBusiness = businessPrisma;
}
