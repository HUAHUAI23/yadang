import { AuthSessionError, resolveSessionContext } from "@/lib/auth/session";
import { RECHARGE_PACKAGES } from "@/lib/constants";
import { businessPrisma } from "@/lib/db/business";
import { jsonError, jsonOk } from "@/lib/server/response";
import { applyAccountChange } from "@/lib/server/trademark-search/account-ledger";
import { bigIntToNumber, toJsonSafe } from "@/lib/server/trademark-search/utils";
import { rechargePayloadSchema } from "@/lib/validation/search";
import type { Prisma } from "@/prisma/generated/business/client";
import { TransactionType } from "@/prisma/generated/business/enums";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = rechargePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "参数错误");
  }

  const pkg = RECHARGE_PACKAGES.find((item) => item.id === parsed.data.packageId);
  if (!pkg) {
    return jsonError(404, "充值套餐不存在");
  }

  try {
    const session = await resolveSessionContext({ createAccountIfMissing: true });
    const result = await businessPrisma.$transaction(async (tx) => {
      return applyAccountChange(tx, {
        userId: session.user.id,
        accountId: session.account.id,
        type: TransactionType.RECHARGE,
        delta: BigInt(pkg.credits),
        description: "账户充值",
        bizId: `recharge:${pkg.id}:${Date.now()}`,
        metadata: toJsonSafe({
          packageId: pkg.id,
          amount: pkg.amount,
          credits: pkg.credits,
        }) as Prisma.InputJsonValue,
      });
    });

    return jsonOk({
      packageId: pkg.id,
      amount: pkg.amount,
      credits: pkg.credits,
      balance: bigIntToNumber(result.balanceAfter),
    });
  } catch (error) {
    if (error instanceof AuthSessionError) {
      return jsonError(error.status, error.message);
    }
    return jsonError(500, (error as Error).message ?? "充值失败");
  }
}

export const runtime = "nodejs";
