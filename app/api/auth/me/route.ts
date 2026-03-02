import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { toAuthAccount, toAuthUser } from "@/lib/auth/user";
import { jsonError, jsonOk } from "@/lib/server/response";

export async function GET() {
  try {
    const session = await resolveSessionContext({ createAccountIfMissing: true });
    return jsonOk({
      user: toAuthUser(session.user),
      account: toAuthAccount(session.account),
    });
  } catch (error) {
    if (error instanceof AuthSessionError) {
      return jsonError(error.status, error.message);
    }
    return jsonError(500, (error as Error).message ?? "获取会话失败");
  }
}

export const runtime = "nodejs";
