import { businessPrisma } from "../lib/db/business"
import {
  buildAlipayPublicConfig,
  DEFAULT_PAYMENT_PRESET_AMOUNTS,
  parsePaymentPublicConfig,
} from "../lib/server/payment/payment-config"
import { Prisma } from "../prisma/generated/business/client"
import {
  PaymentConfigStatus,
  PaymentProvider,
} from "../prisma/generated/business/enums"

const ALIPAY_ENV_KEYS = {
  appId: "ALIPAY_APP_ID",
  privateKey: "ALIPAY_PRIVATE_KEY",
  publicKey: "ALIPAY_PUBLIC_KEY",
  notifyUrl: "ALIPAY_NOTIFY_URL",
  timeoutMinutes: "PAYMENT_ORDER_TIMEOUT_MINUTES",
}

const DEFAULT_ORDER_TIMEOUT_MINUTES = 10

const parsePositiveInt = (raw: string | undefined, fallback: number) => {
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

const resolveOrderTimeoutMinutes = () => {
  return parsePositiveInt(
    process.env[ALIPAY_ENV_KEYS.timeoutMinutes],
    DEFAULT_ORDER_TIMEOUT_MINUTES,
  )
}

const resolveAlipayPublicConfig = () => {
  return buildAlipayPublicConfig({
    orderTimeoutMinutes: resolveOrderTimeoutMinutes(),
    appId: process.env[ALIPAY_ENV_KEYS.appId] ?? "",
  })
}

const resolveStatus = () => {
  const appId = process.env[ALIPAY_ENV_KEYS.appId]
  const privateKey = process.env[ALIPAY_ENV_KEYS.privateKey]
  const publicKey = process.env[ALIPAY_ENV_KEYS.publicKey]
  const notifyUrl = process.env[ALIPAY_ENV_KEYS.notifyUrl]

  return appId && privateKey && publicKey && notifyUrl
    ? PaymentConfigStatus.ENABLED
    : PaymentConfigStatus.DISABLED
}

async function initPaymentConfig() {
  const forceOverwrite = process.argv.includes("--force-overwrite")
  const targetStatus = resolveStatus()
  const targetPublicConfig = resolveAlipayPublicConfig()

  console.log("Initializing payment config...\n")
  console.log(`· Provider: ${PaymentProvider.ALIPAY}`)
  console.log(`· Target status: ${targetStatus}`)
  console.log(
    `· Target order timeout: ${targetPublicConfig.orderTimeoutMinutes} minutes`,
  )
  console.log(`· Force overwrite: ${forceOverwrite ? "yes" : "no"}`)

  const existed = await businessPrisma.paymentConfig.findUnique({
    where: {
      provider: PaymentProvider.ALIPAY,
    },
    select: {
      id: true,
      provider: true,
      status: true,
      displayName: true,
      minAmount: true,
      maxAmount: true,
      presetAmounts: true,
      publicConfig: true,
      updatedAt: true,
    },
  })

  if (!existed) {
    const created = await businessPrisma.paymentConfig.create({
      data: {
        provider: PaymentProvider.ALIPAY,
        displayName: "支付宝",
        description: "支付宝扫码支付",
        icon: "zhifubao",
        status: targetStatus,
        sortOrder: 10,
        presetAmounts: [...DEFAULT_PAYMENT_PRESET_AMOUNTS],
        minAmount: 1,
        maxAmount: 100000,
        publicConfig: targetPublicConfig,
      },
      select: {
        id: true,
        provider: true,
        status: true,
        minAmount: true,
        maxAmount: true,
      },
    })

    console.log(
      `✓ Created payment config: id=${created.id}, provider=${created.provider}, status=${created.status}`,
    )
    return
  }

  console.log(
    `· Found payment config: id=${existed.id}, status=${existed.status}, amountRange=${existed.minAmount}-${existed.maxAmount}`,
  )

  if (forceOverwrite) {
    const updated = await businessPrisma.paymentConfig.update({
      where: {
        id: existed.id,
      },
      data: {
        displayName: "支付宝",
        description: "支付宝扫码支付",
        icon: "zhifubao",
        status: targetStatus,
        sortOrder: 10,
        presetAmounts: [...DEFAULT_PAYMENT_PRESET_AMOUNTS],
        minAmount: 1,
        maxAmount: 100000,
        publicConfig: targetPublicConfig,
      },
      select: {
        id: true,
        provider: true,
        status: true,
        minAmount: true,
        maxAmount: true,
      },
    })

    console.log(
      `✓ Force updated payment config: id=${updated.id}, provider=${updated.provider}, status=${updated.status}`,
    )
    return
  }

  const currentPublicConfig = parsePaymentPublicConfig(existed.publicConfig)
  const nextPublicConfig = {
    ...currentPublicConfig,
    orderTimeoutMinutes: targetPublicConfig.orderTimeoutMinutes,
    alipay: {
      ...(currentPublicConfig.alipay ?? {}),
      appId: targetPublicConfig.alipay?.appId ?? "",
    },
  }

  const shouldUpdateStatus = existed.status !== targetStatus
  const shouldUpdatePublicConfig =
    JSON.stringify(currentPublicConfig) !== JSON.stringify(nextPublicConfig)

  if (!shouldUpdateStatus && !shouldUpdatePublicConfig) {
    console.log("✓ Payment config check completed (no changes)")
    return
  }

  const updated = await businessPrisma.paymentConfig.update({
    where: {
      id: existed.id,
    },
    data: {
      ...(shouldUpdateStatus ? { status: targetStatus } : {}),
      ...(shouldUpdatePublicConfig ? { publicConfig: nextPublicConfig } : {}),
    },
    select: {
      id: true,
      provider: true,
      status: true,
      updatedAt: true,
    },
  })

  console.log(
    `✓ Updated payment config: id=${updated.id}, provider=${updated.provider}, status=${updated.status}`,
  )
}

async function main() {
  try {
    await initPaymentConfig()
    process.exitCode = 0
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021" &&
      error.meta &&
      typeof error.meta === "object" &&
      "modelName" in error.meta &&
      error.meta.modelName === "PaymentConfig"
    ) {
      console.error(
        [
          "Error initializing payment config: 数据表 PaymentConfig 不存在。",
          "请先同步 business 库结构，再重新执行初始化脚本：",
          "1) 开发环境（推荐）: pnpm prisma:business:migrate:dev",
          "2) 生产环境: pnpm prisma:business:migrate:deploy",
        ].join("\n"),
      )
      process.exitCode = 1
      return
    }
    console.error("Error initializing payment config:", error)
    process.exitCode = 1
  } finally {
    await businessPrisma.$disconnect()
  }
}

void main()
