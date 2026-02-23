// 业务库 Prisma Client 单例封装，避免开发态重复连接。
import { createMariaDbAdapter } from "@/lib/db/adapter";
import { env } from "@/lib/env";
import { PrismaClient } from "@/prisma/generated/business/client";

import "server-only";

type BusinessPrismaClient = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prismaBusiness?: BusinessPrismaClient;
};

export const businessPrisma: BusinessPrismaClient =
  globalForPrisma.prismaBusiness ??
  new PrismaClient({
    adapter: createMariaDbAdapter(
      env.businessDatabaseUrl,
      "BUSINESS_DATABASE_URL",
    ),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBusiness = businessPrisma;
}
