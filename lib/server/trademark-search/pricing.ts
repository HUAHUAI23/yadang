import { businessPrisma } from "@/lib/db/business";
import type { Prisma } from "@/prisma/generated/business/client";
import { SearchPriceCode } from "@/prisma/generated/business/enums";

import "server-only";

type DbClient = Prisma.TransactionClient | typeof businessPrisma;

export type EffectivePrice = {
  id: number;
  amount: bigint;
  code: SearchPriceCode;
  userId: number | null;
};

export async function getEffectiveSearchPrice(
  userId: number,
  db: DbClient = businessPrisma,
): Promise<EffectivePrice> {
  const userPrice = await db.searchPrice.findFirst({
    where: {
      code: SearchPriceCode.TRADEMARK_IMAGE_SEARCH,
      userId,
      enabled: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (userPrice) {
    return {
      id: userPrice.id,
      amount: userPrice.amount,
      code: userPrice.code,
      userId: userPrice.userId,
    };
  }

  const globalPrice = await db.searchPrice.findFirst({
    where: {
      code: SearchPriceCode.TRADEMARK_IMAGE_SEARCH,
      userId: null,
      enabled: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!globalPrice) {
    throw new Error("未配置全局搜索价格");
  }

  return {
    id: globalPrice.id,
    amount: globalPrice.amount,
    code: globalPrice.code,
    userId: globalPrice.userId,
  };
}
