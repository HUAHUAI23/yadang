import { env } from "@/lib/env";
import type { VectorizeResult } from "@/lib/server/trademark-search/types";

import "server-only";

const parseVector = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const numberValue = Number(item);
    if (!Number.isFinite(numberValue)) {
      throw new Error("向量接口返回了非法数值");
    }
    return numberValue;
  });
};

export async function vectorizeImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<VectorizeResult> {
  const startedAt = Date.now();
  const dimension = env.vectorDimension;

  try {
    const response = await fetch(env.vectorApiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.vectorApiKey
          ? { Authorization: `Bearer ${env.vectorApiKey}` }
          : {}),
      },
      body: JSON.stringify({
        model: env.vectorModelId,
        imageBase64: imageBuffer.toString("base64"),
        mimeType,
      }),
      signal: AbortSignal.timeout(env.vectorApiTimeoutMs),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      let detail = "";
      if (contentType.includes("application/json")) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { detail?: string; message?: string }
          | null;
        detail =
          errorPayload?.detail?.trim() ??
          errorPayload?.message?.trim() ??
          "";
      } else {
        detail = (await response.text().catch(() => "")).trim();
      }

      throw new Error(
        detail
          ? `向量接口返回异常状态: ${response.status} - ${detail}`
          : `向量接口返回异常状态: ${response.status}`,
      );
    }

    const payload = (await response.json()) as {
      vector?: unknown;
      model?: string;
      provider?: string;
      [key: string]: unknown;
    };

    const vector = parseVector(payload.vector);

    if (!vector.length) {
      throw new Error("向量接口返回空向量");
    }

    if (vector.length !== dimension) {
      throw new Error(
        `向量维度不匹配，期望 ${dimension}，实际 ${vector.length}`,
      );
    }

    return {
      vector,
      provider: payload.provider ?? "external-api",
      model: payload.model ?? env.vectorModelId,
      dimension,
      latencyMs: Date.now() - startedAt,
      raw: payload,
    };
  } catch (error) {
    throw new Error(`向量化失败: ${(error as Error).message}`);
  }
}
