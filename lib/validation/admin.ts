import { z } from "zod";

const hasAtMostTwoDecimals = (value: number) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;

export const adminUserQuerySchema = z.object({
  keyword: z.string().trim().max(64).optional(),
});

export const adminRolePayloadSchema = z.object({
  isAdmin: z.boolean(),
});

export const adminBlacklistPayloadSchema = z.object({
  isBlacklisted: z.boolean(),
  reason: z.string().trim().max(255).optional(),
});

export const adminAccountAdjustmentPayloadSchema = z
  .object({
    action: z.enum(["add", "subtract", "reset"]),
    amount: z
      .number()
      .finite()
      .positive("金额必须大于 0")
      .refine(hasAtMostTwoDecimals, "金额最多保留两位小数")
      .optional(),
    reason: z.string().trim().min(1, "请填写调整原因").max(255, "原因最多255字"),
  })
  .superRefine((value, ctx) => {
    if (value.action !== "reset" && typeof value.amount !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "该操作必须填写金额",
      });
    }
  });

export const autoCreditRuleCreatePayloadSchema = z.object({
  name: z.string().trim().min(1, "规则名称不能为空").max(64, "规则名称最多64字"),
  intervalDays: z
    .number()
    .int("周期必须为整数天")
    .min(1, "周期至少1天")
    .max(365, "周期不能超过365天"),
  amount: z
    .number()
    .finite()
    .positive("金额必须大于 0")
    .refine(hasAtMostTwoDecimals, "金额最多保留两位小数"),
  enabled: z.boolean(),
});

export const autoCreditRuleUpdatePayloadSchema =
  autoCreditRuleCreatePayloadSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    "至少提供一个更新字段",
  );
