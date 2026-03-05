import { PrismaMariaDb } from "@prisma/adapter-mariadb"

import { resolveDatabaseOptions } from "../lib/db/db-url"
import { Prisma } from "../prisma/generated/business/client"
import { PrismaClient } from "../prisma/generated/business/client"
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
const DB_ENV_KEY = "BUSINESS_DATABASE_URL"

const resolveDatabaseUrl = () => {
  const value = process.env[DB_ENV_KEY]
  if (!value) {
    throw new Error(`Missing env: ${DB_ENV_KEY}`)
  }
  return value
}

const businessPrisma = new PrismaClient({
  adapter: new PrismaMariaDb(
    resolveDatabaseOptions(resolveDatabaseUrl(), "BUSINESS_DATABASE_URL"),
    {
      onConnectionError: (error) => {
        const err = error as { message?: string; code?: string } | null
        const code = err?.code ? ` (${err.code})` : ""
        const message = err?.message ?? "Unknown connection error"
        console.error(`[BUSINESS_DATABASE_URL] MariaDB connection error${code}: ${message}`)
      },
    },
  ),
})

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
