import { businessPrisma } from "@/lib/db/business";
import { fenToYuan, yuanToFen } from "@/lib/money";
import { withAdminJobLock } from "@/lib/server/admin/job-lock";
import { childLogger, createTraceId, getTraceId, serializeError, withTraceContext } from "@/lib/server/logger";
import { applyAccountChange } from "@/lib/server/trademark-search/account-ledger";
import { toJsonSafe } from "@/lib/server/trademark-search/utils";
import type {
  AdminAccountAdjustmentResult,
  AdminUserView,
  AutoCreditRuleView,
} from "@/lib/types";
import type { Prisma } from "@/prisma/generated/business/client";
import { TransactionType } from "@/prisma/generated/business/enums";

import "server-only";

const adminLogger = childLogger({
  domain: "admin",
  component: "service",
});

const AUTO_CREDIT_BATCH_SIZE = 100;
const AUTO_CREDIT_JOB_LOCK = "admin:auto-credit:job";
const DAY_MS = 24 * 60 * 60 * 1000;

const displayNameOfUser = (user: {
  username: string | null;
  phone: string | null;
}) => user.username?.trim() || user.phone?.trim() || null;

const mapAdminUser = (user: {
  id: number;
  username: string | null;
  phone: string | null;
  avatar: string;
  isAdmin: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  account: {
    balance: bigint;
  } | null;
}): AdminUserView => ({
  id: user.id,
  username: user.username,
  phone: user.phone,
  avatar: user.avatar,
  isAdmin: user.isAdmin,
  isBlacklisted: user.isBlacklisted,
  blacklistReason: user.blacklistReason,
  balance: fenToYuan(user.account?.balance ?? BigInt(0)),
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

const mapAutoCreditRule = (rule: {
  id: number;
  name: string;
  intervalDays: number;
  amount: bigint;
  enabled: boolean;
  lastExecutedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    username: string | null;
    phone: string | null;
  } | null;
  updatedBy: {
    username: string | null;
    phone: string | null;
  } | null;
}): AutoCreditRuleView => ({
  id: rule.id,
  name: rule.name,
  intervalDays: rule.intervalDays,
  amount: fenToYuan(rule.amount),
  enabled: rule.enabled,
  lastExecutedAt: rule.lastExecutedAt?.toISOString() ?? null,
  createdAt: rule.createdAt.toISOString(),
  updatedAt: rule.updatedAt.toISOString(),
  createdByName: rule.createdBy ? displayNameOfUser(rule.createdBy) : null,
  updatedByName: rule.updatedBy ? displayNameOfUser(rule.updatedBy) : null,
});

const getUserWithAccountOrThrow = async (
  tx: Prisma.TransactionClient,
  userId: number,
): Promise<{
  id: number;
  username: string | null;
  phone: string | null;
  avatar: string;
  isAdmin: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  account: {
    id: number;
    userId: number;
    balance: bigint;
  };
}> => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      phone: true,
      avatar: true,
      isAdmin: true,
      isBlacklisted: true,
      blacklistReason: true,
      createdAt: true,
      updatedAt: true,
      account: {
        select: {
          id: true,
          userId: true,
          balance: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("用户不存在");
  }
  if (!user.account) {
    throw new Error("目标用户账户不存在");
  }

  return {
    ...user,
    account: user.account,
  };
};

export async function listAdminUsers(keyword?: string) {
  const normalized = keyword?.trim();
  const users = await businessPrisma.user.findMany({
    where: normalized
      ? {
          OR: [
            { phone: { contains: normalized } },
            { username: { contains: normalized } },
          ],
        }
      : undefined,
    orderBy: [{ isAdmin: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      username: true,
      phone: true,
      avatar: true,
      isAdmin: true,
      isBlacklisted: true,
      blacklistReason: true,
      createdAt: true,
      updatedAt: true,
      account: {
        select: {
          balance: true,
        },
      },
    },
  });

  return users.map(mapAdminUser);
}

export async function updateUserAdminRole(
  userId: number,
  isAdmin: boolean,
  operatorId: number,
) {
  if (userId === operatorId && !isAdmin) {
    throw new Error("不能取消自己的管理员权限");
  }

  const updated = await businessPrisma.user.update({
    where: { id: userId },
    data: { isAdmin },
    select: {
      id: true,
      username: true,
      phone: true,
      avatar: true,
      isAdmin: true,
      isBlacklisted: true,
      blacklistReason: true,
      createdAt: true,
      updatedAt: true,
      account: {
        select: {
          balance: true,
        },
      },
    },
  });

  return mapAdminUser(updated);
}

export async function updateUserBlacklistStatus(
  userId: number,
  input: {
    isBlacklisted: boolean;
    reason?: string;
  },
  operatorId: number,
) {
  if (userId === operatorId && input.isBlacklisted) {
    throw new Error("不能将自己加入黑名单");
  }

  const updated = await businessPrisma.user.update({
    where: { id: userId },
    data: {
      isBlacklisted: input.isBlacklisted,
      blacklistReason: input.isBlacklisted ? input.reason?.trim() || "管理员手动拉黑" : null,
    },
    select: {
      id: true,
      username: true,
      phone: true,
      avatar: true,
      isAdmin: true,
      isBlacklisted: true,
      blacklistReason: true,
      createdAt: true,
      updatedAt: true,
      account: {
        select: {
          balance: true,
        },
      },
    },
  });

  return mapAdminUser(updated);
}

const buildAdjustmentDelta = (
  action: "add" | "subtract" | "reset",
  amountYuan: number | undefined,
  currentBalance: bigint,
) => {
  if (action === "reset") {
    if (currentBalance <= 0) {
      throw new Error("账户余额已经为 0");
    }
    return -currentBalance;
  }

  const delta = yuanToFen(amountYuan ?? 0);
  if (action === "subtract") {
    return -delta;
  }
  return delta;
};

export async function adjustUserAccountBalance(
  userId: number,
  input: {
    action: "add" | "subtract" | "reset";
    amount?: number;
    reason: string;
  },
  operatorId: number,
): Promise<AdminAccountAdjustmentResult> {
  return businessPrisma.$transaction(async (tx) => {
    const user = await getUserWithAccountOrThrow(tx, userId);
    const delta = buildAdjustmentDelta(
      input.action,
      input.amount,
      user.account.balance,
    );
    const transaction = await applyAccountChange(tx, {
      userId: user.id,
      accountId: user.account.id,
      type: TransactionType.ADMIN_ADJUSTMENT,
      delta,
      description: input.reason,
      metadata: toJsonSafe({
        source: "admin-console",
        action: input.action,
        operatorId,
      }) as Prisma.InputJsonValue,
    });

    const updatedUser = await getUserWithAccountOrThrow(tx, userId);

    return {
      user: mapAdminUser(updatedUser),
      transaction: {
        id: transaction.transactionId.toString(),
        amount: fenToYuan(delta),
        balanceBefore: fenToYuan(transaction.balanceBefore),
        balanceAfter: fenToYuan(transaction.balanceAfter),
        type: TransactionType.ADMIN_ADJUSTMENT,
        description: input.reason,
        createdAt: new Date().toISOString(),
      },
    };
  });
}

export async function listAutoCreditRules() {
  const rules = await businessPrisma.autoCreditRule.findMany({
    orderBy: [{ enabled: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      intervalDays: true,
      amount: true,
      enabled: true,
      lastExecutedAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          username: true,
          phone: true,
        },
      },
      updatedBy: {
        select: {
          username: true,
          phone: true,
        },
      },
    },
  });

  return rules.map(mapAutoCreditRule);
}

export async function createAutoCreditRule(
  input: {
    name: string;
    intervalDays: number;
    amount: number;
    enabled: boolean;
  },
  operatorId: number,
) {
  const rule = await businessPrisma.autoCreditRule.create({
    data: {
      name: input.name.trim(),
      intervalDays: input.intervalDays,
      amount: yuanToFen(input.amount),
      enabled: input.enabled,
      createdById: operatorId,
      updatedById: operatorId,
    },
    select: {
      id: true,
      name: true,
      intervalDays: true,
      amount: true,
      enabled: true,
      lastExecutedAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          username: true,
          phone: true,
        },
      },
      updatedBy: {
        select: {
          username: true,
          phone: true,
        },
      },
    },
  });

  return mapAutoCreditRule(rule);
}

