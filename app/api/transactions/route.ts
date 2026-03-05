import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { withRequestTrace } from "@/lib/server/logger";
import { listTransactionsByUser } from "@/lib/server/payment/charge-orders";
import { parseQueryLimit } from "@/lib/server/query";
import { jsonError, jsonOk } from "@/lib/server/response";

const parseKind = (raw: string | null): "all" | "recharge" | "expense" => {
  if (raw === "recharge" || raw === "expense") {
    return raw;
  }
  return "all";
};

export async function GET(request: Request) {
  return withRequestTrace(request, async () => {
    try {
      const session = await resolveSessionContext({ createAccountIfMissing: true });
      const { searchParams } = new URL(request.url);
      const limit = parseQueryLimit(searchParams.get("limit"), 50, 200);
      const kind = parseKind(searchParams.get("kind"));
      const items = await listTransactionsByUser(session.user.id, { limit, kind });

      return jsonOk({
        items,
        kind,
      });
    } catch (error) {
      if (error instanceof AuthSessionError) {
        return jsonError(error.status, error.message);
      }
      return jsonError(500, (error as Error).message ?? "获取交易记录失败");
    }
  });
}

export const runtime = "nodejs";
