import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { withRequestTrace } from "@/lib/server/logger";
import {
  asAlipayPayload,
  ChargeOrderError,
  getChargeOrderForUser,
  isOrderQueryPendingSafe,
  parseChargeOrderId,
  queryAlipayAndSyncChargeOrder,
  toChargeOrderStatusView,
} from "@/lib/server/payment/charge-orders";
import { jsonError, jsonOk } from "@/lib/server/response";

export async function GET(request: Request) {
  return withRequestTrace(request, async () => {
    const { searchParams } = new URL(request.url);
    const outTradeNo = searchParams.get("outTradeNo")?.trim() ?? "";
    const chargeOrderId = parseChargeOrderId(searchParams.get("chargeOrderId"));

    if (!outTradeNo && !chargeOrderId) {
      return jsonError(400, "请提供 outTradeNo 或 chargeOrderId");
    }

    try {
      const session = await resolveSessionContext({ createAccountIfMissing: true });
      const localOrder = await getChargeOrderForUser({
        userId: session.user.id,
        outTradeNo: outTradeNo || undefined,
        chargeOrderId: outTradeNo ? undefined : chargeOrderId ?? undefined,
      });

      const currentStatus = localOrder.status.toLowerCase();
      let alipayOrder: ReturnType<typeof asAlipayPayload> | null = null;
      let alipayQueryFailed = false;

      if (currentStatus === "pending" || currentStatus === "processing") {
        try {
          const queryResult = await queryAlipayAndSyncChargeOrder(localOrder.outTradeNo);
          alipayOrder = asAlipayPayload(queryResult);
        } catch (error) {
          if (!isOrderQueryPendingSafe(error)) {
            alipayQueryFailed = true;
          }
        }
      }

      const latestOrder = await getChargeOrderForUser({
        userId: session.user.id,
        outTradeNo: localOrder.outTradeNo,
      });

      return jsonOk({
        ...toChargeOrderStatusView(latestOrder),
        alipayOrder,
        alipayQueryFailed,
      });
    } catch (error) {
      if (error instanceof AuthSessionError) {
        return jsonError(error.status, error.message);
      }
      if (error instanceof ChargeOrderError) {
        return jsonError(error.status, error.message);
      }
      return jsonError(500, (error as Error).message ?? "查询订单失败");
    }
  });
}

export const runtime = "nodejs";
