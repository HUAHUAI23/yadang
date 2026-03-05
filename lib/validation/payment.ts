import { z } from "zod";

export const createAlipayOrderPayloadSchema = z.object({
  amount: z.number().finite(),
});

export const createRechargeOrderPayloadSchema = z.object({
  amount: z.number().finite(),
  provider: z.enum(["alipay", "wechat", "stripe"]).default("alipay"),
});

export const closeAlipayOrderPayloadSchema = z.object({
  outTradeNo: z.string().trim().min(1, "订单号不能为空"),
});