export async function updateAutoCreditRule(
  ruleId: number,
  input: {
    name?: string;
    intervalDays?: number;
    amount?: number;
    enabled?: boolean;
  },
  operatorId: number,
) {
  const data: Prisma.AutoCreditRuleUpdateInput = {
    updatedBy: {
      connect: { id: operatorId },
    },
  };

  if (typeof input.name === "string") {
    data.name = input.name.trim();
  }
  if (typeof input.intervalDays === "number") {
    data.intervalDays = input.intervalDays;
  }
  if (typeof input.amount === "number") {
    data.amount = yuanToFen(input.amount);
  }
  if (typeof input.enabled === "boolean") {
    data.enabled = input.enabled;
  }

  const rule = await businessPrisma.autoCreditRule.update({
    where: { id: ruleId },
    data,
    select: {
      id: true,
      name: true,
      intervalDays: true,
      amount: true,
      enabled: true,
      lastExecutedAt: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          username: true,
          phone: true,
        },
      },
      updatedBy: {
        select: {
          username: true,
          phone: true,
        },
      },
    },
  });

  return mapAutoCreditRule(rule);
}

const shouldRunRule = (lastExecutedAt: Date | null, intervalDays: number, now: Date) => {
  if (!lastExecutedAt) {
    return true;
  }
  return now.getTime() - lastExecutedAt.getTime() >= intervalDays * DAY_MS;
};

