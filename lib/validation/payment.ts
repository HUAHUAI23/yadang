import { z } from "zod";

const hasAtMostTwoDecimals = (value: number) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;

export const createRechargeOrderPayloadSchema = z.object({
  amount: z
    .number()
    .finite()
    .positive("充值金额必须大于 0")
    .refine(hasAtMostTwoDecimals, "充值金额最多保留两位小数"),
});

export const closeAlipayOrderPayloadSchema = z.object({
  outTradeNo: z.string().trim().min(1, "订单号不能为空"),
});
