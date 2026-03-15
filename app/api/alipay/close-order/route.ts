import { z } from "zod";

import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { withRequestTrace } from "@/lib/server/logger";
import {
  ChargeOrderError,
  closeAlipayChargeOrder,
  getChargeOrderForUser,
  toChargeOrderStatusView,
} from "@/lib/server/payment/charge-orders";
import { jsonError, jsonOk } from "@/lib/server/response";
import { closeAlipayOrderPayloadSchema } from "@/lib/validation/payment";

export async function POST(request: Request) {
  return withRequestTrace(request, async () => {
    const body = await request.json().catch(() => null);

    try {
      const parsed = closeAlipayOrderPayloadSchema.parse(body);
      const session = await resolveSessionContext({ createAccountIfMissing: true });
      const order = await getChargeOrderForUser({
        userId: session.user.id,
        outTradeNo: parsed.outTradeNo,
      });
      const status = order.status.toLowerCase();

      if (status === "success") {
        return jsonError(400, "订单已支付成功，无法关闭");
      }

      if (status === "failed") {
        return jsonError(400, "订单已失败，无需关闭");
      }

      if (status === "closed") {
        const view = toChargeOrderStatusView(order);
        return jsonOk({
          chargeOrderId: view.chargeOrderId,
          outTradeNo: view.outTradeNo,
          amount: view.amount,
          status: view.status,
        });
      }

      const closeResult = await closeAlipayChargeOrder({
        outTradeNo: order.outTradeNo,
        closedBy: String(session.user.id),
      });

      const latestOrder = await getChargeOrderForUser({
        userId: session.user.id,
        outTradeNo: order.outTradeNo,
      });
      const view = toChargeOrderStatusView(latestOrder);

      return jsonOk({
        chargeOrderId: view.chargeOrderId,
        outTradeNo: view.outTradeNo,
        amount: view.amount,
        status: view.status,
        closePending: closeResult.status === "pending",
        closePendingReason:
          closeResult.status === "pending" ? closeResult.reason : undefined,
        message:
          closeResult.status === "pending"
            ? "关闭请求已提交，平台确认中。当前订单状态会继续自动同步。"
            : undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return jsonError(400, "参数错误");
      }
      if (error instanceof AuthSessionError) {
        return jsonError(error.status, error.message);
      }
      if (error instanceof ChargeOrderError) {
        return jsonError(error.status, error.message);
      }
      return jsonError(500, (error as Error).message ?? "关闭订单失败");
    }
  });
}

export const runtime = "nodejs";
