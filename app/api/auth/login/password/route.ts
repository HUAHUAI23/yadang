import { assertAuthMethodEnabled } from "@/lib/auth/config";
import { setSessionCookie,signSessionToken } from "@/lib/auth/jwt";
import { verifyPassword } from "@/lib/auth/password";
import { toAuthAccount, toAuthUser } from "@/lib/auth/user";
import { businessPrisma } from "@/lib/db/business";
import { env } from "@/lib/env";
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

  let account = await businessPrisma.account.findUnique({
    where: { userId: user.id },
  });
  if (!account) {
    try {
      account = await businessPrisma.account.create({
        data: {
          userId: user.id,
          balance: BigInt(env.initialAccountBalance),
        },
      });
    } catch {
      account = await businessPrisma.account.findUnique({
        where: { userId: user.id },
      });
    }
  }

  if (!account) {
    return jsonError(500, "账户初始化失败");
  }

  return jsonOk({
    user: toAuthUser(user),
    account: toAuthAccount(account),
  });
}

export const runtime = "nodejs";
