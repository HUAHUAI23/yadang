export enum SearchType {
  TRADEMARK = "TRADEMARK",
}

export interface TrademarkResultItem {
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
  distance: number;
  serialNum: string;
  imageName: string;
}

export interface SearchHistoryItem {
  id: string;
  timestamp: number;
  queryImageUrl: string;
  cost: number;
  status: "SUCCESS" | "FAILED";
  resultCount: number;
  results: TrademarkResultItem[];
}

export interface SearchResponse {
  searchId: string;
  cost: number;
  balance: number;
  queryImageUrl: string;
  resultCount: number;
  results: TrademarkResultItem[];
}

export interface SearchPrice {
  code: string;
  amount: number;
  balance: number;
}

export interface AccountState {
  id: number;
  balance: number;
}

export interface RechargePackage {
  id: string;
  amount: number;
  credits: number;
  isPopular?: boolean;
}

export interface RechargeResult {
  packageId: string;
  amount: number;
  credits: number;
  balance: number;
}

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
  account: AccountState;
};

