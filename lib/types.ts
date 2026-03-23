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
  imageList?: string[];
}

export interface SearchHistoryItem {
  id: string;
  timestamp: number;
  queryImageUrl: string;
  cost: number; // 元
  status: "SUCCESS" | "FAILED";
  resultCount: number;
  results: TrademarkResultItem[];
}

export interface SearchResponse {
  searchId: string;
  cost: number; // 元
  balance: number; // 元
  queryImageUrl: string;
  resultCount: number;
  results: TrademarkResultItem[];
}

export interface SearchPrice {
  code: string;
  amount: number; // 元
  balance: number; // 元
}

export interface AccountState {
  id: number;
  balance: number; // 元
}

export interface AutoCreditRuleView {
  id: number;
  name: string;
  intervalDays: number;
  amount: number; // 元
  enabled: boolean;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByName: string | null;
  updatedByName: string | null;
}

export interface AdminUserView {
  id: number;
  username: string | null;
  phone: string | null;
  avatar: string;
  isAdmin: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  balance: number; // 元
  createdAt: string;
  updatedAt: string;
}

export interface AdminAccountAdjustmentResult {
  user: AdminUserView;
  transaction: {
    id: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    type: string;
    description: string;
    createdAt: string;
  };
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

export type {
  AlipayCloseOrderResult,
  AlipayCreateOrderResult,
  AlipayQueryOrderResult,
  ChargeOrderItem,
  ChargeOrderStatusView,
  ChargeOrderView,
  PaymentConfigResult,
  PaymentConfigView,
  TransactionItem,
  TransactionView,
} from "./types/payment";

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
  isAdmin: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
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
