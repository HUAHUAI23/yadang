import { randomUUID } from "node:crypto";

import { businessPrisma } from "@/lib/db/business";
import { env } from "@/lib/env";
import { applyAccountChange } from "@/lib/server/trademark-search/account-ledger";
import { searchMilvusByVector } from "@/lib/server/trademark-search/milvus";
import { signResultImageUrl, uploadSearchImage } from "@/lib/server/trademark-search/oss";
import {
  type EffectivePrice,
  getEffectiveSearchPrice,
} from "@/lib/server/trademark-search/pricing";
import type {
  MilvusSearchResult,
  SearchRecordPayload,
  TrademarkResultItem,
  UploadedImage,
  VectorizeResult,
} from "@/lib/server/trademark-search/types";
import {
  bigIntToNumber,
  buildUploadObjectKey,
  decodeBase64Image,
  sha256OfBuffer,
  toJsonSafe,
} from "@/lib/server/trademark-search/utils";
import { vectorizeImage } from "@/lib/server/trademark-search/vectorizer";
import type { Prisma } from "@/prisma/generated/business/client";
import { SearchRecordStatus, TransactionType } from "@/prisma/generated/business/enums";

import "server-only";

export type SearchResponseDTO = {
  searchId: string;
  cost: number;
  balance: number;
  queryImageUrl: string;
  resultCount: number;
  results: TrademarkResultItem[];
};

export type SearchHistoryItemDTO = {
  id: string;
  timestamp: number;
  queryImageUrl: string;
  cost: number;
  status: SearchRecordStatus;
  resultCount: number;
  results: TrademarkResultItem[];
};

type SearchInput = {
  userId: number;
  accountId: number;
  accountBalance: bigint;
  imageBase64: string;
  requestId?: string;
};

type UploadedImageRef = Pick<UploadedImage, "objectKey" | "url">;

type SearchDependencies = {
  upload: (
    objectKey: string,
    buffer: Buffer,
    mimeType: string,
  ) => Promise<UploadedImageRef>;
  vectorize: (buffer: Buffer, mimeType: string) => Promise<VectorizeResult>;
};

const parseResultsFromJson = (value: unknown): TrademarkResultItem[] => {
  if (!Array.isArray(value)) return [];
  return value as TrademarkResultItem[];
};

const hydrateResultImages = (items: TrademarkResultItem[]) => {
  return items.map((item) => {
    const primaryImageUrl = item.imageList?.[0];
    if (!primaryImageUrl) return item;
    return {
      ...item,
      imageUrl: primaryImageUrl,
    };
  });
};

export class TrademarkSearchService {
  private readonly deps: SearchDependencies;

  constructor(
    deps: Partial<SearchDependencies> = {},
  ) {
    this.deps = {
      upload: uploadSearchImage,
      vectorize: vectorizeImage,
      ...deps,
    };
  }

