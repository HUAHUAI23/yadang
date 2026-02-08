// 统一加载 .env，并提供服务端环境变量管理类。
import "server-only";

import { config } from "dotenv";

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

  private number(key: string, fallback: number) {
    const raw = process.env[key];
    if (!raw) return fallback;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
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
    return this.requiredAny([
      "ALIYUN_SMS_ACCESS_KEY_ID",
      "ALIBABA_CLOUD_ACCESS_KEY_ID",
    ]);
  }

  get aliyunSmsAccessKeySecret() {
    return this.requiredAny([
      "ALIYUN_SMS_ACCESS_KEY_SECRET",
      "ALIBABA_CLOUD_ACCESS_KEY_SECRET",
    ]);
  }

  get aliyunSmsSignName() {
    return this.required("ALIYUN_SMS_SIGN_NAME");
  }

  get aliyunSmsTemplateCode() {
    return this.required("ALIYUN_SMS_TEMPLATE_CODE");
  }

  get aliyunSmsRegion() {
    return this.optional("ALIYUN_SMS_REGION", "cn-hangzhou");
  }

  get aliyunSmsEndpoint() {
    return this.optional("ALIYUN_SMS_ENDPOINT", "dysmsapi.aliyuncs.com");
  }
}

export const env = new EnvConfig();
