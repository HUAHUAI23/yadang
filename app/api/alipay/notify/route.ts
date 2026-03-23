import { NextResponse } from "next/server";

import {
  bindTraceToHeaders,
  childLogger,
  serializeError,
  withRequestTrace,
} from "@/lib/server/logger";
import { verifyNotificationSignature } from "@/lib/server/payment/alipay";
import { finalizeAlipaySuccess } from "@/lib/server/payment/charge-orders";

const notifyLogger = childLogger({
  domain: "payment",
  component: "alipay-notify",
});

const textResponse = (body: "success" | "fail", status: number) => {
  const response = new NextResponse(body, { status });
  bindTraceToHeaders(response.headers);
  return response;
};

const successText = () => textResponse("success", 200);
const failText = () => textResponse("fail", 500);

export async function POST(request: Request) {
  return withRequestTrace(request, async () => {
    try {
      const formData = await request.formData();
      const params: Record<string, string> = {};

      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      notifyLogger.info(
        {
          outTradeNo: params.out_trade_no ?? "",
          tradeStatus: params.trade_status ?? "",
          notifyType: params.notify_type ?? "",
        },
        "payment.notify.received",
      );

      if (!verifyNotificationSignature(params)) {
        notifyLogger.warn(
          {
            outTradeNo: params.out_trade_no ?? "",
            notifyId: params.notify_id ?? "",
          },
          "payment.notify.signature-invalid",
        );
        return textResponse("fail", 400);
      }

      if (params.notify_type && params.notify_type !== "trade_status_sync") {
        return successText();
      }

      if (params.trade_status !== "TRADE_SUCCESS") {
        return successText();
      }

      const outTradeNo = params.out_trade_no;
      const tradeNo = params.trade_no;
      const totalAmount = params.total_amount;
      if (!outTradeNo || !tradeNo || !totalAmount) {
        notifyLogger.warn(
          {
            outTradeNo: outTradeNo ?? "",
            tradeNo: tradeNo ?? "",
            totalAmount: totalAmount ?? "",
          },
          "payment.notify.missing-required-fields",
        );
        return failText();
      }

      await finalizeAlipaySuccess({
        outTradeNo,
        tradeNo,
        totalAmount,
        paidAt: params.gmt_payment,
        payload: params,
        source: "notify",
      });

      notifyLogger.info(
        {
          outTradeNo,
          tradeNo,
        },
        "payment.notify.success",
      );
      return successText();
    } catch (error) {
      notifyLogger.error(
        {
          error: serializeError(error),
        },
        "payment.notify.failed",
      );
      return failText();
    }
  });
}

export const runtime = "nodejs";
