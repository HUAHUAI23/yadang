import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { fenToYuan } from "@/lib/money";
import { jsonError, jsonOk } from "@/lib/server/response";
import { getEffectiveSearchPrice } from "@/lib/server/trademark-search/pricing";

export async function GET() {
  try {
    const session = await resolveSessionContext({ createAccountIfMissing: true });
    const price = await getEffectiveSearchPrice(session.user.id);

    return jsonOk({
      code: price.code,
      amount: fenToYuan(price.amount),
      balance: fenToYuan(session.account.balance),
    });
  } catch (error) {
    if (error instanceof AuthSessionError) {
      return jsonError(error.status, error.message);
    }
    return jsonError(500, (error as Error).message ?? "获取价格失败");
  }
}

export const runtime = "nodejs";
