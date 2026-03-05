import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { withRequestTrace } from "@/lib/server/logger";
import { listChargeOrdersByAccount } from "@/lib/server/payment/charge-orders";
import { parseQueryLimit } from "@/lib/server/query";
import { jsonError, jsonOk } from "@/lib/server/response";

export async function GET(request: Request) {
  return withRequestTrace(request, async () => {
    try {
      const session = await resolveSessionContext({ createAccountIfMissing: true });
      const { searchParams } = new URL(request.url);
      const limit = parseQueryLimit(searchParams.get("limit"), 20, 100);
      const items = await listChargeOrdersByAccount(session.account.id, limit);
      return jsonOk({ items });
    } catch (error) {
      if (error instanceof AuthSessionError) {
        return jsonError(error.status, error.message);
      }
      return jsonError(500, (error as Error).message ?? "获取充值订单失败");
    }
  });
}

export const runtime = "nodejs";
