import { loginSmsSchema } from "@/lib/validation/auth";
import { assertAuthMethodEnabled } from "@/lib/auth/config";
import { signSessionToken, setSessionCookie } from "@/lib/auth/jwt";
import { toAuthUser } from "@/lib/auth/user";
import { formatPurpose, verifySmsCode } from "@/lib/auth/verification";
import { businessPrisma } from "@/lib/db/business";
import { jsonError, jsonOk } from "@/lib/server/response";

export async function POST(request: Request) {
  try {
    await assertAuthMethodEnabled("sms");
  } catch (error) {
    return jsonError(403, (error as Error).message);
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSmsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "参数错误");
  }

  const { phone, sms } = parsed.data;
  const verifyResult = await verifySmsCode(
    phone,
    formatPurpose("login"),
    sms
  );
  if (!verifyResult.ok) {
    return jsonError(401, verifyResult.message ?? "验证码错误");
  }

  let user = await businessPrisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await businessPrisma.user.create({
      data: {
        phone,
      },
    });
  }

  const token = await signSessionToken(user.id);
  await setSessionCookie(token);

  return jsonOk({ user: toAuthUser(user) });
}

export const runtime = "nodejs";