  private async persistFailedRecord(input: {
    userId: number;
    accountId: number;
    requestId: string;
    effectivePrice: EffectivePrice | null;
    uploadedImage: UploadedImage | null;
    vectorized: VectorizeResult | null;
    milvus: MilvusSearchResult | null;
    resolved: SearchRecordPayload | null;
    message: string;
  }) {
    if (!input.effectivePrice || !input.uploadedImage) {
      return;
    }

    await businessPrisma.trademarkSearchRecord.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        searchPriceId: input.effectivePrice.id,
        requestId: input.requestId,
        status: SearchRecordStatus.FAILED,
        searchPriceAmount: input.effectivePrice.amount,
        queryImageObjectKey: input.uploadedImage.objectKey,
        queryImageUrl: input.uploadedImage.url,
        queryImageSha256: input.uploadedImage.sha256,
        queryImageMimeType: input.uploadedImage.mimeType,
        queryImageSize: input.uploadedImage.size,
        queryVector: toJsonSafe(
          input.vectorized?.vector ?? [],
        ) as Prisma.InputJsonValue,
        vectorProvider: input.vectorized?.provider ?? "unknown",
        vectorModel: input.vectorized?.model ?? env.vectorModelId,
        vectorDimension: input.vectorized?.dimension ?? env.vectorDimension,
        vectorLatencyMs: input.vectorized?.latencyMs,
        milvusCollection: input.milvus?.collection ?? env.milvusCollectionName,
        milvusTopK: input.milvus?.topK ?? env.milvusTopK,
        milvusLatencyMs: input.milvus?.latencyMs,
        milvusResultCount: input.milvus?.hits.length ?? 0,
        milvusResults: toJsonSafe(
          input.milvus?.raw ?? { error: input.message },
        ) as Prisma.InputJsonValue,
        matchedSerialNums: toJsonSafe(
          input.resolved?.matchedSerialNums ?? [],
        ) as Prisma.InputJsonValue,
        matchedRecords: toJsonSafe(
          input.resolved?.matchedRecords ?? [],
        ) as Prisma.InputJsonValue,
        responseItems: toJsonSafe(
          input.resolved?.results ?? [],
        ) as Prisma.InputJsonValue,
        resultCount: input.resolved?.results.length ?? 0,
        errorMessage: input.message,
        completedAt: new Date(),
      },
    });
  }

  async search(input: SearchInput): Promise<SearchResponseDTO> {
    const requestId = input.requestId ?? randomUUID();
    let effectivePrice: EffectivePrice | null = null;
    let uploadedImage: UploadedImage | null = null;
    let vectorized: VectorizeResult | null = null;
    let milvus: MilvusSearchResult | null = null;
    let resolved: SearchRecordPayload | null = null;

    try {
      effectivePrice = await getEffectiveSearchPrice(input.userId);
      if (input.accountBalance < effectivePrice.amount) {
        throw new Error("余额不足，请先充值");
      }

      const decoded = decodeBase64Image(input.imageBase64);
      const imageSha256 = sha256OfBuffer(decoded.buffer);
      const objectKey = buildUploadObjectKey({
        extension: decoded.extension,
        userId: input.userId,
        requestId,
        sha256: imageSha256,
      });

      const uploadedRaw = await this.deps.upload(
        objectKey,
        decoded.buffer,
        decoded.mimeType,
      );

      uploadedImage = {
        objectKey: uploadedRaw.objectKey,
        url: uploadedRaw.url,
        sha256: imageSha256,
        mimeType: decoded.mimeType,
        size: decoded.buffer.length,
      };

      vectorized = await this.deps.vectorize(decoded.buffer, decoded.mimeType);
      milvus = await searchMilvusByVector(vectorized.vector);
      const { resolveSearchResults } = await import(
        "@/lib/server/trademark-search/repository"
      );
      resolved = await resolveSearchResults(milvus);
      if (!effectivePrice || !uploadedImage || !vectorized || !milvus || !resolved) {
        throw new Error("检索状态异常");
      }
      const selectedPrice = effectivePrice;
      const queryImage = uploadedImage;
      const queryVector = vectorized;
      const milvusResult = milvus;
      const resolvedPayload = resolved;

      const persisted = await businessPrisma.$transaction(async (tx) => {
        const ledger = await applyAccountChange(tx, {
          userId: input.userId,
          accountId: input.accountId,
          type: TransactionType.SEARCH_DEBIT,
          delta: -selectedPrice.amount,
          description: "商标图片检索扣费",
          bizId: requestId,
          metadata: toJsonSafe({
            requestId,
            searchPriceId: selectedPrice.id,
            collection: milvusResult.collection,
            topK: milvusResult.topK,
            resultCount: resolvedPayload.results.length,
          }) as Prisma.InputJsonValue,
        });

        const record = await tx.trademarkSearchRecord.create({
          data: {
            userId: input.userId,
            accountId: input.accountId,
            searchPriceId: selectedPrice.id,
            transactionId: ledger.transactionId,
            requestId,
            status: SearchRecordStatus.SUCCESS,
            searchPriceAmount: selectedPrice.amount,
            queryImageObjectKey: queryImage.objectKey,
            queryImageUrl: queryImage.url,
            queryImageSha256: queryImage.sha256,
            queryImageMimeType: queryImage.mimeType,
            queryImageSize: queryImage.size,
            queryVector: toJsonSafe(queryVector.vector) as Prisma.InputJsonValue,
            vectorProvider: queryVector.provider,
            vectorModel: queryVector.model,
            vectorDimension: queryVector.dimension,
            vectorLatencyMs: queryVector.latencyMs,
            milvusCollection: milvusResult.collection,
            milvusTopK: milvusResult.topK,
            milvusLatencyMs: milvusResult.latencyMs,
            milvusResultCount: milvusResult.hits.length,
            milvusResults: toJsonSafe(milvusResult.raw) as Prisma.InputJsonValue,
            matchedSerialNums: toJsonSafe(
              resolvedPayload.matchedSerialNums,
            ) as Prisma.InputJsonValue,
            matchedRecords: toJsonSafe(
              resolvedPayload.matchedRecords,
            ) as Prisma.InputJsonValue,
            responseItems: toJsonSafe(resolvedPayload.results) as Prisma.InputJsonValue,
            resultCount: resolvedPayload.results.length,
            completedAt: new Date(),
          },
          select: {
            id: true,
            searchPriceAmount: true,
            queryImageUrl: true,
            resultCount: true,
          },
        });

        return {
          recordId: record.id,
          cost: record.searchPriceAmount,
          balanceAfter: ledger.balanceAfter,
          queryImageUrl: record.queryImageUrl,
          resultCount: record.resultCount,
        };
      });

      return {
        searchId: persisted.recordId.toString(),
        cost: bigIntToNumber(persisted.cost),
        balance: bigIntToNumber(persisted.balanceAfter),
        queryImageUrl: persisted.queryImageUrl,
        resultCount: persisted.resultCount,
        results: resolvedPayload.results,
      };
    } catch (error) {
      const message = (error as Error).message ?? "检索失败，请稍后再试";
      await this.persistFailedRecord({
        userId: input.userId,
        accountId: input.accountId,
        requestId,
        effectivePrice,
        uploadedImage,
        vectorized,
        milvus,
        resolved,
        message,
      }).catch(() => undefined);

      throw error;
    }
  }

  async listHistory(userId: number, limit = 50): Promise<SearchHistoryItemDTO[]> {
    const records = await businessPrisma.trademarkSearchRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        queryImageObjectKey: true,
        searchPriceAmount: true,
        status: true,
        resultCount: true,
        responseItems: true,
      },
    });

    return Promise.all(records.map(async (record) => {
      let queryImageUrl = record.queryImageObjectKey;
      try {
        // Re-sign URLs on read, so history remains valid after previous signatures expire.
        queryImageUrl = await signResultImageUrl(record.queryImageObjectKey);
      } catch {
        queryImageUrl = record.queryImageObjectKey;
      }

      return {
        id: record.id.toString(),
        timestamp: record.createdAt.getTime(),
        queryImageUrl,
        cost: bigIntToNumber(record.searchPriceAmount),
        status: record.status,
        resultCount: record.resultCount,
        results: hydrateResultImages(parseResultsFromJson(record.responseItems)),
      };
    }));
  }

  async clearHistory(userId: number) {
    await businessPrisma.trademarkSearchRecord.deleteMany({
      where: { userId },
    });
  }
}

export const trademarkSearchService = new TrademarkSearchService();
