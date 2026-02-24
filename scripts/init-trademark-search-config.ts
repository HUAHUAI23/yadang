import { businessPrisma } from "../lib/db/business"
import { SearchPriceCode } from "../prisma/generated/business/enums"

/**
 * Initialize trademark search configuration for all methods
 *
 * Usage: pnpm tsx --env-file=.env scripts/init-trademark-search-config.ts
 *
 * 商标搜索配置结构：(code) 唯一，精确匹配
 * 每个 code 必须有对应的配置
 */

const PRICE_ENV_KEY = "TRADEMARK_SEARCH_GLOBAL_PRICE"
const DEFAULT_GLOBAL_PRICE = 20

function resolveTargetPrice(): bigint {
  const raw = process.env[PRICE_ENV_KEY]
  if (!raw) return BigInt(DEFAULT_GLOBAL_PRICE)

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${PRICE_ENV_KEY} 必须是大于 0 的整数，当前值: ${raw}`)
  }

  return BigInt(parsed)
}

async function initTrademarkSearchConfig() {
  const forceAmount = process.argv.includes("--force-amount")
  const targetAmount = resolveTargetPrice()

  console.log("Initializing trademark search config...\n")
  console.log(
    `· Target global price: ${targetAmount.toString()} credits (code=${SearchPriceCode.TRADEMARK_IMAGE_SEARCH})`,
  )
  console.log(`· Force update amount: ${forceAmount ? "yes" : "no"}`)

  const globalRows = await businessPrisma.searchPrice.findMany({
    where: {
      code: SearchPriceCode.TRADEMARK_IMAGE_SEARCH,
      userId: null,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      amount: true,
      enabled: true,
      updatedAt: true,
    },
  })

  if (!globalRows.length) {
    const created = await businessPrisma.searchPrice.create({
      data: {
        code: SearchPriceCode.TRADEMARK_IMAGE_SEARCH,
        userId: null,
        amount: targetAmount,
        enabled: true,
        note: "default global price by init script",
      },
      select: { id: true, amount: true },
    })

    console.log(
      `✓ Created global price row: id=${created.id}, amount=${created.amount.toString()}`,
    )
    return
  }

  const latest = globalRows[0]
  console.log(
    `· Found global price row: id=${latest.id}, amount=${latest.amount.toString()}, enabled=${latest.enabled}`,
  )

  if (globalRows.length > 1) {
    console.warn(
      `⚠ Found ${globalRows.length} global rows for TRADEMARK_IMAGE_SEARCH (MySQL NULL unique caveat). Latest row will be used by service.`,
    )
    console.warn(
      `  Row ids (newest -> oldest): ${globalRows.map((row) => row.id).join(", ")}`,
    )
  }

  if (forceAmount && latest.amount !== targetAmount) {
    const updated = await businessPrisma.searchPrice.update({
      where: { id: latest.id },
      data: {
        amount: targetAmount,
        enabled: true,
        note: "updated by init script --force-amount",
      },
      select: { id: true, amount: true },
    })
    console.log(
      `✓ Updated latest global price: id=${updated.id}, amount=${updated.amount.toString()}`,
    )
    return
  }

  if (latest.amount !== targetAmount) {
    console.log(
      `· Keep existing amount=${latest.amount.toString()} (set --force-amount to apply target amount=${targetAmount.toString()}).`,
    )
  }

  if (!latest.enabled) {
    console.log("· Current latest row is disabled. Use --force-amount to re-enable it.")
  }

  console.log("✓ Trademark search config check completed")
}

async function main() {
  try {
    await initTrademarkSearchConfig()
    process.exitCode = 0
  } catch (error) {
    console.error("Error initializing trademark search config:", error)
    process.exitCode = 1
  } finally {
    await businessPrisma.$disconnect()
  }
}

void main()
