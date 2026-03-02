import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { type AdapterLabel, resolveDatabaseOptions } from "@/lib/db/db-url";

import "server-only";

export const createMariaDbAdapter = (
  databaseUrl: string | undefined,
  label: AdapterLabel,
) => {
  const options = resolveDatabaseOptions(databaseUrl, label);
  return new PrismaMariaDb(options, {
    onConnectionError: (error) => {
      const err = error as { message?: string; code?: string } | null;
      const code = err?.code ? ` (${err.code})` : "";
      const message = err?.message ?? "Unknown connection error";
      console.error(`[${label}] MariaDB connection error${code}: ${message}`);
    },
  });
};
