import { AlipaySdk } from "alipay-sdk";

import { env } from "@/lib/env";
import { fenToYuan } from "@/lib/money";
import { childLogger, serializeError } from "@/lib/server/logger";

import "server-only";

const SUCCESS_CODE = "10000";
const gatewayLogger = childLogger({
  domain: "payment",
  component: "alipay-gateway",
});

type AlipayConfig = {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
};

type AlipaySdkResult = {
  code?: string;
  msg?: string;
  subCode?: string;
  subMsg?: string;
  sub_code?: string;
  sub_msg?: string;
  traceId?: string;
  trace_id?: string;
  [key: string]: unknown;
};

export class AlipayGatewayError extends Error {
  code: string;
  subCode: string;

  constructor(message: string, input: { code?: string; subCode?: string }) {
    super(message);
    this.name = "AlipayGatewayError";
    this.code = input.code ?? "";
    this.subCode = input.subCode ?? "";
  }
}

const globalForAlipay = globalThis as unknown as {
  alipayClient?: AlipaySdk;
};

const withAppAuthToken = <T extends Record<string, unknown>>(
  payload: T,
): T & { appAuthToken?: string } => {
  const appAuthToken = env.alipayAppAuthToken;
  if (!appAuthToken) {
    return payload;
  }
  return {
    ...payload,
    appAuthToken,
  };
};

const getConfiguredKeys = (): AlipayConfig | null => {
  const appId = env.alipayAppId;
  const privateKey = env.alipayPrivateKey;
  const alipayPublicKey = env.alipayPublicKey;

  if (!appId || !privateKey || !alipayPublicKey) {
    return null;
  }

  return {
    appId,
    privateKey,
    alipayPublicKey,
  };
};

export const isAlipayEnabled = () => Boolean(getConfiguredKeys());

const getAlipayClient = () => {
  if (globalForAlipay.alipayClient) {
    return globalForAlipay.alipayClient;
  }

  const keys = getConfiguredKeys();
  if (!keys) {
    throw new Error("支付宝支付未配置");
  }

  const sdk = new AlipaySdk({
    appId: keys.appId,
    privateKey: keys.privateKey,
    alipayPublicKey: keys.alipayPublicKey,
    gateway: env.alipayGateway,
    signType: "RSA2",
    keyType: keys.privateKey.includes("BEGIN PRIVATE KEY") ? "PKCS8" : "PKCS1",
  });

  if (process.env.NODE_ENV !== "production") {
    globalForAlipay.alipayClient = sdk;
  }

  return sdk;
};

const normalizeResult = (result: AlipaySdkResult, action: string) => {
  const code = readString(result, "code");
  const gatewayMsg = readString(result, "msg");
  const subCode = readString(result, "subCode", "sub_code");
  const subMsg = readString(result, "subMsg", "sub_msg");
  const gatewayTraceId = readString(result, "traceId", "trace_id");

  if (result.code !== SUCCESS_CODE) {
    gatewayLogger.error(
      {
        action,
        code,
        gatewayMsg,
        subCode,
        subMsg,
        gatewayTraceId,
      },
      "payment.alipay.gateway-failed",
    );
    const message = subMsg || gatewayMsg || `${action}失败`;
    const suffix = [code ? `code=${code}` : "", subCode ? `subCode=${subCode}` : ""]
      .filter(Boolean)
      .join(", ");
    throw new AlipayGatewayError(suffix ? `${message} (${suffix})` : message, {
      code,
      subCode,
    });
  }

  return result;
};

