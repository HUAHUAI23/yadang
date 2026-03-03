import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { withRequestTrace } from "@/lib/server/logger";
import {
  ChargeOrderError,
  getEnabledPaymentConfig,
  upsertDefaultPaymentConfig,
} from "@/lib/server/payment/charge-orders";
import { jsonError, jsonOk } from "@/lib/server/response";

export async function GET(request: Request) {
  return withRequestTrace(request, async () => {
    try {
      await resolveSessionContext({ createAccountIfMissing: true });
      await upsertDefaultPaymentConfig();

      try {
        const { view } = await getEnabledPaymentConfig();
        return jsonOk({
          available: true,
          payment: view,
        });
      } catch (error) {
        if (error instanceof ChargeOrderError && error.status === 503) {
          return jsonOk({
            available: false,
            payment: null,
            message: error.message,
          });
        }
        throw error;
      }
    } catch (error) {
      if (error instanceof AuthSessionError) {
        return jsonError(error.status, error.message);
      }
      if (error instanceof ChargeOrderError) {
        return jsonError(error.status, error.message);
      }
      return jsonError(500, (error as Error).message ?? "获取支付配置失败");
    }
  });
}

export const runtime = "nodejs";
