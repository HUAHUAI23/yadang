import { assertAuthMethodEnabled } from "@/lib/auth/config";
import { sendSmsCode } from "@/lib/auth/sms";
import {
  checkSmsCooldown,
  createSmsCode,
  formatPurpose,
  generateSmsCode,
} from "@/lib/auth/verification";
import { businessPrisma } from "@/lib/db/business";
import { jsonError, jsonOk } from "@/lib/server/response";
import { sendSmsSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    await assertAuthMethodEnabled("sms");
  } catch (error) {
    return jsonError(403, (error as Error).message);
  }

  const body = await request.json().catch(() => null);
  const parsed = sendSmsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "参数错误");
  }

  const { phone, purpose } = parsed.data;
  if (purpose === "register") {
    try {
      await assertAuthMethodEnabled("password");
    } catch (error) {
      return jsonError(403, (error as Error).message);
    }

    const exists = await businessPrisma.user.findUnique({
      where: { phone },
    });
    if (exists) {
      return jsonError(409, "手机号已注册");
    }
  }

  const purposeEnum = formatPurpose(purpose);
  const cooldown = await checkSmsCooldown(phone, purposeEnum);
  if (!cooldown.allowed) {
    return jsonError(429, `发送过于频繁，请${cooldown.waitSeconds}s后再试`);
  }

  const code = generateSmsCode();
  try {
    await sendSmsCode(phone, code);
  } catch (error) {
    return jsonError(500, (error as Error).message);
  }

  await createSmsCode(phone, purposeEnum, undefined, code);

  return jsonOk({ sent: true });
}

export const runtime = "nodejs";

