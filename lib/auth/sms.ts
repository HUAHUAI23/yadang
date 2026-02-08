import "server-only";

import Dysmsapi20180501, * as $Dysmsapi20180501 from "@alicloud/dysmsapi20180501";
import * as $OpenApi from "@alicloud/openapi-client";
import * as $Util from "@alicloud/tea-util";

import { env } from "@/lib/env";

const createClient = () => {
  const config = new $OpenApi.Config({
    accessKeyId: env.aliyunSmsAccessKeyId,
    accessKeySecret: env.aliyunSmsAccessKeySecret,
    regionId: env.aliyunSmsRegion,
  });
  config.endpoint = env.aliyunSmsEndpoint;
  return new Dysmsapi20180501(config);
};

export async function sendSmsCode(phone: string, code: string) {
  const client = createClient() as any;
  const smsModule = $Dysmsapi20180501 as any;
  const requestPayload = {
    phoneNumbers: phone,
    signName: env.aliyunSmsSignName,
    templateCode: env.aliyunSmsTemplateCode,
    templateParam: JSON.stringify({ code }),
  };
  const canSendSms =
    typeof client.sendSmsWithOptions === "function" && smsModule.SendSmsRequest;
  const canSendMessageWithTemplate =
    typeof client.sendMessageWithTemplateWithOptions === "function" &&
    smsModule.SendMessageWithTemplateRequest;
  if (!canSendSms && !canSendMessageWithTemplate) {
    throw new Error("当前阿里云短信 SDK 未提供可用的发送方法");
  }
  const request = canSendSms
    ? new smsModule.SendSmsRequest(requestPayload)
    : new smsModule.SendMessageWithTemplateRequest(requestPayload);

  const runtime = new $Util.RuntimeOptions({});
  const response = canSendSms
    ? await client.sendSmsWithOptions(request, runtime)
    : await client.sendMessageWithTemplateWithOptions(request, runtime);
  const body = response.body;

  if (!body) {
    throw new Error("短信发送失败");
  }
  const responseCode = body?.code ?? body?.Code;
  if (responseCode && responseCode !== "OK") {
    const message = body?.message ?? body?.Message ?? "短信发送失败";
    throw new Error(message);
  }

  return body;
}
