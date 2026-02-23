import "server-only";

import { createHmac } from "node:crypto";

import { env } from "@/lib/env";
import { businessPrisma } from "@/lib/db/business";
import {
  VerificationChannel,
  VerificationPurpose,
} from "@/prisma/generated/business/enums";

const getExpiresInSeconds = () => env.smsCodeExpiresIn;
const getCooldownSeconds = () => env.smsCodeCooldown;
const getMaxAttempts = () => env.smsCodeMaxAttempts;

const hashCode = (code: string) => {
  return createHmac("sha256", env.smsCodeSecret).update(code).digest("hex");
};

export const formatPurpose = (purpose: "login" | "register") =>
  purpose === "login"
    ? VerificationPurpose.LOGIN
    : VerificationPurpose.REGISTER;

export const generateSmsCode = () =>
  `${Math.floor(100000 + Math.random() * 900000)}`;

export async function checkSmsCooldown(
  phone: string,
  purpose: VerificationPurpose
) {
  const latest = await businessPrisma.verificationCode.findFirst({
    where: {
      recipient: phone,
      purpose,
      channel: VerificationChannel.SMS,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) return { allowed: true, waitSeconds: 0 };

  const diff = Date.now() - latest.createdAt.getTime();
  const cooldown = getCooldownSeconds() * 1000;

  if (diff < cooldown) {
    return { allowed: false, waitSeconds: Math.ceil((cooldown - diff) / 1000) };
  }

  return { allowed: true, waitSeconds: 0 };
}

export async function createSmsCode(
  phone: string,
  purpose: VerificationPurpose,
  userId?: number,
  code?: string
) {
  const value = code ?? generateSmsCode();
  const expiresAt = new Date(Date.now() + getExpiresInSeconds() * 1000);

  await businessPrisma.verificationCode.create({
    data: {
      recipient: phone,
      channel: VerificationChannel.SMS,
      purpose,
      codeHash: hashCode(value),
      expiresAt,
      maxAttempts: getMaxAttempts(),
      userId,
    },
  });

  return { code: value, expiresAt };
}

export async function verifySmsCode(
  phone: string,
  purpose: VerificationPurpose,
  code: string
) {
  const record = await businessPrisma.verificationCode.findFirst({
    where: {
      recipient: phone,
      purpose,
      channel: VerificationChannel.SMS,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false, message: "验证码已过期或不存在" };
  }

  if (record.attempts >= record.maxAttempts) {
    return { ok: false, message: "验证码已失效" };
  }

  if (record.codeHash !== hashCode(code)) {
    await businessPrisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 },
    });
    return { ok: false, message: "验证码错误" };
  }

  await businessPrisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  });

  return { ok: true, record };
}
