import QRCode from "qrcode";

import { businessPrisma } from "@/lib/db/business";
import { env } from "@/lib/env";
import { fenToYuan, yuanToFen, yuanToFenNumber } from "@/lib/money";
import { childLogger, getTraceId } from "@/lib/server/logger";
import {
  type AlipayOrderStatus,
  closeAlipayOrder,
  isAlipayEnabled,
  isIgnorableAlipayCloseError,
  precreateAlipayOrder,
  queryAlipayOrderByOutTradeNo,
} from "@/lib/server/payment/alipay";
import {
  buildAlipayPublicConfig,
  DEFAULT_PAYMENT_PRESET_AMOUNTS,
  parsePaymentPresetAmounts,
  parsePaymentPublicConfig,
  resolvePaymentOrderTimeoutMinutes,
} from "@/lib/server/payment/payment-config";
import { applyAccountChange } from "@/lib/server/trademark-search/account-ledger";
import { toJsonSafe } from "@/lib/server/trademark-search/utils";
import type {
  ChargeOrderStatusView,
  ChargeOrderView,
  PaymentConfigView,
  TransactionView,
} from "@/lib/types/payment";
import type { Prisma } from "@/prisma/generated/business/client";
import {
  ChargeOrderStatus,
  PaymentConfigStatus,
  PaymentMethod,
  PaymentProvider,
  TransactionType,
} from "@/prisma/generated/business/enums";

import "server-only";

const paymentOrderLogger = childLogger({
  domain: "payment",
  component: "charge-orders",
});

const toSafeBigInt = (value: bigint | number) =>
  typeof value === "bigint" ? value : BigInt(value);

const normalizeJsonObject = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }
  return value as Record<string, unknown>;
};

const buildOutTradeNo = (userId: number) => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ALI${Date.now()}${userId}${random}`;
};

type ChargeOrderBaseRecord = {
  id: number;
  outTradeNo: string;
  amount: bigint | number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  expireTime: Date | null;
  externalTransactionId: string | null;
};

type ChargeOrderListRecord = ChargeOrderBaseRecord & {
  provider: string;
};

type ChargeOrderSyncClaim = {
  id: number;
  outTradeNo: string;
};

type PaymentJobOptions = {
  limit?: number;
  traceId?: string;
};

type PaymentSyncStatus = "success" | "closed" | "pending";

type PaymentSyncOutcome = {
  orderId: number;
  outTradeNo: string;
  status: PaymentSyncStatus;
};

export function toChargeOrderStatusView(
  order: ChargeOrderBaseRecord,
): ChargeOrderStatusView {
  return {
    chargeOrderId: order.id,
    outTradeNo: order.outTradeNo,
    amount: fenToYuan(order.amount),
    status: order.status.toLowerCase(),
    paidAt: order.paidAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    expireAt: order.expireTime?.toISOString() ?? null,
    externalTransactionId: order.externalTransactionId,
  };
}

export function toChargeOrderListView(order: ChargeOrderListRecord): ChargeOrderView {
  return {
    id: order.id,
    outTradeNo: order.outTradeNo,
    amount: fenToYuan(order.amount),
    provider: order.provider.toLowerCase(),
    status: order.status.toLowerCase(),
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    expireAt: order.expireTime?.toISOString() ?? null,
    externalTransactionId: order.externalTransactionId,
  };
}

export class ChargeOrderError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class NonRetryablePaymentError extends Error {}

const getPaymentJobOptions = (
  value: number | PaymentJobOptions | undefined,
  fallbackLimit: number,
): Required<PaymentJobOptions> => {
  if (typeof value === "number") {
    return {
      limit: value,
      traceId: getTraceId(),
    };
  }

  return {
    limit: value?.limit ?? fallbackLimit,
    traceId: value?.traceId ?? getTraceId(),
  };
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const claimPendingAlipayOrders = async (
  limit: number,
): Promise<ChargeOrderSyncClaim[]> => {
  if (limit <= 0) {
    return [];
  }

  const processingStaleBefore = new Date(
    Date.now() - env.paymentOrderProcessingStaleSeconds * 1000,
  );

  return businessPrisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ChargeOrderSyncClaim[]>`
      SELECT id, outTradeNo
      FROM ChargeOrder
      WHERE provider = ${PaymentMethod.ALIPAY}
        AND (
          status = ${ChargeOrderStatus.PENDING}
          OR (status = ${ChargeOrderStatus.PROCESSING} AND updatedAt <= ${processingStaleBefore})
        )
      ORDER BY createdAt ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    if (!rows.length) {
      return [];
    }

    await tx.chargeOrder.updateMany({
      where: {
        id: { in: rows.map((row) => row.id) },
        status: {
          in: [ChargeOrderStatus.PENDING, ChargeOrderStatus.PROCESSING],
        },
      },
      data: {
        status: ChargeOrderStatus.PROCESSING,
      },
    });

    return rows;
  });
};

