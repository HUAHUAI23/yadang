// 业务库 Prisma Client 单例封装，避免开发态重复连接。
import "server-only";

import "@/lib/env";
import { PrismaClient } from "@/prisma/generated/business/client";

const globalForPrisma = globalThis as unknown as {
  prismaBusiness?: PrismaClient;
};

export const businessPrisma =
  globalForPrisma.prismaBusiness ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaBusiness = businessPrisma;
}
