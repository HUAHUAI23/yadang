import { externalPrisma } from "@/lib/db/external";
import { normalizeMilvusImageObjectKey, signResultImageUrl } from "@/lib/server/trademark-search/oss";
import type {
  MilvusSearchResult,
  PatentDesignMatch,
  SearchRecordPayload,
  TrademarkResultItem,
} from "@/lib/server/trademark-search/types";
import {
  extractPublicationNumber,
  formatDate,
  normalizeSerialNum,
} from "@/lib/server/trademark-search/utils";

import "server-only";

const buildDescription = (record: {
  inventor: string | null;
  priorArtKeywords: string | null;
  assigneeCurrent: string | null;
}) => {
  const chunks = [
    record.priorArtKeywords ? `关键词: ${record.priorArtKeywords}` : "",
    record.inventor ? `发明人: ${record.inventor}` : "",
    record.assigneeCurrent ? `当前权利人: ${record.assigneeCurrent}` : "",
  ].filter(Boolean);

  return chunks.join(" | ") || "暂无公开描述";
};

const parseImageList = (value: string | null): string[] => {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export async function resolveSearchResults(
  milvus: MilvusSearchResult,
): Promise<SearchRecordPayload> {
  const publicationNumbers = new Set<string>();
  const serialNums = new Set<string>();

  for (const hit of milvus.hits) {
    const publication = extractPublicationNumber(hit.imageName);
    if (publication) publicationNumbers.add(publication);

    const serial = normalizeSerialNum(hit.serialNum);
    if (serial) serialNums.add(serial);
  }

  const orConditions: Array<Record<string, unknown>> = [];
  if (publicationNumbers.size > 0) {
    orConditions.push({
      publicationNumber: { in: Array.from(publicationNumbers) },
    });
  }
  if (serialNums.size > 0) {
    orConditions.push({
      numberWithoutCodes: { in: Array.from(serialNums) },
    });
  }

  const matched = orConditions.length
    ? await externalPrisma.patent_design.findMany({
        where: { OR: orConditions as any[] },
      })
    : [];

  const byPublication = new Map<string, (typeof matched)[number]>();
  const bySerial = new Map<string, (typeof matched)[number]>();

  for (const item of matched) {
    byPublication.set(item.publicationNumber, item);
    const serial = normalizeSerialNum(item.numberWithoutCodes ?? "");
    if (serial) {
      bySerial.set(serial, item);
    }
  }

  const matchedRecords: PatentDesignMatch[] = [];
  const results: TrademarkResultItem[] = [];
  const usedPublication = new Set<string>();

  for (const hit of milvus.hits) {
    const publication = extractPublicationNumber(hit.imageName);
    const serial = normalizeSerialNum(hit.serialNum);
    const record =
      (publication ? byPublication.get(publication) : undefined) ||
      (serial ? bySerial.get(serial) : undefined);

    if (!record) continue;
    if (usedPublication.has(record.publicationNumber)) continue;
    usedPublication.add(record.publicationNumber);

    const normalizedObjectKey = normalizeMilvusImageObjectKey(hit.imageName);
    const imageUrl = await signResultImageUrl(normalizedObjectKey);
    const similarityScore = Number(
      (1 / (1 + Math.max(hit.distance, 0))).toFixed(6),
    );

    matchedRecords.push({
      publicationNumber: record.publicationNumber,
      title: record.publicationDescription ?? record.publicationNumber,
      owner: record.assigneeCurrent ?? record.assigneeOriginal ?? "-",
      filingDate: formatDate(record.filingDate),
      issueDate: formatDate(record.publicationDate),
      description: buildDescription(record),
      imageList: parseImageList(record.imageList),
    });

    results.push({
      id: `${record.publicationNumber}-${hit.id || results.length}`,
      type: "TRADEMARK",
      title: record.publicationDescription ?? record.publicationNumber,
      number: record.publicationNumber,
      owner: record.assigneeCurrent ?? record.assigneeOriginal ?? "-",
      filingDate: formatDate(record.filingDate),
      issueDate: formatDate(record.publicationDate),
      description: buildDescription(record),
      imageUrl,
      status: "Active",
      similarityScore,
      distance: hit.distance,
      serialNum: serial || normalizeSerialNum(record.numberWithoutCodes ?? ""),
      imageName: hit.imageName,
      imageList: parseImageList(record.imageList),
    });
  }

  return {
    milvus,
    matchedSerialNums: Array.from(serialNums),
    matchedRecords,
    results,
  };
}