const buildAutoCreditExecutionKey = (
  lastExecutedAt: Date | null,
  intervalDays: number,
) => {
  if (!lastExecutedAt) {
    return "initial";
  }

  return new Date(lastExecutedAt.getTime() + intervalDays * DAY_MS)
    .toISOString()
    .slice(0, 10);
};

const listEligibleUsersBatch = async (cursor?: number) => {
  return businessPrisma.user.findMany({
    where: {
      isBlacklisted: false,
    },
    take: AUTO_CREDIT_BATCH_SIZE,
    ...(typeof cursor === "number"
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
    orderBy: { id: "asc" },
    select: {
      id: true,
      account: {
        select: {
          id: true,
        },
      },
    },
  });
};

const isAutoCreditBizIdConflict = (error: unknown, bizId: string) => {
  const candidate = error as {
    code?: string;
    message?: string;
    meta?: {
      target?: unknown;
    };
  };

  if (candidate.code === "P2002") {
    const target = candidate.meta?.target;
    if (Array.isArray(target)) {
      return target.includes("bizId");
    }

    return String(target ?? "").includes("bizId");
  }

  return (candidate.message ?? "").includes(bizId);
};

const applyAutoCreditToUser = async (
  rule: {
    id: number;
    name: string;
    intervalDays: number;
    amount: bigint;
    lastExecutedAt: Date | null;
  },
  user: { id: number; account: { id: number } | null },
  executionKey: string,
  now: Date,
) => {
  if (!user.account) {
    return {
      awarded: false,
      skippedBlacklisted: 0,
    };
  }

  const bizId = `auto-credit:${rule.id}:${user.id}:${executionKey}`;

  return businessPrisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: user.id },
      select: {
        isBlacklisted: true,
        account: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!currentUser?.account) {
      return {
        awarded: false,
        skippedBlacklisted: 0,
      };
    }

    if (currentUser.isBlacklisted) {
      return {
        awarded: false,
        skippedBlacklisted: 1,
      };
    }

    try {
      await applyAccountChange(tx, {
        userId: user.id,
        accountId: currentUser.account.id,
        type: TransactionType.AUTO_CREDIT,
        delta: rule.amount,
        bizId,
        description: `自动加钱规则: ${rule.name}`,
        metadata: toJsonSafe({
          source: "auto-credit-rule",
          ruleId: rule.id,
          executionKey,
          executedAt: now.toISOString(),
        }) as Prisma.InputJsonValue,
      });

      return {
        awarded: true,
        skippedBlacklisted: 0,
      };
    } catch (error) {
      if (isAutoCreditBizIdConflict(error, bizId)) {
        return {
          awarded: false,
          skippedBlacklisted: 0,
        };
      }

      throw error;
    }
  });
};

