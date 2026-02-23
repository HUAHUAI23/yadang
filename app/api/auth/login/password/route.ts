import { assertAuthMethodEnabled } from "@/lib/auth/config";
import { setSessionCookie,signSessionToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { toAuthUser } from "@/lib/auth/user";
import { businessPrisma } from "@/lib/db/business";
import { jsonError, jsonOk } from "@/lib/server/response";
import { loginPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    await assertAuthMethodEnabled("password");
  } catch (error) {
    return jsonError(403, (error as Error).message);
  }

  const body = await request.json().catch(() => null);
  const parsed = loginPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "参数错误");
  }

  const { username, password } = parsed.data;
  const user = await businessPrisma.user.findUnique({
    where: { username },
  });

  if (!user || !user.passwordHash) {
    return jsonError(401, "账号或密码错误");
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return jsonError(401, "账号或密码错误");
  }

  const token = await signSessionToken(user.id);
  await setSessionCookie(token);

  return jsonOk({ user: toAuthUser(user) });
}

export const runtime = "nodejs";
