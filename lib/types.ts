export type SearchConfig = {
  patents: boolean;
  trademarks: boolean;
};

export enum SearchType {
  DESIGN_PATENT = "DESIGN_PATENT",
  TRADEMARK = "TRADEMARK",
}

export interface PatentResult {
  id: string;
  type: SearchType;
  title: string;
  number: string;
  owner: string;
  filingDate: string;
  issueDate?: string;
  description: string;
  imageUrl: string;
  status: string;
  similarityScore: number;
}

export interface UserCredits {
  balance: number;
  totalRecharged: number;
}

export interface RechargePackage {
  id: string;
  amount: number;
  credits: number;
  isPopular?: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  thumbnail: string;
  config: SearchConfig;
  cost: number;
  results: SearchResponse;
}

export type SearchResponse = {
  patents: PatentResult[];
  trademarks: PatentResult[];
};

export type ApiResponse<T> = {
  code: number;
  data: T;
  message?: string;
};

export type AuthPayload = {
  phone: string;
  password: string;
};

export type RegisterPayload = {
  phone: string;
  sms: string;
  password: string;
};

export type AuthResult = {
  token: string;
};
