import "server-only";

import Credential, * as $Credential from "@alicloud/credentials";
import Dysmsapi20170525, * as $Dysmsapi20170525 from "@alicloud/dysmsapi20170525";
import * as $OpenApi from "@alicloud/openapi-client";
import * as $Util from "@alicloud/tea-util";

import { env } from "@/lib/env";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? "");
};

const mapSmsSendError = (error: unknown) => {
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("readtimeout") || normalized.includes("connecttimeout")) {
    return "短信服务连接超时，请稍后重试";
  }

  if (
    normalized.includes("eai_again") ||
    normalized.includes("enotfound") ||
    normalized.includes("could not resolve host")
  ) {
    return "短信服务域名解析失败，请检查服务器 DNS 配置";
  }

  if (
    normalized.includes("econnrefused") ||
    normalized.includes("ehostunreach") ||
    normalized.includes("network")
  ) {
    return "短信服务网络不可达，请检查服务器网络配置";
  }

  return message || "短信发送失败";
};

const createClient = () => {
  const credentialConfig = new $Credential.Config({
    type: "access_key",
    accessKeyId: env.aliyunSmsAccessKeyId,
    accessKeySecret: env.aliyunSmsAccessKeySecret,
  });
  const credentialClient = new Credential(credentialConfig);

  const config = new $OpenApi.Config({
    credential: credentialClient,
  });
  config.endpoint = env.aliyunSmsEndpoint;
  return new Dysmsapi20170525(config);
};

export async function sendSmsCode(phone: string, code: string) {
  const client = createClient();
  const request = new $Dysmsapi20170525.SendSmsRequest({
    phoneNumbers: phone,
    signName: env.aliyunSmsSignName,
    templateCode: env.aliyunSmsTemplateCode,
    templateParam: JSON.stringify({ code }),
  });

  const runtime = new $Util.RuntimeOptions({
    connectTimeout: env.aliyunSmsConnectTimeoutMs,
    readTimeout: env.aliyunSmsReadTimeoutMs,
    autoretry: env.aliyunSmsAutoRetry,
    maxAttempts: env.aliyunSmsMaxAttempts,
  });

  let response;
  try {
    response = await client.sendSmsWithOptions(request, runtime);
  } catch (error) {
    throw new Error(mapSmsSendError(error));
  }

  const body = response.body;

  if (!body) {
    throw new Error("短信发送失败");
  }

  const responseCode = body.code;
  if (responseCode && responseCode !== "OK") {
    const message = body.message ?? "短信发送失败";
    throw new Error(message);
  }

  return body;
}