const claimExpiredAlipayOrders = async (
  limit: number,
): Promise<ChargeOrderSyncClaim[]> => {
  if (limit <= 0) {
    return [];
  }

  const now = new Date();
  const processingStaleBefore = new Date(
    Date.now() - env.paymentOrderProcessingStaleSeconds * 1000,
  );

  return businessPrisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ChargeOrderSyncClaim[]>`
      SELECT id, outTradeNo
      FROM ChargeOrder
      WHERE provider = ${PaymentMethod.ALIPAY}
        AND expireTime <= ${now}
        AND (
          status = ${ChargeOrderStatus.PENDING}
          OR (status = ${ChargeOrderStatus.PROCESSING} AND updatedAt <= ${processingStaleBefore})
        )
      ORDER BY expireTime ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    if (!rows.length) {
      return [];
    }

    await tx.chargeOrder.updateMany({
      where: {
        id: { in: rows.map((row) => row.id) },
        status: {
          in: [ChargeOrderStatus.PENDING, ChargeOrderStatus.PROCESSING],
        },
      },
      data: {
        status: ChargeOrderStatus.PROCESSING,
      },
    });

    return rows;
  });
};

const releaseProcessingOrder = async (id: number) => {
  await businessPrisma.chargeOrder.updateMany({
    where: {
      id,
      status: ChargeOrderStatus.PROCESSING,
    },
    data: {
      status: ChargeOrderStatus.PENDING,
    },
  });
};

export async function getEnabledPaymentConfig() {
  const config = await businessPrisma.paymentConfig.findFirst({
    where: {
      provider: PaymentProvider.ALIPAY,
      status: PaymentConfigStatus.ENABLED,
    },
    orderBy: { sortOrder: "asc" },
  });

  if (!config) {
    throw new ChargeOrderError(503, "支付宝支付暂不可用");
  }

  const publicConfig = parsePaymentPublicConfig(config.publicConfig);
  const presetAmounts = parsePaymentPresetAmounts(config.presetAmounts);

  return {
    config,
    view: {
      provider: "alipay",
      displayName: config.displayName,
      description: config.description ?? "",
      icon: config.icon ?? "",
      minAmount: config.minAmount,
      maxAmount: config.maxAmount,
      presetAmounts,
      orderTimeoutMinutes: resolvePaymentOrderTimeoutMinutes(
        publicConfig,
        env.paymentOrderTimeoutMinutes,
      ),
    } satisfies PaymentConfigView,
  };
}

export async function createAlipayChargeOrder(input: {
  userId: number;
  accountId: number;
  amountYuan: number;
  ip: string;
}) {
  if (!isAlipayEnabled()) {
    throw new ChargeOrderError(503, "支付宝支付暂不可用");
  }

  const { config, view } = await getEnabledPaymentConfig();

  if (input.amountYuan < config.minAmount || input.amountYuan > config.maxAmount) {
    throw new ChargeOrderError(
      400,
      `充值金额必须在 ${config.minAmount}-${config.maxAmount} 元之间`,
    );
  }

  const amountFen = yuanToFen(input.amountYuan);
  const outTradeNo = buildOutTradeNo(input.userId);
  const expireTime = new Date(Date.now() + view.orderTimeoutMinutes * 60 * 1000);

  const { qrCode } = await precreateAlipayOrder({
    outTradeNo,
    subject: `账户充值-${input.amountYuan}元`,
    totalAmountFen: amountFen,
    body: `用户充值 ¥${input.amountYuan}`,
    timeoutMinutes: view.orderTimeoutMinutes,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrCode, {
    margin: 1,
    width: 360,
  });

  const chargeOrder = await businessPrisma.chargeOrder.create({
    data: {
      accountId: input.accountId,
      paymentConfigId: config.id,
      amount: amountFen,
      provider: PaymentMethod.ALIPAY,
      outTradeNo,
      paymentCredential: toJsonSafe({
        alipay: {
          qrCode,
          qrCodeDataUrl,
        },
      }) as Prisma.InputJsonValue,
      status: ChargeOrderStatus.PENDING,
      expireTime,
      metadata: toJsonSafe({
        description: `支付宝充值 ¥${input.amountYuan}`,
        ip: input.ip,
      }) as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      outTradeNo: true,
      amount: true,
      expireTime: true,
    },
  });

  return {
    chargeOrderId: chargeOrder.id,
    outTradeNo: chargeOrder.outTradeNo,
    amount: fenToYuan(chargeOrder.amount),
    qrCode,
    qrCodeDataUrl,
    expireInSeconds: view.orderTimeoutMinutes * 60,
    expireAt: chargeOrder.expireTime?.toISOString() ?? expireTime.toISOString(),
  };
}

const setChargeOrderClosed = async (input: {
  outTradeNo: string;
  closedBy: string;
  reason: string;
}) => {
  return businessPrisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{
        id: number;
        status: string;
        metadata: unknown;
      }>
    >`
      SELECT id, status, metadata
      FROM ChargeOrder
      WHERE outTradeNo = ${input.outTradeNo}
      FOR UPDATE
    `;

    const row = rows[0];
    if (!row) {
      throw new ChargeOrderError(404, "订单不存在");
    }

    const status = row.status.toLowerCase();
    if (status === "success" || status === "closed" || status === "failed") {
      return {
        id: row.id,
        status,
      };
    }

    const metadata = normalizeJsonObject(row.metadata);

    const updated = await tx.chargeOrder.update({
      where: { id: row.id },
      data: {
        status: ChargeOrderStatus.CLOSED,
        metadata: toJsonSafe({
          ...metadata,
          closedAt: new Date().toISOString(),
          closedBy: input.closedBy,
          closeReason: input.reason,
        }) as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        status: true,
        outTradeNo: true,
      },
    });

    return {
      id: updated.id,
      outTradeNo: updated.outTradeNo,
      status: updated.status.toLowerCase(),
    };
  });
};

export async function closeAlipayChargeOrder(input: {
  outTradeNo: string;
  closedBy: string;
}) {
  const reconcileByQuery = async () => {
    const queried = await queryAlipayAndSyncChargeOrder(input.outTradeNo);
    const tradeStatus = queried.tradeStatus.toUpperCase();

    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      return {
        status: "success" as const,
        outTradeNo: input.outTradeNo,
      };
    }

    if (tradeStatus === "TRADE_CLOSED") {
      return {
        status: "closed" as const,
        outTradeNo: input.outTradeNo,
      };
    }

    return null;
  };

  // 先查询平台状态，避免“平台已支付但本地未更新”时误触发关单。
  try {
    const preCheck = await reconcileByQuery();
    if (preCheck) {
      return preCheck;
    }
  } catch {
    // 查询失败时不阻塞关单流程，后续继续尝试关闭并在失败时再次对账。
  }

  try {
    await closeAlipayOrder(input.outTradeNo);
  } catch (error) {
    const message = (error as Error).message ?? "";
    if (isIgnorableAlipayCloseError(message)) {
      return setChargeOrderClosed({
        outTradeNo: input.outTradeNo,
        closedBy: input.closedBy,
        reason: "manual_or_system_close",
      });
    }

    // 关闭失败时做一次兜底对账，规避支付状态竞争窗口。
    try {
      const reconciled = await reconcileByQuery();
      if (reconciled) {
        return reconciled;
      }
    } catch {
      // ignore and rethrow original close error below
    }

    throw error;
  }

  return setChargeOrderClosed({
    outTradeNo: input.outTradeNo,
    closedBy: input.closedBy,
    reason: "manual_or_system_close",
  });
}

const parseAlipayAmountToFen = (amount: string) => {
  const parsed = Number.parseFloat(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("支付宝返回的金额无效");
  }
  return yuanToFen(parsed);
};

export async function finalizeAlipaySuccess(input: {
  outTradeNo: string;
  tradeNo: string;
  totalAmount: string;
  paidAt?: string;
  payload: Record<string, unknown>;
  source: "notify" | "query" | "cron";
}) {
  const expectedAmount = parseAlipayAmountToFen(input.totalAmount);

  return businessPrisma.$transaction(async (tx) => {
    const orderRows = await tx.$queryRaw<
      Array<{
        id: number;
        accountId: number;
        amount: bigint | number;
        status: string;
        metadata: unknown;
      }>
    >`
      SELECT id, accountId, amount, status, metadata
      FROM ChargeOrder
      WHERE outTradeNo = ${input.outTradeNo}
      FOR UPDATE
    `;

    const orderRow = orderRows[0];
    if (!orderRow) {
      throw new ChargeOrderError(404, "订单不存在");
    }

    const orderAmount = toSafeBigInt(orderRow.amount);
    if (orderAmount !== expectedAmount) {
      throw new Error("支付金额不匹配");
    }

    const status = orderRow.status.toLowerCase();
    if (status === "success") {
      return {
        orderId: orderRow.id,
        status,
      };
    }

    if (status === "closed" || status === "failed") {
      throw new NonRetryablePaymentError(`订单已处于终态: ${status}`);
    }

    if (!["pending", "processing"].includes(status)) {
      throw new Error(`订单状态异常: ${orderRow.status}`);
    }

    const accountRows = await tx.$queryRaw<
      Array<{ id: number; userId: number }>
    >`
      SELECT id, userId
      FROM Account
      WHERE id = ${orderRow.accountId}
      FOR UPDATE
    `;

    const accountRow = accountRows[0];
    if (!accountRow) {
      throw new Error("账户不存在");
    }

    const ledger = await applyAccountChange(tx, {
      userId: accountRow.userId,
      accountId: accountRow.id,
      type: TransactionType.RECHARGE,
      delta: orderAmount,
      description: "支付宝充值",
      bizId: `charge-order:${orderRow.id}`,
      metadata: toJsonSafe({
        outTradeNo: input.outTradeNo,
        tradeNo: input.tradeNo,
        source: input.source,
      }) as Prisma.InputJsonValue,
    });

    const metadata = normalizeJsonObject(orderRow.metadata);

    await tx.chargeOrder.update({
      where: { id: orderRow.id },
      data: {
        status: ChargeOrderStatus.SUCCESS,
        externalTransactionId: input.tradeNo,
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        transactionId: ledger.transactionId,
        metadata: toJsonSafe({
          ...metadata,
          alipayCallback: input.payload,
          syncedBy: input.source,
        }) as Prisma.InputJsonValue,
      },
    });

    return {
      orderId: orderRow.id,
      transactionId: ledger.transactionId.toString(),
      status: "success",
    };
  });
}

const syncChargeOrderFromAlipay = async (
  order: ChargeOrderSyncClaim,
): Promise<PaymentSyncOutcome> => {
  const alipayOrder = await queryAlipayOrderByOutTradeNo(order.outTradeNo);
  const tradeStatus = alipayOrder.tradeStatus.toUpperCase();

  if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
    await finalizeAlipaySuccess({
      outTradeNo: order.outTradeNo,
      tradeNo: alipayOrder.tradeNo,
      totalAmount: alipayOrder.totalAmount,
      paidAt: alipayOrder.sendPayDate,
      payload: toJsonSafe(alipayOrder) as Record<string, unknown>,
      source: "cron",
    });
    return {
      orderId: order.id,
      outTradeNo: order.outTradeNo,
      status: "success",
    };
  }

  if (tradeStatus === "TRADE_CLOSED") {
    await setChargeOrderClosed({
      outTradeNo: order.outTradeNo,
      closedBy: "system",
      reason: "alipay_trade_closed",
    });
    return {
      orderId: order.id,
      outTradeNo: order.outTradeNo,
      status: "closed",
    };
  }

  await releaseProcessingOrder(order.id);

  return {
    orderId: order.id,
    outTradeNo: order.outTradeNo,
    status: "pending",
  };
};

export async function syncPendingAlipayOrders(
  options: number | PaymentJobOptions = env.paymentOrderSyncBatchSize,
) {
  const startedAt = Date.now();
  const job = getPaymentJobOptions(options, env.paymentOrderSyncBatchSize);
  const items = await claimPendingAlipayOrders(job.limit);
  let releasedAfterFailure = 0;

  const results = await Promise.allSettled(
    items.map(async (item) => {
      try {
        return await syncChargeOrderFromAlipay(item);
      } catch (error) {
        try {
          await releaseProcessingOrder(item.id);
          releasedAfterFailure += 1;
        } catch (releaseError) {
          paymentOrderLogger.error({
            event: "payment.sync.release-failed",
            traceId: job.traceId,
            orderId: item.id,
            outTradeNo: item.outTradeNo,
            error: getErrorMessage(releaseError),
          });
        }

        paymentOrderLogger.error({
          event: "payment.sync.order-failed",
          traceId: job.traceId,
          orderId: item.id,
          outTradeNo: item.outTradeNo,
          error: getErrorMessage(error),
        });

        throw error;
      }
    }),
  );

  const fulfilled = results
    .filter((item): item is PromiseFulfilledResult<PaymentSyncOutcome> => item.status === "fulfilled")
    .map((item) => item.value);
  const failed = results.filter((item) => item.status === "rejected").length;
  const statusSummary = {
    success: fulfilled.filter((item) => item.status === "success").length,
    closed: fulfilled.filter((item) => item.status === "closed").length,
    pending: fulfilled.filter((item) => item.status === "pending").length,
  };

  return {
    traceId: job.traceId,
    total: items.length,
    claimed: items.length,
    processed: results.length,
    success: fulfilled.length,
    failed,
    released: statusSummary.pending + releasedAfterFailure,
    statusSummary,
    durationMs: Date.now() - startedAt,
  };
}

export async function closeExpiredPendingOrders(
  options: number | PaymentJobOptions = env.paymentOrderCloseBatchSize,
) {
  const startedAt = Date.now();
  const job = getPaymentJobOptions(options, env.paymentOrderCloseBatchSize);
  const expired = await claimExpiredAlipayOrders(job.limit);
  let releasedAfterFailure = 0;

  const results = await Promise.allSettled(
    expired.map(async (item) => {
      try {
        return await closeAlipayChargeOrder({
          outTradeNo: item.outTradeNo,
          closedBy: "system",
        });
      } catch (error) {
        try {
          await releaseProcessingOrder(item.id);
          releasedAfterFailure += 1;
        } catch (releaseError) {
          paymentOrderLogger.error({
            event: "payment.close.release-failed",
            traceId: job.traceId,
            orderId: item.id,
            outTradeNo: item.outTradeNo,
            error: getErrorMessage(releaseError),
          });
        }

        paymentOrderLogger.error({
          event: "payment.close.order-failed",
          traceId: job.traceId,
          orderId: item.id,
          outTradeNo: item.outTradeNo,
          error: getErrorMessage(error),
        });

        throw error;
      }
    }),
  );

  const fulfilled: unknown[] = [];
  for (const item of results) {
    if (item.status === "fulfilled") {
      fulfilled.push(item.value);
    }
  }
  const failed = results.filter((item) => item.status === "rejected").length;
  const statusSummary = {
    success: 0,
    closed: 0,
    failed: 0,
    other: 0,
  };

  for (const item of fulfilled) {
    const status = typeof item === "object" && item ? (item as { status?: string }).status : "";
    if (status === "success") {
      statusSummary.success += 1;
    } else if (status === "closed") {
      statusSummary.closed += 1;
    } else if (status === "failed") {
      statusSummary.failed += 1;
    } else {
      statusSummary.other += 1;
    }
  }

  return {
    traceId: job.traceId,
    total: expired.length,
    claimed: expired.length,
    processed: results.length,
    success: fulfilled.length,
    failed,
    released: releasedAfterFailure,
    statusSummary,
    durationMs: Date.now() - startedAt,
  };
}

export async function getChargeOrderForUser(input: {
  userId: number;
  outTradeNo?: string;
  chargeOrderId?: number;
}) {
  const where: Prisma.ChargeOrderWhereInput = input.outTradeNo
    ? { outTradeNo: input.outTradeNo }
    : { id: input.chargeOrderId };

  const order = await businessPrisma.chargeOrder.findFirst({
    where,
    include: {
      account: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!order) {
    throw new ChargeOrderError(404, "订单不存在");
  }

  if (order.account.userId !== input.userId) {
    throw new ChargeOrderError(403, "无权限访问此订单");
  }

  return order;
}

export async function listChargeOrdersByAccount(accountId: number, limit = 50) {
  const items = await businessPrisma.chargeOrder.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      outTradeNo: true,
      amount: true,
      provider: true,
      status: true,
      createdAt: true,
      paidAt: true,
      expireTime: true,
      externalTransactionId: true,
    },
  });

  return items.map((item) =>
    toChargeOrderListView({
      id: item.id,
      outTradeNo: item.outTradeNo,
      amount: item.amount,
      provider: item.provider,
      status: item.status,
      createdAt: item.createdAt,
      paidAt: item.paidAt,
      expireTime: item.expireTime,
      externalTransactionId: item.externalTransactionId,
    }),
  ) satisfies ChargeOrderView[];
}

export async function listTransactionsByUser(
  userId: number,
  options: {
    limit?: number;
    kind?: "all" | "recharge" | "expense";
  } = {},
) {
  const where: Prisma.TransactionWhereInput = { userId };
  if (options.kind === "recharge") {
    where.type = TransactionType.RECHARGE;
  } else if (options.kind === "expense") {
    where.type = TransactionType.SEARCH_DEBIT;
  }

  const items = await businessPrisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options.limit ?? 100,
    select: {
      id: true,
      type: true,
      amount: true,
      balanceBefore: true,
      balanceAfter: true,
      description: true,
      bizId: true,
      createdAt: true,
    },
  });

  return items.map((item) => ({
    id: item.id.toString(),
    type: item.type,
    amount: fenToYuan(item.amount),
    balanceBefore: fenToYuan(item.balanceBefore),
    balanceAfter: fenToYuan(item.balanceAfter),
    description: item.description ?? "",
    bizId: item.bizId ?? "",
    createdAt: item.createdAt.toISOString(),
  })) satisfies TransactionView[];
}

export async function queryAlipayAndSyncChargeOrder(outTradeNo: string) {
  const alipayOrder = await queryAlipayOrderByOutTradeNo(outTradeNo);

  const tradeStatus = alipayOrder.tradeStatus.toUpperCase();
  if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
    await finalizeAlipaySuccess({
      outTradeNo,
      tradeNo: alipayOrder.tradeNo,
      totalAmount: alipayOrder.totalAmount,
      paidAt: alipayOrder.sendPayDate,
      payload: toJsonSafe(alipayOrder) as Record<string, unknown>,
      source: "query",
    });
  } else if (tradeStatus === "TRADE_CLOSED") {
    await setChargeOrderClosed({
      outTradeNo,
      closedBy: "system",
      reason: "query_detect_closed",
    });
  }

  return alipayOrder;
}

export async function upsertDefaultPaymentConfig() {
  const presetAmounts = [...DEFAULT_PAYMENT_PRESET_AMOUNTS];
  const appId = env.alipayAppId ?? "";
  const enabled = isAlipayEnabled();
  const publicConfig = buildAlipayPublicConfig({
    orderTimeoutMinutes: env.paymentOrderTimeoutMinutes,
    appId,
  });

  return businessPrisma.paymentConfig.upsert({
    where: { provider: PaymentProvider.ALIPAY },
    create: {
      provider: PaymentProvider.ALIPAY,
      displayName: "支付宝",
      description: "支付宝扫码支付",
      icon: "zhifubao",
      status: enabled ? PaymentConfigStatus.ENABLED : PaymentConfigStatus.DISABLED,
      sortOrder: 10,
      presetAmounts: toJsonSafe(presetAmounts) as Prisma.InputJsonValue,
      minAmount: 1,
      maxAmount: 100000,
      publicConfig: toJsonSafe(publicConfig) as Prisma.InputJsonValue,
    },
    update: {
      displayName: "支付宝",
      description: "支付宝扫码支付",
      icon: "zhifubao",
      status: enabled ? PaymentConfigStatus.ENABLED : PaymentConfigStatus.DISABLED,
      presetAmounts: toJsonSafe(presetAmounts) as Prisma.InputJsonValue,
      minAmount: 1,
      maxAmount: 100000,
      publicConfig: toJsonSafe(publicConfig) as Prisma.InputJsonValue,
    },
  });
}

export function parseChargeOrderId(raw: string | null) {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function parseRechargeAmount(raw: unknown) {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new ChargeOrderError(400, "金额格式错误");
  }

  const fen = yuanToFenNumber(raw);
  if (fen <= 0) {
    throw new ChargeOrderError(400, "充值金额必须大于 0");
  }

  return raw;
}

export function asAlipayPayload(order: AlipayOrderStatus) {
  return {
    trade_no: order.tradeNo,
    trade_status: order.tradeStatus,
    total_amount: order.totalAmount,
    buyer_pay_amount: order.buyerPayAmount,
    receipt_amount: order.receiptAmount,
    buyer_logon_id: order.buyerLogonId,
    buyer_id: order.buyerId,
    buyer_open_id: order.buyerOpenId,
    send_pay_date: order.sendPayDate,
    subject: order.subject,
    body: order.body,
  };
}
