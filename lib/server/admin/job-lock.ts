import mariadb from "mariadb";

import { resolveDatabaseOptions } from "@/lib/db/db-url";
import { env } from "@/lib/env";

import "server-only";

type MariaDbConnection = {
  query: <T = unknown>(sql: string, values?: unknown[]) => Promise<T>;
  release?: () => void;
  end: () => Promise<void>;
};

type MariaDbPool = {
  getConnection: () => Promise<MariaDbConnection>;
};

const globalForAdminJobLock = globalThis as unknown as {
  adminJobLockPool?: MariaDbPool;
};

const getAdminJobLockPool = () => {
  if (!globalForAdminJobLock.adminJobLockPool) {
    globalForAdminJobLock.adminJobLockPool = mariadb.createPool({
      ...resolveDatabaseOptions(
        env.businessDatabaseUrl,
        "BUSINESS_DATABASE_URL",
      ),
      connectionLimit: 2,
    });
  }

  return globalForAdminJobLock.adminJobLockPool;
};

const toNumericValue = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return Number.parseInt(String(value ?? 0), 10);
};

const releaseConnection = async (connection: MariaDbConnection) => {
  if (typeof connection.release === "function") {
    connection.release();
    return;
  }

  await connection.end();
};

export async function withAdminJobLock<T>(
  name: string,
  handler: () => Promise<T>,
): Promise<{ acquired: boolean; result?: T }> {
  const connection = await getAdminJobLockPool().getConnection();

  try {
    const rows = await connection.query<Array<{ locked?: unknown }>>(
      "SELECT GET_LOCK(?, 0) AS locked",
      [name],
    );

    if (toNumericValue(rows[0]?.locked) !== 1) {
      return { acquired: false };
    }

    try {
      return {
        acquired: true,
        result: await handler(),
      };
    } finally {
      await connection
        .query("SELECT RELEASE_LOCK(?) AS released", [name])
        .catch(() => null);
    }
  } finally {
    await releaseConnection(connection);
  }
}
