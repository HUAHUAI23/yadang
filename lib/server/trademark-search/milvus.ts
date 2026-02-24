import { MilvusClient } from "@zilliz/milvus2-sdk-node";

import { env } from "@/lib/env";
import type {
  MilvusHit,
  MilvusSearchResult,
} from "@/lib/server/trademark-search/types";
import { parseMilvusSearchParams } from "@/lib/server/trademark-search/utils";

import "server-only";

const globalForMilvus = globalThis as unknown as {
  milvusClient?: MilvusClient;
  milvusLoadPromise?: Promise<void>;
};

const createMilvusClient = () => {
  return new MilvusClient({
    address: env.milvusAddress,
    token: env.milvusToken ?? `${env.milvusUsername}:${env.milvusPassword}`,
  });
};

const getMilvusClient = () => {
  if (globalForMilvus.milvusClient) {
    return globalForMilvus.milvusClient;
  }

  const client = createMilvusClient();
  if (process.env.NODE_ENV !== "production") {
    globalForMilvus.milvusClient = client;
  }
  return client;
};

const ensureMilvusCollectionLoaded = async () => {
  if (globalForMilvus.milvusLoadPromise) {
    return globalForMilvus.milvusLoadPromise;
  }

  globalForMilvus.milvusLoadPromise = (async () => {
    const milvusClient = getMilvusClient();
    await milvusClient.connectPromise;
    await milvusClient.loadCollectionSync({
      collection_name: env.milvusCollectionName,
    });
  })();

  return globalForMilvus.milvusLoadPromise;
};

const normalizeHits = (results: unknown): MilvusHit[] => {
  if (!Array.isArray(results)) return [];

  const rows = Array.isArray(results[0])
    ? (results[0] as Array<Record<string, unknown>>)
    : (results as Array<Record<string, unknown>>);

  return rows
    .map((row) => {
      const score = Number(row.score ?? 0);
      const imageName = String(row.image_name ?? "");
      const serialNum = String(row.serial_num ?? "");
      const id = String(row.id ?? "");

      return {
        id,
        score,
        distance: score,
        imageName,
        serialNum,
      };
    })
    .filter((item) => item.imageName.length > 0);
};

export async function searchMilvusByVector(
  vector: number[],
): Promise<MilvusSearchResult> {
  const startedAt = Date.now();
  const milvusClient = getMilvusClient();
  await ensureMilvusCollectionLoaded();

  const response = await milvusClient.search({
    collection_name: env.milvusCollectionName,
    anns_field: env.milvusVectorField,
    data: vector,
    limit: env.milvusTopK,
    output_fields: ["image_name", "serial_num"],
    metric_type: env.milvusMetricType,
    params: parseMilvusSearchParams(),
  });

  return {
    collection: env.milvusCollectionName,
    topK: env.milvusTopK,
    latencyMs: Date.now() - startedAt,
    raw: response,
    hits: normalizeHits(response.results),
  };
}
