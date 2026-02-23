// 外部商品库 Prisma Client 单例封装，仅服务端使用。
import "server-only";

import { createMariaDbAdapter } from "@/lib/db/adapter";
import { env } from "@/lib/env";
import { PrismaClient } from "@/prisma/generated/external/client";

type ExternalPrismaClient = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prismaExternal?: ExternalPrismaClient;
};

export const externalPrisma: ExternalPrismaClient =
  globalForPrisma.prismaExternal ??
  new PrismaClient({
    adapter: createMariaDbAdapter(
      env.externalDatabaseUrl,
      "EXTERNAL_DATABASE_URL",
    ),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaExternal = externalPrisma;
}
