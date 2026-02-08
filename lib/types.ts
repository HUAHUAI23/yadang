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
  data: T | null;
  message?: string;
};

export type AuthConfig = {
  password: boolean;
  sms: boolean;
};

export type AuthUser = {
  id: number;
  username: string | null;
  phone: string | null;
  avatar: string;
};

export type PasswordLoginPayload = {
  username: string;
  password: string;
};

export type SmsLoginPayload = {
  phone: string;
  sms: string;
};

export type RegisterPayload = {
  username: string;
  phone: string;
  sms?: string;
  password: string;
};

export type SmsSendPayload = {
  phone: string;
  purpose: "login" | "register";
};

export type AuthResult = {
  user: AuthUser;
  credits: UserCredits;
};
