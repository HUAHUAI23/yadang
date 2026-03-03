import { z } from "zod";

import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { withRequestTrace } from "@/lib/server/logger";
import {
  ChargeOrderError,
  createAlipayChargeOrder,
  parseRechargeAmount,
} from "@/lib/server/payment/charge-orders";
import { ensurePaymentSchedulersStarted } from "@/lib/server/payment/scheduler";
import { jsonError, jsonOk } from "@/lib/server/response";
import { createAlipayOrderPayloadSchema } from "@/lib/validation/payment";

export async function POST(request: Request) {
  return withRequestTrace(request, async () => {
    const body = await request.json().catch(() => null);

    try {
      const parsed = createAlipayOrderPayloadSchema.parse(body);
      const session = await resolveSessionContext({ createAccountIfMissing: true });
      const amountYuan = parseRechargeAmount(parsed.amount);

      ensurePaymentSchedulersStarted();

      const result = await createAlipayChargeOrder({
        userId: session.user.id,
        accountId: session.account.id,
        amountYuan,
        ip:
          request.headers.get("x-forwarded-for") ??
          request.headers.get("x-real-ip") ??
          "",
      });

      return jsonOk(result);
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
      return jsonError(500, (error as Error).message ?? "创建订单失败");
    }
  });
}

export const runtime = "nodejs";
