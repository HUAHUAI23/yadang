import { z } from "zod";

export const DEFAULT_PAYMENT_PRESET_AMOUNTS = [10, 50, 100, 500] as const;

const paymentPublicConfigSchema = z.object({
  orderTimeoutMinutes: z.number().finite().positive().optional(),
  wechat: z
    .object({
      appid: z.string().optional(),
      mchid: z.string().optional(),
    })
    .optional(),
  alipay: z
    .object({
      appId: z.string().optional(),
    })
    .optional(),
  stripe: z
    .object({
      publicKey: z.string().optional(),
    })
    .optional(),
});

const paymentPresetAmountsSchema = z.array(z.number().finite().positive());

export type PaymentPublicConfig = z.infer<typeof paymentPublicConfigSchema>;
export type PaymentPresetAmounts = number[];

export function parsePaymentPublicConfig(value: unknown): PaymentPublicConfig {
  const parsed = paymentPublicConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

export function resolvePaymentOrderTimeoutMinutes(
  publicConfig: unknown,
  fallback: number,
) {
  const config = parsePaymentPublicConfig(publicConfig);
  const raw = config.orderTimeoutMinutes;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }
  return Math.max(1, Math.floor(fallback));
}

export function parsePaymentPresetAmounts(
  value: unknown,
  fallback: readonly number[] = DEFAULT_PAYMENT_PRESET_AMOUNTS,
): PaymentPresetAmounts {
  const parsed = paymentPresetAmountsSchema.safeParse(value);
  if (!parsed.success) {
    return [...fallback];
  }

  const normalized = [...new Set(parsed.data.map((item) => Math.floor(item)))].filter(
    (item) => Number.isFinite(item) && item > 0,
  );

  return normalized.length ? normalized : [...fallback];
}

export function buildAlipayPublicConfig(input: {
  orderTimeoutMinutes: number;
  appId?: string;
}): PaymentPublicConfig {
  return {
    orderTimeoutMinutes: Math.max(1, Math.floor(input.orderTimeoutMinutes)),
    alipay: {
      appId: input.appId ?? "",
    },
  };
}