const applyAutoCreditForRule = async (
  rule: {
    id: number;
    name: string;
    intervalDays: number;
    amount: bigint;
    enabled: boolean;
    lastExecutedAt: Date | null;
  },
  now: Date,
) => {
  if (!rule.enabled || !shouldRunRule(rule.lastExecutedAt, rule.intervalDays, now)) {
    return {
      executed: false,
      awarded: 0,
      skippedBlacklisted: 0,
    };
  }

  const executionKey = buildAutoCreditExecutionKey(
    rule.lastExecutedAt,
    rule.intervalDays,
  );
  let cursor: number | undefined;
  let awarded = 0;
  let skippedBlacklisted = 0;

  while (true) {
    const users = await listEligibleUsersBatch(cursor);

    if (!users.length) {
      break;
    }

    for (const user of users) {
      const result = await applyAutoCreditToUser(rule, user, executionKey, now);
      if (result.awarded) {
        awarded += 1;
      }
      skippedBlacklisted += result.skippedBlacklisted;
    }

    cursor = users[users.length - 1]?.id;
  }

  await businessPrisma.autoCreditRule.update({
    where: { id: rule.id },
    data: {
      lastExecutedAt: now,
    },
  });

  return {
    executed: true,
    awarded,
    skippedBlacklisted,
  };
};

export async function executeAutoCreditRulesJob() {
  const traceId = getTraceId() || createTraceId();
  return withTraceContext({ traceId, source: "scheduler" }, async () => {
    const startedAt = Date.now();
    const now = new Date();

    try {
      const locked = await withAdminJobLock(AUTO_CREDIT_JOB_LOCK, async () => {
        const rules = await businessPrisma.autoCreditRule.findMany({
          where: { enabled: true },
          select: {
            id: true,
            name: true,
            intervalDays: true,
            amount: true,
            enabled: true,
            lastExecutedAt: true,
          },
        });

        let executedRules = 0;
        let awardedUsers = 0;
        let skippedBlacklisted = 0;
        let failedRules = 0;

        for (const rule of rules) {
          try {
            const result = await applyAutoCreditForRule(rule, now);
            if (result.executed) {
              executedRules += 1;
            }
            awardedUsers += result.awarded;
            skippedBlacklisted += result.skippedBlacklisted;
          } catch (error) {
            failedRules += 1;
            adminLogger.error(
              {
                job: "auto-credit",
                ruleId: rule.id,
                error: serializeError(error),
              },
              "admin.auto-credit.rule-error",
            );
          }
        }

        return {
          rules: rules.length,
          executedRules,
          awardedUsers,
          skippedBlacklisted,
          failedRules,
        };
      });

      if (!locked.acquired) {
        adminLogger.info(
          {
            job: "auto-credit",
            durationMs: Date.now() - startedAt,
          },
          "admin.auto-credit.lock-skipped",
        );

        return {
          rules: 0,
          executedRules: 0,
          awardedUsers: 0,
          skippedBlacklisted: 0,
          failedRules: 0,
          skippedByLock: true,
        };
      }

      const result = locked.result ?? {
        rules: 0,
        executedRules: 0,
        awardedUsers: 0,
        skippedBlacklisted: 0,
        failedRules: 0,
      };

      adminLogger.info(
        {
          job: "auto-credit",
          durationMs: Date.now() - startedAt,
          ...result,
        },
        "admin.auto-credit.finish",
      );

      return result;
    } catch (error) {
      adminLogger.error(
        {
          job: "auto-credit",
          durationMs: Date.now() - startedAt,
          error: serializeError(error),
        },
        "admin.auto-credit.error",
      );
      throw error;
    }
  });
}
