// 外部商品库 Prisma Client 单例封装，仅服务端使用。
import "server-only";

import "@/lib/env";
import { PrismaClient } from "@/prisma/generated/external/client";

const globalForPrisma = globalThis as unknown as {
  prismaExternal?: PrismaClient;
};

export const externalPrisma =
  globalForPrisma.prismaExternal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaExternal = externalPrisma;
}
