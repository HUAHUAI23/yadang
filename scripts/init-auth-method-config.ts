import { businessPrisma } from "../lib/db/business"
import { Prisma } from "../prisma/generated/business/client"
import { AuthMethod } from "../prisma/generated/business/enums"

/**
 * Initialize authentication method configuration for all methods
 *
 * Usage: pnpm tsx --env-file=.env scripts/init-auth-method-config.ts
 *
 * 认证方法配置结构：(method) 唯一，精确匹配
 * 每个 method 必须有对应的配置
 */

const DEFAULT_METHODS = [AuthMethod.PASSWORD, AuthMethod.SMS] as const

async function initAuthMethodConfig() {
  console.log("Initializing auth method config...\n")

  let createdOrUpdated = 0

  for (const method of DEFAULT_METHODS) {
    await businessPrisma.authMethodConfig.upsert({
      where: {
        method,
      },
      create: {
        method,
        enabled: true,
      },
      update: {},
      select: {
        id: true,
      },
    })

    console.log(`✓ Upserted: ${method}`)
    createdOrUpdated += 1
  }

  console.log("\n========================================")
  console.log("✓ Auth method config initialization completed")
  console.log(`  Upserted: ${createdOrUpdated}`)
  console.log(`  Total:    ${DEFAULT_METHODS.length}`)
  console.log("========================================")
}

async function main() {
  try {
    await initAuthMethodConfig()
    process.exitCode = 0
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021" &&
      error.meta &&
      typeof error.meta === "object" &&
      "modelName" in error.meta &&
      error.meta.modelName === "AuthMethodConfig"
    ) {
      console.error(
        [
          "Error initializing auth method config: 数据表 AuthMethodConfig 不存在。",
          "请先同步 business 库结构，再重新执行初始化脚本：",
          "1) 开发环境（推荐）: pnpm prisma:business:migrate:dev",
          "2) 生产环境: pnpm prisma:business:migrate:deploy",
        ].join("\n"),
      )
      process.exitCode = 1
      return
    }
    console.error("Error initializing auth method config:", error)
    process.exitCode = 1
  } finally {
    await businessPrisma.$disconnect()
  }
}

void main()
