// 统一加载 .env，并提供服务端环境变量管理类。
import { config } from "dotenv";

import "server-only";

const dotenvLoaded = process.env.DOTENV_LOADED;

if (!dotenvLoaded) {
  config();
  process.env.DOTENV_LOADED = "true";
}

class EnvConfig {
  private required(key: string) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`缺少环境变量: ${key}`);
    }
    return value;
  }

  private requiredAny(keys: string[]) {
    for (const key of keys) {
      const value = process.env[key];
      if (value) {
        return value;
      }
    }
    throw new Error(`缺少环境变量: ${keys.join(" 或 ")}`);
  }

  private optional(key: string, fallback: string) {
    return process.env[key] ?? fallback;
  }

  private optionalString(key: string) {
    const value = process.env[key];
    return value && value.length > 0 ? value : undefined;
  }

  private number(key: string, fallback: number) {
    const raw = process.env[key];
    if (!raw) return fallback;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private parseLogLevel(
    key: string,
    fallback: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent",
  ) {
    const raw = process.env[key];
    if (!raw) return fallback;
    const normalized = raw.trim().toLowerCase();
    if (
      [
        "fatal",
        "error",
        "warn",
        "info",
        "debug",
        "trace",
        "silent",
      ].includes(normalized)
    ) {
      return normalized as
        | "fatal"
        | "error"
        | "warn"
        | "info"
        | "debug"
        | "trace"
        | "silent";
    }
    return fallback;
  }

  private boolean(key: string) {
    const raw = process.env[key];
    if (!raw) return undefined;
    const normalized = raw.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return undefined;
  }

  get jwtSecret() {
    return this.required("JWT_SECRET");
  }

  get jwtIssuer() {
    return this.optional("JWT_ISSUER", "patent-lens");
  }

  get jwtAudience() {
    return this.optional("JWT_AUDIENCE", "patent-lens");
  }

  get jwtExpiresIn() {
    return this.number("JWT_EXPIRES_IN", 604800);
  }

  get authCookieName() {
    return this.optional("AUTH_COOKIE_NAME", "pl_session");
  }

  get businessDatabaseUrl() {
    return this.required("BUSINESS_DATABASE_URL");
  }

  get externalDatabaseUrl() {
    return this.required("EXTERNAL_DATABASE_URL");
  }

  get smsCodeSecret() {
    return this.required("SMS_CODE_SECRET");
  }

  get smsCodeExpiresIn() {
    return this.number("SMS_CODE_EXPIRES_IN", 300);
  }

  get smsCodeCooldown() {
    return this.number("SMS_CODE_COOLDOWN", 60);
  }

  get smsCodeMaxAttempts() {
    return this.number("SMS_CODE_MAX_ATTEMPTS", 5);
  }

  get aliyunSmsAccessKeyId() {
    return this.required("ALIYUN_SMS_ACCESS_KEY_ID");
  }

  get aliyunSmsAccessKeySecret() {
    return this.required("ALIYUN_SMS_ACCESS_KEY_SECRET");
  }

  get aliyunSmsSignName() {
    return this.required("ALIYUN_SMS_SIGN_NAME");
  }

  get aliyunSmsTemplateCode() {
    return this.required("ALIYUN_SMS_TEMPLATE_CODE");
  }

  get aliyunSmsEndpoint() {
    return this.optional("ALIYUN_SMS_ENDPOINT", "dysmsapi.aliyuncs.com");
  }

  get aliyunSmsConnectTimeoutMs() {
    return this.number("ALIYUN_SMS_CONNECT_TIMEOUT_MS", 10000);
  }

  get aliyunSmsReadTimeoutMs() {
    return this.number("ALIYUN_SMS_READ_TIMEOUT_MS", 10000);
  }

  get aliyunSmsAutoRetry() {
    return this.boolean("ALIYUN_SMS_AUTORETRY") ?? true;
  }

  get aliyunSmsMaxAttempts() {
    return this.number("ALIYUN_SMS_MAX_ATTEMPTS", 3);
  }

  get dbSsl() {
    return this.boolean("DB_SSL");
  }

  get dbSslCaPath() {
    return this.optionalString("DB_SSL_CA_PATH");
  }

  get dbSslRejectUnauthorized() {
    return this.boolean("DB_SSL_REJECT_UNAUTHORIZED");
  }

  get businessDbSsl() {
    return this.boolean("BUSINESS_DB_SSL");
  }

  get businessDbSslCaPath() {
    return this.optionalString("BUSINESS_DB_SSL_CA_PATH");
  }

  get businessDbSslRejectUnauthorized() {
    return this.boolean("BUSINESS_DB_SSL_REJECT_UNAUTHORIZED");
  }

  get externalDbSsl() {
    return this.boolean("EXTERNAL_DB_SSL");
  }

  get externalDbSslCaPath() {
    return this.optionalString("EXTERNAL_DB_SSL_CA_PATH");
  }

  get externalDbSslRejectUnauthorized() {
    return this.boolean("EXTERNAL_DB_SSL_REJECT_UNAUTHORIZED");
  }

  get aliyunOssAccessKeyId() {
    return this.required("OSS_ACCESS_KEY_ID");
  }

  get aliyunOssAccessKeySecret() {
    return this.required("OSS_ACCESS_KEY_SECRET");
  }

  get aliyunOssRegion() {
    return this.required("ALIYUN_OSS_REGION");
  }

  get aliyunOssBucket() {
    return this.required("ALIYUN_OSS_BUCKET");
  }

  get aliyunOssEndpoint() {
    return this.optionalString("ALIYUN_OSS_ENDPOINT");
  }

  get aliyunOssSignedUrlExpiresSeconds() {
    return this.number("ALIYUN_OSS_SIGNED_URL_EXPIRES_SECONDS", 300);
  }

  get aliyunOssUploadPrefix() {
    return this.optional("ALIYUN_OSS_UPLOAD_PREFIX", "trademark-search/uploads");
  }

  get milvusAddress() {
    return this.required("MILVUS_ADDRESS");
  }

  get milvusUsername() {
    return this.optional("MILVUS_USERNAME", "root");
  }

  get milvusPassword() {
    return this.optional("MILVUS_PASSWORD", "Milvus");
  }

  get milvusToken() {
    return this.optionalString("MILVUS_TOKEN");
  }

  get milvusCollectionName() {
    return this.required("MILVUS_COLLECTION_NAME");
  }

  get milvusVectorField() {
    return this.optional("MILVUS_VECTOR_FIELD", "vector");
  }

  get milvusTopK() {
    return this.number("MILVUS_TOP_K", 60);
  }

  get milvusMetricType() {
    return this.optional("MILVUS_METRIC_TYPE", "L2");
  }

  get milvusSearchParams() {
    return this.optionalString("MILVUS_SEARCH_PARAMS");
  }

  get vectorApiEndpoint() {
    return this.optional("VECTOR_API_ENDPOINT", "http://127.0.0.1:8001/v1/vectorize");
  }

  get vectorApiKey() {
    return this.optionalString("VECTOR_API_KEY");
  }

  get vectorApiTimeoutMs() {
    return this.number("VECTOR_API_TIMEOUT_MS", 15000);
  }

  get vectorModelId() {
    return this.optional(
      "VECTOR_MODEL_ID",
      "facebook/dinov3-vitl16-pretrain-lvd1689m",
    );
  }

  get vectorDimension() {
    return this.number("VECTOR_DIMENSION", 1024);
  }

  get alipayAppId() {
    return this.optionalString("ALIPAY_APP_ID") ?? this.optionalString("ALIPAY_APPID");
  }

  get alipayPrivateKey() {
    return this.optionalString("ALIPAY_PRIVATE_KEY");
  }

  get alipayPublicKey() {
    return this.optionalString("ALIPAY_PUBLIC_KEY");
  }

  get alipayNotifyUrl() {
    return this.optionalString("ALIPAY_NOTIFY_URL");
  }

  get alipayReturnUrl() {
    return this.optionalString("ALIPAY_RETURN_URL");
  }

  get alipayAppAuthToken() {
    return this.optionalString("ALIPAY_APP_AUTH_TOKEN");
  }

  get alipaySysServiceProviderId() {
    return this.optionalString("ALIPAY_SYS_SERVICE_PROVIDER_ID");
  }

  get alipayGateway() {
    return this.optional("ALIPAY_GATEWAY", "https://openapi.alipay.com/gateway.do");
  }

  get paymentOrderTimeoutMinutes() {
    return this.number("PAYMENT_ORDER_TIMEOUT_MINUTES", 10);
  }

  get paymentSchedulerEnabled() {
    return this.boolean("PAYMENT_SCHEDULER_ENABLED") ?? true;
  }

  get paymentOrderSyncCron() {
    return this.optional("PAYMENT_ORDER_SYNC_CRON", "*/20 * * * * *");
  }

  get paymentOrderCloseCron() {
    return this.optional("PAYMENT_ORDER_CLOSE_CRON", "*/30 * * * * *");
  }

  get paymentOrderSyncBatchSize() {
    return this.number("PAYMENT_ORDER_SYNC_BATCH_SIZE", 50);
  }

  get paymentOrderCloseBatchSize() {
    return this.number("PAYMENT_ORDER_CLOSE_BATCH_SIZE", 50);
  }

  get paymentOrderProcessingStaleSeconds() {
    return this.number("PAYMENT_ORDER_PROCESSING_STALE_SECONDS", 120);
  }

  get autoCreditSchedulerEnabled() {
    return this.boolean("AUTO_CREDIT_SCHEDULER_ENABLED") ?? true;
  }

  get autoCreditRuleScanCron() {
    return this.optional("AUTO_CREDIT_RULE_SCAN_CRON", "0 */5 * * * *");
  }

  get initialAccountBalance() {
    return this.number("INITIAL_ACCOUNT_BALANCE", 100);
  }

  get logLevel() {
    return this.parseLogLevel("LOG_LEVEL", "info");
  }
}

export const env = new EnvConfig();
