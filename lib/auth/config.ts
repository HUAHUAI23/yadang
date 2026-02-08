import "server-only";

import { businessPrisma } from "@/lib/db/business";
import { AuthMethod } from "@/prisma/generated/business/client";

const ALL_METHODS = [AuthMethod.PASSWORD, AuthMethod.SMS];

async function ensureAuthConfig() {
  const existing = await businessPrisma.authMethodConfig.findMany({
    select: { method: true },
  });
  const existingSet = new Set(existing.map((item) => item.method));
  const missing = ALL_METHODS.filter((method) => !existingSet.has(method));

  if (missing.length > 0) {
    await businessPrisma.authMethodConfig.createMany({
      data: missing.map((method) => ({
        method,
        enabled: true,
      })),
      skipDuplicates: true,
    });
  }
}

export async function getAuthConfig() {
  await ensureAuthConfig();
  const configs = await businessPrisma.authMethodConfig.findMany();

  return {
    password: configs.some(
      (item) => item.method === AuthMethod.PASSWORD && item.enabled
    ),
    sms: configs.some((item) => item.method === AuthMethod.SMS && item.enabled),
  };
}

export async function assertAuthMethodEnabled(method: "password" | "sms") {
  const config = await getAuthConfig();
  if (method === "password" && !config.password) {
    throw new Error("密码登录已禁用");
  }
  if (method === "sms" && !config.sms) {
    throw new Error("短信登录已禁用");
  }
}