const readString = (result: AlipaySdkResult, ...keys: string[]) => {
  for (const key of keys) {
    const value = result[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return "";
};

export type AlipayOrderStatus = {
  outTradeNo: string;
  tradeNo: string;
  tradeStatus: string;
  totalAmount: string;
  buyerPayAmount: string;
  receiptAmount: string;
  buyerLogonId: string;
  buyerId: string;
  buyerOpenId: string;
  sendPayDate: string;
  subject: string;
  body: string;
};

export function createAlipayPagePayment(input: {
  outTradeNo: string;
  subject: string;
  totalAmountFen: bigint;
  body?: string;
  timeoutMinutes: number;
  returnUrl?: string;
}) {
  const sdk = getAlipayClient();
  const notifyUrl = env.alipayNotifyUrl;
  const returnUrl = input.returnUrl ?? env.alipayReturnUrl;
  gatewayLogger.info(
    {
      action: "page-pay",
      outTradeNo: input.outTradeNo,
      timeoutMinutes: input.timeoutMinutes,
    },
    "payment.alipay.request",
  );

  try {
    const requestPayload = withAppAuthToken({
      ...(notifyUrl ? { notifyUrl } : {}),
      ...(returnUrl ? { returnUrl } : {}),
      bizContent: {
        out_trade_no: input.outTradeNo,
        total_amount: String(fenToYuan(input.totalAmountFen)),
        subject: input.subject,
        body: input.body,
        product_code: "FAST_INSTANT_TRADE_PAY",
        timeout_express: `${input.timeoutMinutes}m`,
        integration_type: "PCWEB",
      },
    });

    const paymentUrl = sdk.pageExecute("alipay.trade.page.pay", "GET", requestPayload);
    if (!paymentUrl) {
      throw new Error("支付宝返回的收银台地址为空");
    }
    gatewayLogger.info(
      {
        action: "page-pay",
        outTradeNo: input.outTradeNo,
      },
      "payment.alipay.response",
    );

    return {
      outTradeNo: input.outTradeNo,
      paymentUrl,
    };
  } catch (error) {
    gatewayLogger.error(
      {
        action: "page-pay",
        outTradeNo: input.outTradeNo,
        error: serializeError(error),
      },
      "payment.alipay.exception",
    );
    throw error;
  }
}

export async function queryAlipayOrderByOutTradeNo(outTradeNo: string) {
  const sdk = getAlipayClient();
  gatewayLogger.info(
    {
      action: "query",
      outTradeNo,
    },
    "payment.alipay.request",
  );

  try {
    const result = (await sdk.exec(
      "alipay.trade.query",
      withAppAuthToken({
        bizContent: {
          out_trade_no: outTradeNo,
        },
      }),
    )) as AlipaySdkResult;

    const normalized = normalizeResult(result, "查询订单");

    const response = {
      outTradeNo: readString(normalized, "outTradeNo", "out_trade_no") || outTradeNo,
      tradeNo: readString(normalized, "tradeNo", "trade_no"),
      tradeStatus: readString(normalized, "tradeStatus", "trade_status"),
      totalAmount: readString(normalized, "totalAmount", "total_amount"),
      buyerPayAmount: readString(normalized, "buyerPayAmount", "buyer_pay_amount"),
      receiptAmount: readString(normalized, "receiptAmount", "receipt_amount"),
      buyerLogonId: readString(normalized, "buyerLogonId", "buyer_logon_id"),
      buyerId: readString(normalized, "buyerUserId", "buyer_id"),
      buyerOpenId: readString(normalized, "buyerOpenId", "buyer_open_id"),
      sendPayDate: readString(normalized, "sendPayDate", "send_pay_date"),
      subject: readString(normalized, "subject"),
      body: readString(normalized, "body"),
    } satisfies AlipayOrderStatus;

    gatewayLogger.info(
      {
        action: "query",
        outTradeNo: response.outTradeNo,
        tradeStatus: response.tradeStatus,
      },
      "payment.alipay.response",
    );
    return response;
  } catch (error) {
    gatewayLogger.error(
      {
        action: "query",
        outTradeNo,
        error: serializeError(error),
      },
      "payment.alipay.exception",
    );
    throw error;
  }
}

export async function probeAlipayOrderQuery(outTradeNo: string) {
  const sdk = getAlipayClient();

  try {
    const result = (await sdk.exec(
      "alipay.trade.query",
      withAppAuthToken({
        bizContent: {
          out_trade_no: outTradeNo,
        },
      }),
    )) as AlipaySdkResult;

    normalizeResult(result, "查询订单");
  } catch (error) {
    if (isAlipayTradeNotExistError(error)) {
      return;
    }

    gatewayLogger.error(
      {
        action: "query-probe",
        outTradeNo,
        error: serializeError(error),
      },
      "payment.alipay.exception",
    );
    throw error;
  }
}

export async function closeAlipayOrder(outTradeNo: string) {
  const sdk = getAlipayClient();
  gatewayLogger.info(
    {
      action: "close",
      outTradeNo,
    },
    "payment.alipay.request",
  );

  try {
    const result = (await sdk.exec(
      "alipay.trade.close",
      withAppAuthToken({
        bizContent: {
          out_trade_no: outTradeNo,
        },
      }),
    )) as AlipaySdkResult;

    const normalized = normalizeResult(result, "关闭订单");
    const response = {
      tradeNo: readString(normalized, "tradeNo", "trade_no"),
      outTradeNo: readString(normalized, "outTradeNo", "out_trade_no") || outTradeNo,
    };
    gatewayLogger.info(
      {
        action: "close",
        outTradeNo: response.outTradeNo,
      },
      "payment.alipay.response",
    );
    return response;
  } catch (error) {
    gatewayLogger.error(
      {
        action: "close",
        outTradeNo,
        error: serializeError(error),
      },
      "payment.alipay.exception",
    );
    throw error;
  }
}

export async function cancelAlipayOrder(outTradeNo: string) {
  const sdk = getAlipayClient();
  gatewayLogger.info(
    {
      action: "cancel",
      outTradeNo,
    },
    "payment.alipay.request",
  );

  try {
    const result = (await sdk.exec(
      "alipay.trade.cancel",
      withAppAuthToken({
        bizContent: {
          out_trade_no: outTradeNo,
        },
      }),
    )) as AlipaySdkResult;

    const normalized = normalizeResult(result, "撤销订单");
    const response = {
      tradeNo: readString(normalized, "tradeNo", "trade_no"),
      outTradeNo: readString(normalized, "outTradeNo", "out_trade_no") || outTradeNo,
      retryFlag: readString(normalized, "retryFlag", "retry_flag"),
      action: readString(normalized, "action"),
    };
    gatewayLogger.info(
      {
        action: "cancel",
        outTradeNo: response.outTradeNo,
        retryFlag: response.retryFlag,
        tradeAction: response.action,
      },
      "payment.alipay.response",
    );
    return response;
  } catch (error) {
    gatewayLogger.error(
      {
        action: "cancel",
        outTradeNo,
        error: serializeError(error),
      },
      "payment.alipay.exception",
    );
    throw error;
  }
}

export function verifyNotificationSignature(params: Record<string, string>) {
  try {
    const sdk = getAlipayClient();
    const valid = sdk.checkNotifySignV2(params);
    if (!valid) {
      gatewayLogger.warn(
        {
          action: "verify-notify-signature",
          outTradeNo: params.out_trade_no ?? "",
          notifyId: params.notify_id ?? "",
        },
        "payment.alipay.signature-invalid",
      );
    }
    return valid;
  } catch (error) {
    gatewayLogger.error(
      {
        action: "verify-notify-signature",
        outTradeNo: params.out_trade_no ?? "",
        notifyId: params.notify_id ?? "",
        error: serializeError(error),
      },
      "payment.alipay.signature-error",
    );
    return false;
  }
}

export function isIgnorableAlipayCloseError(message: string) {
  const normalized = message.toUpperCase();
  return (
    normalized.includes("TRADE_NOT_EXIST") ||
    normalized.includes("TRADE_HAS_CLOSE") ||
    normalized.includes("REASON_TRADE_BEEN_FREEZEN")
  );
}

export function isIgnorableAlipayCancelError(message: string) {
  const normalized = message.toUpperCase();
  return (
    isIgnorableAlipayCloseError(message) ||
    normalized.includes("ACQ.TRADE_STATUS_ERROR") ||
    normalized.includes("TRADE_STATUS_ERROR")
  );
}

export function isAlipayTradeNotExistError(error: unknown) {
  if (error instanceof AlipayGatewayError) {
    return error.subCode === "ACQ.TRADE_NOT_EXIST";
  }

  const message = error instanceof Error ? error.message.toUpperCase() : String(error).toUpperCase();
  return message.includes("ACQ.TRADE_NOT_EXIST");
}

export function isAlipayTradeAlreadyClosedError(error: unknown) {
  if (error instanceof AlipayGatewayError) {
    return error.subCode === "ACQ.TRADE_HAS_CLOSE";
  }

  const message = error instanceof Error ? error.message.toUpperCase() : String(error).toUpperCase();
  return message.includes("ACQ.TRADE_HAS_CLOSE") || message.includes("TRADE_HAS_CLOSE");
}
