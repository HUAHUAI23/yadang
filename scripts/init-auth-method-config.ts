import { businessPrisma } from "../lib/db/business";
import { AuthMethod } from "../prisma/generated/business/enums";

const DEFAULT_METHODS = [AuthMethod.PASSWORD, AuthMethod.SMS] as const;

async function initAuthMethodConfig() {
  console.log("Initializing auth method config...\n");

  let created = 0;
  let skipped = 0;

  for (const method of DEFAULT_METHODS) {
    const exists = await businessPrisma.authMethodConfig.findUnique({
      where: { method },
      select: { id: true },
    });

    if (exists) {
      console.log(`· Exists: ${method}`);
      skipped += 1;
      continue;
    }

    await businessPrisma.authMethodConfig.create({
      data: {
        method,
        enabled: true,
      },
    });

    console.log(`✓ Created: ${method} (enabled=true)`);
    created += 1;
  }

  console.log("\n========================================");
  console.log("✓ Auth method config initialization completed");
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total:   ${DEFAULT_METHODS.length}`);
  console.log("========================================");
}

async function main() {
  try {
    await initAuthMethodConfig();
    process.exitCode = 0;
  } catch (error) {
    console.error("Error initializing auth method config:", error);
    process.exitCode = 1;
  } finally {
    await businessPrisma.$disconnect();
  }
}

void main();
