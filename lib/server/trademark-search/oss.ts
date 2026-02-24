import { createRequire } from "node:module";

import { env } from "@/lib/env";

import "server-only";

const loadModule = createRequire(import.meta.url);

const globalForOss = globalThis as unknown as {
  trademarkOssClient?: any;
};

const createClient = () => {
  const OSS = loadModule("ali-oss") as new (
    options: Record<string, unknown>,
  ) => any;

  const options: Record<string, unknown> = {
    region: env.aliyunOssRegion,
    bucket: env.aliyunOssBucket,
    accessKeyId: env.aliyunOssAccessKeyId,
    accessKeySecret: env.aliyunOssAccessKeySecret,
  };

  if (env.aliyunOssEndpoint) {
    options.endpoint = env.aliyunOssEndpoint;
  }

  const client = new OSS(options);

  return client;
};

const getOssClient = () => {
  if (globalForOss.trademarkOssClient) {
    return globalForOss.trademarkOssClient;
  }

  const client = createClient();
  if (process.env.NODE_ENV !== "production") {
    globalForOss.trademarkOssClient = client;
  }
  return client;
};

export async function uploadSearchImage(
  objectKey: string,
  buffer: Buffer,
  mimeType: string,
) {
  const client = getOssClient();

  await client.put(objectKey, buffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });

  const url = client.signatureUrl(objectKey, {
    expires: env.aliyunOssSignedUrlExpiresSeconds,
  });

  return { objectKey, url };
}

export function signResultImageUrl(objectKey: string) {
  const client = getOssClient();

  return client.signatureUrl(objectKey, {
    expires: env.aliyunOssSignedUrlExpiresSeconds,
  });
}

export function normalizeMilvusImageObjectKey(imageName: string) {
  const normalized = imageName.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.startsWith("images/")) {
    return normalized;
  }

  const pagesIndex = normalized.indexOf("pages/");
  if (pagesIndex >= 0) {
    return normalized.slice(pagesIndex + "pages/".length);
  }

  const specialIndex = normalized.indexOf("USD575653S1/");
  if (specialIndex >= 0) {
    return normalized.slice(specialIndex + "USD575653S1/".length);
  }

  if (normalized.length > 10) {
    return `images/${normalized.slice(10)}`;
  }

  return normalized;
}
