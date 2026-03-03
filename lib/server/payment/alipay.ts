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
  sub_code?: string;
  sub_msg?: string;
  [key: string]: unknown;
};

const globalForAlipay = globalThis as unknown as {
  alipayClient?: AlipaySdk;
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

export const isAlipayEnabled = () => Boolean(getConfiguredKeys() && env.alipayNotifyUrl);

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
  });

  if (process.env.NODE_ENV !== "production") {
    globalForAlipay.alipayClient = sdk;
  }

  return sdk;
};

const normalizeResult = (result: AlipaySdkResult, action: string) => {
  if (result.code !== SUCCESS_CODE) {
    gatewayLogger.error(
      {
        action,
        code: result.code ?? "",
        msg: result.msg ?? "",
        subCode: result.sub_code ?? "",
        subMsg: result.sub_msg ?? "",
      },
      "payment.alipay.gateway-failed",
    );
    const message =
      (typeof result.sub_msg === "string" && result.sub_msg) ||
      (typeof result.msg === "string" && result.msg) ||
      `${action}失败`;
    throw new Error(message);
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

export async function precreateAlipayOrder(input: {
  outTradeNo: string;
  subject: string;
  totalAmountFen: bigint;
  body?: string;
  timeoutMinutes: number;
}) {
  const notifyUrl = env.alipayNotifyUrl;
  if (!notifyUrl) {
    throw new Error("支付宝异步回调地址未配置");
  }

  const sdk = getAlipayClient();
  gatewayLogger.info(
    {
      action: "precreate",
      outTradeNo: input.outTradeNo,
      timeoutMinutes: input.timeoutMinutes,
    },
    "payment.alipay.request",
  );

  try {
    const result = (await sdk.exec("alipay.trade.precreate", {
      notifyUrl,
      bizContent: {
        out_trade_no: input.outTradeNo,
        total_amount: fenToYuan(input.totalAmountFen),
        subject: input.subject,
        body: input.body,
        product_code: "FACE_TO_FACE_PAYMENT",
        timeout_express: `${input.timeoutMinutes}m`,
      },
    })) as AlipaySdkResult;

    const normalized = normalizeResult(result, "下单");
    const qrCode = readString(normalized, "qrCode", "qr_code");
    if (!qrCode) {
      throw new Error("支付宝返回的二维码为空");
    }

    const outTradeNo =
      readString(normalized, "outTradeNo", "out_trade_no") || input.outTradeNo;
    gatewayLogger.info(
      {
        action: "precreate",
        outTradeNo,
      },
      "payment.alipay.response",
    );

    return {
      outTradeNo,
      qrCode,
    };
  } catch (error) {
    gatewayLogger.error(
      {
        action: "precreate",
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
    const result = (await sdk.exec("alipay.trade.query", {
      bizContent: {
        out_trade_no: outTradeNo,
      },
    })) as AlipaySdkResult;

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
    const result = (await sdk.exec("alipay.trade.close", {
      bizContent: {
        out_trade_no: outTradeNo,
      },
    })) as AlipaySdkResult;

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
