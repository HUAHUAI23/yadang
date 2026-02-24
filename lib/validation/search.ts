import { z } from "zod";

export const searchPayloadSchema = z.object({
  imageBase64: z.string().min(1, "请上传图片"),
});

export const rechargePayloadSchema = z.object({
  packageId: z.string().trim().min(1, "请选择充值套餐"),
});

