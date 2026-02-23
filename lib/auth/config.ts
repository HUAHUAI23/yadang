import { businessPrisma } from "@/lib/db/business";
import { AuthMethod } from "@/prisma/generated/business/enums";

import "server-only";

export async function getAuthConfig() {
  const configs = await businessPrisma.authMethodConfig.findMany({
    select: { method: true, enabled: true },
  });

  if (configs.length === 0) {
    return { password: true, sms: true };
  }

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
