import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/server/response";
import { trademarkSearchService } from "@/lib/server/trademark-search";

export async function GET() {
  try {
    const session = await resolveSessionContext({ createAccountIfMissing: true });
    const items = await trademarkSearchService.listHistory(session.user.id);
    return jsonOk({ items });
  } catch (error) {
    if (error instanceof AuthSessionError) {
      return jsonError(error.status, error.message);
    }
    return jsonError(500, (error as Error).message ?? "获取历史失败");
  }
}

export const runtime = "nodejs";

