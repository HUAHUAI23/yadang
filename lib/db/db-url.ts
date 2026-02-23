import fs from "node:fs";

const DEFAULT_MYSQL_PORT = 3306;
const DEFAULT_CONNECT_TIMEOUT_MS = 10000;

export type AdapterLabel = "BUSINESS_DATABASE_URL" | "EXTERNAL_DATABASE_URL";

export type DatabaseOptions = {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  connectTimeout: number;
  [key: string]: unknown;
};

const parseParamValue = (value: string) => {
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
};

const decodeCredential = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseBooleanEnv = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
};

const resolveEnvValue = (label: AdapterLabel, suffix: string) => {
  const prefix = label.replace("_DATABASE_URL", "");
  return (
    process.env[`${prefix}_DB_${suffix}`] ?? process.env[`DB_${suffix}`]
  );
};

export const parseDatabaseUrl = (
  databaseUrl: string | undefined,
  label: AdapterLabel,
): DatabaseOptions => {
  if (!databaseUrl) {
    throw new Error(`Missing env: ${label}`);
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(`Invalid database URL: ${label}`);
  }

  if (parsed.protocol !== "mysql:") {
    throw new Error(`Unsupported database protocol (mysql required): ${label}`);
  }

  if (!parsed.hostname) {
    throw new Error(`Database URL missing host: ${label}`);
  }

  if (!parsed.username) {
    throw new Error(`Database URL missing username: ${label}`);
  }

  const user = decodeCredential(parsed.username);
  const password = parsed.password
    ? decodeCredential(parsed.password)
    : undefined;

  const database = parsed.pathname.replace(/^\//, "");
  if (!database) {
    throw new Error(`Database URL missing database name: ${label}`);
  }

  const port = parsed.port
    ? Number.parseInt(parsed.port, 10)
    : DEFAULT_MYSQL_PORT;
  if (!Number.isFinite(port)) {
    throw new Error(`Database URL invalid port: ${label}`);
  }

  const baseOptions: DatabaseOptions = {
    host: parsed.hostname,
    port,
    user,
    password,
    database,
    connectTimeout: DEFAULT_CONNECT_TIMEOUT_MS,
  };

  for (const [key, value] of parsed.searchParams.entries()) {
    if (
      key === "host" ||
      key === "port" ||
      key === "user" ||
      key === "password" ||
      key === "database"
    ) {
      continue;
    }
    baseOptions[key] = parseParamValue(value);
  }

  return baseOptions;
};

const resolveSslOptions = (label: AdapterLabel) => {
  const sslEnabled = parseBooleanEnv(resolveEnvValue(label, "SSL"));
  const caPath = resolveEnvValue(label, "SSL_CA_PATH");
  const rejectUnauthorized = parseBooleanEnv(
    resolveEnvValue(label, "SSL_REJECT_UNAUTHORIZED"),
  );

  if (caPath || rejectUnauthorized !== undefined) {
    const ssl: { ca?: Buffer; rejectUnauthorized?: boolean } = {};
    if (caPath) {
      try {
        ssl.ca = fs.readFileSync(caPath);
      } catch (error) {
        throw new Error(
          `Failed to read SSL CA file for ${label}: ${caPath}`,
        );
      }
    }
    if (rejectUnauthorized !== undefined) {
      ssl.rejectUnauthorized = rejectUnauthorized;
    }
    return { ssl };
  }

  if (sslEnabled !== undefined) {
    return { ssl: sslEnabled };
  }

  return {};
};

export const resolveDatabaseOptions = (
  databaseUrl: string | undefined,
  label: AdapterLabel,
): DatabaseOptions => {
  const options = parseDatabaseUrl(databaseUrl, label);
  const sslOverrides = resolveSslOptions(label);
  if (sslOverrides.ssl !== undefined) {
    return { ...options, ssl: sslOverrides.ssl };
  }
  return options;
};

export const sanitizeDatabaseOptions = (options: DatabaseOptions) => {
  const {
    host,
    port,
    user,
    database,
    connectTimeout,
    acquireTimeout,
    connectionLimit,
    ssl,
    socketTimeout,
    queryTimeout,
    compress,
  } = options;

  return {
    host,
    port,
    user,
    database,
    connectTimeout,
    acquireTimeout,
    connectionLimit,
    socketTimeout,
    queryTimeout,
    ssl: ssl === false ? false : ssl ? "[configured]" : undefined,
    compress,
    hasPassword: Boolean(options.password),
  };
};
