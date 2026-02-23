import { getSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { toAuthUser } from "@/lib/auth/user";
import { businessPrisma } from "@/lib/db/business";
import { jsonError, jsonOk } from "@/lib/server/response";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return jsonError(401, "未登录");
  }

  try {
    const { userId } = await verifySessionToken(token);
    const user = await businessPrisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return jsonError(401, "未登录");
    }

    return jsonOk({ user: toAuthUser(user) });
  } catch {
    return jsonError(401, "会话已失效");
  }
}

export const runtime = "nodejs";
