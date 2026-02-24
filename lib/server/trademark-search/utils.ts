import { createHash, randomUUID } from "node:crypto";

import { env } from "@/lib/env";

import "server-only";

const DATA_URL_RE = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=\s]+)$/;

export type DecodedImage = {
  buffer: Buffer;
  mimeType: string;
  extension: string;
};

const mimeToExt = (mimeType: string) => {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/jpg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/bmp") return "bmp";
  if (mimeType === "image/gif") return "gif";
  return "bin";
};

export const decodeBase64Image = (value: string): DecodedImage => {
  const raw = value.trim();
  const matched = raw.match(DATA_URL_RE);

  let mimeType = "application/octet-stream";
  let base64Value = raw;

  if (matched?.[2]) {
    mimeType = matched[1] || mimeType;
    base64Value = matched[2];
  }

  const buffer = Buffer.from(base64Value.replace(/\s+/g, ""), "base64");
  if (!buffer.length) {
    throw new Error("图片数据为空");
  }

  const maxBytes = 10 * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw new Error("图片过大，最大支持 10MB");
  }

  if (!mimeType.startsWith("image/")) {
    throw new Error("仅支持图片文件");
  }

  return {
    buffer,
    mimeType,
    extension: mimeToExt(mimeType),
  };
};

export const sha256OfBuffer = (buffer: Buffer) => {
  return createHash("sha256").update(buffer).digest("hex");
};

export const buildUploadObjectKey = (extension: string) => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getUTCDate()}`.padStart(2, "0");
  const folder = `${env.aliyunOssUploadPrefix}/${yyyy}/${mm}/${dd}`;
  return `${folder}/${randomUUID()}.${extension}`;
};

export const bigIntToNumber = (value: bigint) => {
  const asNumber = Number(value);
  if (!Number.isFinite(asNumber)) {
    throw new Error("数值超出可序列化范围");
  }
  return asNumber;
};

export const formatDate = (value: Date | null | undefined) => {
  if (!value) return "";
  const yyyy = value.getUTCFullYear();
  const mm = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${value.getUTCDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const normalizeSerialNum = (value: string) => {
  return value.replace(/[^0-9]/g, "");
};

export const extractPublicationNumber = (imageName: string) => {
  const matched = imageName.match(/(USD\d{4,})/i);
  if (!matched?.[1]) return "";
  return matched[1].toUpperCase();
};

export const parseMilvusSearchParams = () => {
  const raw = env.milvusSearchParams;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    // ignore invalid config and fallback to empty params
  }
  return {};
};

export const toJsonSafe = (value: unknown) => {
  return JSON.parse(
    JSON.stringify(value, (_, currentValue: unknown) => {
      if (typeof currentValue === "bigint") {
        return currentValue.toString();
      }
      if (currentValue instanceof Date) {
        return currentValue.toISOString();
      }
      return currentValue;
    }),
  ) as unknown;
};
