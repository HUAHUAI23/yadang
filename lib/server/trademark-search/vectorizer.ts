import { createHash } from "node:crypto";

import { env } from "@/lib/env";
import type { VectorizeResult } from "@/lib/server/trademark-search/types";

import "server-only";

const buildMockVector = (buffer: Buffer, dimension: number) => {
  const digest = createHash("sha256").update(buffer).digest();
  return Array.from({ length: dimension }, (_, index) => {
    const byte = digest[index % digest.length] ?? 0;
    return Number((byte / 255).toFixed(6));
  });
};

const shouldUseMockVector = () => {
  const endpoint = env.vectorApiEndpoint;
  return endpoint.includes("example.com");
};

export async function vectorizeImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<VectorizeResult> {
  const startedAt = Date.now();
  const dimension = env.vectorDimension;

  // Pseudo implementation:
  // 1) send the image to a standard external embedding API;
  // 2) parse `vector` from response;
  // 3) fallback to deterministic mock vector when API is unavailable.
  if (shouldUseMockVector()) {
    return {
      vector: buildMockVector(imageBuffer, dimension),
      provider: "mock-api",
      model: env.vectorModelId,
      dimension,
      latencyMs: Date.now() - startedAt,
      raw: { mocked: true, reason: "VECTOR_API_ENDPOINT not configured" },
    };
  }

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
      throw new Error(`向量接口返回异常状态: ${response.status}`);
    }

    const payload = (await response.json()) as {
      vector?: number[];
      model?: string;
      provider?: string;
      [key: string]: unknown;
    };

    const vector = Array.isArray(payload.vector)
      ? payload.vector.map((item) => Number(item))
      : [];

    if (!vector.length) {
      throw new Error("向量接口返回空向量");
    }

    return {
      vector,
      provider: payload.provider ?? "external-api",
      model: payload.model ?? env.vectorModelId,
      dimension: vector.length,
      latencyMs: Date.now() - startedAt,
      raw: payload,
    };
  } catch (error) {
    return {
      vector: buildMockVector(imageBuffer, dimension),
      provider: "mock-api-fallback",
      model: env.vectorModelId,
      dimension,
      latencyMs: Date.now() - startedAt,
      raw: {
        mocked: true,
        reason: (error as Error).message,
      },
    };
  }
}

