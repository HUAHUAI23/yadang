import { Cron } from "croner";

import { env } from "@/lib/env";
import { executeAutoCreditRulesJob } from "@/lib/server/admin/service";
import {
  childLogger,
  createTraceId,
  serializeError,
  withTraceContext,
} from "@/lib/server/logger";
import {
  closeExpiredPendingOrders,
  syncPendingAlipayOrders,
} from "@/lib/server/payment/charge-orders";

import "server-only";

type PaymentSchedulerState = {
  started: boolean;
  jobs: Cron[];
};

type PaymentJobContext = {
  traceId: string;
};

const paymentSchedulerLogger = childLogger({
  domain: "payment",
  component: "scheduler",
});

const globalForScheduler = globalThis as unknown as {
  paymentSchedulerState?: PaymentSchedulerState;
};

const getState = () => {
  if (!globalForScheduler.paymentSchedulerState) {
    globalForScheduler.paymentSchedulerState = {
      started: false,
      jobs: [],
    };
  }

  return globalForScheduler.paymentSchedulerState;
};

const runSafely = async (
  name: "sync" | "close" | "auto-credit",
  handler: (context: PaymentJobContext) => Promise<Record<string, unknown>>,
) => {
  const traceId = createTraceId();
  const startedAt = Date.now();

  await withTraceContext({ traceId, source: "scheduler" }, async () => {
    paymentSchedulerLogger.info(
      {
        job: name,
        startedAt: new Date(startedAt).toISOString(),
      },
      "payment.job.start",
    );

    try {
      const result = await handler({ traceId });
      paymentSchedulerLogger.info(
        {
          job: name,
          durationMs: Date.now() - startedAt,
          ...result,
        },
        "payment.job.finish",
      );
    } catch (error) {
      paymentSchedulerLogger.error(
        {
          job: name,
          durationMs: Date.now() - startedAt,
          error: serializeError(error),
        },
        "payment.job.error",
      );
    }
  });
};

export const ensurePaymentSchedulersStarted = () => {
  const state = getState();
  if (state.started) {
    return;
  }

  if (!env.paymentSchedulerEnabled) {
    state.started = true;
    paymentSchedulerLogger.info("payment.scheduler.disabled");
    return;
  }

  const syncJob = new Cron(
    env.paymentOrderSyncCron,
    {
      name: "payment-sync-orders",
      protect: true,
    },
    () =>
      runSafely("sync", async ({ traceId }) => {
        const result = await syncPendingAlipayOrders({ traceId });
        return result;
      }),
  );

  const closeJob = new Cron(
    env.paymentOrderCloseCron,
    {
      name: "payment-close-expired-orders",
      protect: true,
    },
    () =>
      runSafely("close", async ({ traceId }) => {
        const result = await closeExpiredPendingOrders({ traceId });
        return result;
      }),
  );

  state.jobs.push(syncJob, closeJob);

  if (env.autoCreditSchedulerEnabled) {
    const autoCreditJob = new Cron(
      env.autoCreditRuleScanCron,
      {
        name: "admin-auto-credit",
        protect: true,
      },
      () =>
        runSafely("auto-credit", async () => {
          const result = await executeAutoCreditRulesJob();
          return result;
        }),
    );

    state.jobs.push(autoCreditJob);
  }

  state.started = true;
  paymentSchedulerLogger.info(
    {
      syncCron: env.paymentOrderSyncCron,
      closeCron: env.paymentOrderCloseCron,
      autoCreditCron: env.autoCreditRuleScanCron,
    },
    "payment.scheduler.started",
  );
};

export const stopPaymentSchedulers = () => {
  const state = getState();
  for (const job of state.jobs) {
    job.stop();
  }
  state.jobs = [];
  state.started = false;
};
