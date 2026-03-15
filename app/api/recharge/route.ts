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
import { createRechargeOrderPayloadSchema } from "@/lib/validation/payment";

const parseClientIp = (request: Request) =>
  request.headers.get("x-forwarded-for") ??
  request.headers.get("x-real-ip") ??
  "";

export async function POST(request: Request) {
  return withRequestTrace(request, async () => {
    const body = await request.json().catch(() => null);

    try {
      const parsed = createRechargeOrderPayloadSchema.parse(body);
      const session = await resolveSessionContext({ createAccountIfMissing: true });
      const amountYuan = parseRechargeAmount(parsed.amount);

      ensurePaymentSchedulersStarted();

      const result = await createAlipayChargeOrder({
        userId: session.user.id,
        accountId: session.account.id,
        amountYuan,
        ip: parseClientIp(request),
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
      return jsonError(500, (error as Error).message ?? "创建充值订单失败");
    }
  });
}

export const runtime = "nodejs";
