import type { Prisma } from "@/prisma/generated/business/client";
import { TransactionType } from "@/prisma/generated/business/enums";

import "server-only";

const ZERO = BigInt(0);

type AccountChangeInput = {
  userId: number;
  accountId: number;
  type: TransactionType;
  delta: bigint;
  description?: string;
  bizId?: string;
  metadata?: Prisma.InputJsonValue;
};

type AccountChangeResult = {
  transactionId: bigint;
  balanceBefore: bigint;
  balanceAfter: bigint;
};

const toSafeBigInt = (value: bigint | number) => {
  if (typeof value === "bigint") return value;
  return BigInt(value);
};

export async function applyAccountChange(
  tx: Prisma.TransactionClient,
  input: AccountChangeInput,
): Promise<AccountChangeResult> {
  if (input.delta === ZERO) {
    throw new Error("账户变更金额不能为 0");
  }

  if (input.bizId) {
    const existed = await tx.transaction.findFirst({
      where: { bizId: input.bizId },
      select: {
        id: true,
        userId: true,
        accountId: true,
        type: true,
        amount: true,
        balanceBefore: true,
        balanceAfter: true,
      },
    });

    if (existed) {
      if (
        existed.userId !== input.userId ||
        existed.accountId !== input.accountId ||
        existed.type !== input.type ||
        existed.amount !== input.delta
      ) {
        throw new Error(`交易幂等键冲突: ${input.bizId}`);
      }

      return {
        transactionId: existed.id,
        balanceBefore: existed.balanceBefore,
        balanceAfter: existed.balanceAfter,
      };
    }
  }

  const rows = await tx.$queryRaw<Array<{ balance: bigint | number }>>`
    SELECT balance
    FROM Account
    WHERE id = ${input.accountId}
      AND userId = ${input.userId}
    FOR UPDATE
  `;

  const row = rows[0];
  if (!row) {
    throw new Error("账户不存在");
  }

  const balanceBefore = toSafeBigInt(row.balance);
  const balanceAfter = balanceBefore + input.delta;

  if (balanceAfter < ZERO) {
    throw new Error("余额不足");
  }

  await tx.account.update({
    where: { id: input.accountId },
    data: { balance: balanceAfter },
  });

  const transaction = await tx.transaction.create({
    data: {
      userId: input.userId,
      accountId: input.accountId,
      type: input.type,
      amount: input.delta,
      balanceBefore,
      balanceAfter,
      description: input.description,
      bizId: input.bizId,
      metadata: input.metadata,
    },
    select: { id: true },
  });

  return {
    transactionId: transaction.id,
    balanceBefore,
    balanceAfter,
  };
}
