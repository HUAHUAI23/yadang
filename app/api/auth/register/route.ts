import { registerPayloadSchema } from "@/lib/validation/auth";
import { assertAuthMethodEnabled, getAuthConfig } from "@/lib/auth/config";
import { hashPassword } from "@/lib/auth/password";
import { signSessionToken, setSessionCookie } from "@/lib/auth/jwt";
import { ensureUserCredits, toAuthUser } from "@/lib/auth/user";
import { formatPurpose, verifySmsCode } from "@/lib/auth/verification";
import { businessPrisma } from "@/lib/db/business";
import { jsonError, jsonOk } from "@/lib/server/response";

export async function POST(request: Request) {
  try {
    await assertAuthMethodEnabled("password");
  } catch (error) {
    return jsonError(403, (error as Error).message);
  }

  const body = await request.json().catch(() => null);
  const parsed = registerPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "参数错误");
  }

  const { username, phone, sms, password } = parsed.data;

  const config = await getAuthConfig();
  if (config.sms) {
    if (!sms) {
      return jsonError(400, "请输入短信验证码");
    }
    const verifyResult = await verifySmsCode(
      phone,
      formatPurpose("register"),
      sms
    );
    if (!verifyResult.ok) {
      return jsonError(401, verifyResult.message ?? "验证码错误");
    }
  }

  const existingUser = await businessPrisma.user.findFirst({
    where: {
      OR: [{ username }, { phone }],
    },
  });
  if (existingUser) {
    return jsonError(409, "账号已存在");
  }

  const passwordHash = await hashPassword(password);
  const user = await businessPrisma.user.create({
    data: {
      username,
      phone,
      passwordHash,
    },
  });

  const token = await signSessionToken(user.id);
  await setSessionCookie(token);

  const credits = await ensureUserCredits(user.id);

  return jsonOk({ user: toAuthUser(user), credits });
}

export const runtime = "nodejs";
