export type UploadedImage = {
  objectKey: string;
  url: string;
  sha256: string;
  mimeType: string;
  size: number;
};

export type VectorizeResult = {
  vector: number[];
  provider: string;
  model: string;
  dimension: number;
  latencyMs: number;
  raw: unknown;
};

export type MilvusHit = {
  id: string;
  score: number;
  distance: number;
  imageName: string;
  serialNum: string;
};

export type MilvusSearchResult = {
  collection: string;
  topK: number;
  latencyMs: number;
  raw: unknown;
  hits: MilvusHit[];
};

export type PatentDesignMatch = {
  publicationNumber: string;
  title: string;
  owner: string;
  filingDate: string;
  issueDate: string;
  description: string;
  imageList?: string[];
};

export type TrademarkResultItem = {
  id: string;
  type: "TRADEMARK";
  title: string;
  number: string;
  owner: string;
  filingDate: string;
  issueDate: string;
  description: string;
  imageUrl: string;
  status: string;
  similarityScore: number;
  distance: number;
  serialNum: string;
  imageName: string;
  imageList?: string[];
};

export type SearchRecordPayload = {
  milvus: MilvusSearchResult;
  matchedSerialNums: string[];
  matchedRecords: PatentDesignMatch[];
  results: TrademarkResultItem[];
};
