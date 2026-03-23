import { request } from "@/lib/api/client";
import type {
  AdminAccountAdjustmentResult,
  AdminUserView,
  AlipayCloseOrderResult,
  AlipayCreateOrderResult,
  AlipayQueryOrderResult,
  ApiResponse,
  AuthConfig,
  AuthResult,
  AutoCreditRuleView,
  ChargeOrderItem,
  PasswordLoginPayload,
  PaymentConfigResult,
  RegisterPayload,
  SearchHistoryItem,
  SearchPrice,
  SearchResponse,
  SmsLoginPayload,
  SmsSendPayload,
  TransactionItem,
} from "@/lib/types";

export const api = {
  search: (payload: { imageBase64: string }): Promise<ApiResponse<SearchResponse>> =>
    request("/api/search", {
      method: "POST",
      body: payload,
    }),
  searchPrice: (): Promise<ApiResponse<SearchPrice>> =>
    request("/api/search/price", {
      method: "GET",
    }),
  searchHistory: (): Promise<ApiResponse<{ items: SearchHistoryItem[] }>> =>
    request("/api/search/history", {
      method: "GET",
    }),
  authLoginPassword: (
    payload: PasswordLoginPayload
  ): Promise<ApiResponse<AuthResult>> =>
    request("/api/auth/login/password", {
      method: "POST",
      body: payload,
    }),
  authLoginSms: (payload: SmsLoginPayload): Promise<ApiResponse<AuthResult>> =>
    request("/api/auth/login/sms", {
      method: "POST",
      body: payload,
    }),
  authRegister: (
    payload: RegisterPayload
  ): Promise<ApiResponse<AuthResult>> =>
    request("/api/auth/register", {
      method: "POST",
      body: payload,
    }),
  authConfig: (): Promise<ApiResponse<AuthConfig>> =>
    request("/api/auth/config", {
      method: "GET",
    }),
  authMe: (): Promise<ApiResponse<AuthResult>> =>
    request("/api/auth/me", {
      method: "GET",
    }),
  authLogout: (): Promise<ApiResponse<{ ok: boolean }>> =>
    request("/api/auth/logout", {
      method: "POST",
    }),
  sendSms: (payload: SmsSendPayload): Promise<ApiResponse<{ sent: boolean }>> =>
    request("/api/auth/sms", {
      method: "POST",
      body: payload,
    }),
  paymentConfig: (): Promise<ApiResponse<PaymentConfigResult>> =>
    request("/api/payment/config", {
      method: "GET",
    }),
  rechargeCreateOrder: (
    payload: { amount: number }
  ): Promise<ApiResponse<AlipayCreateOrderResult>> =>
    request("/api/recharge", {
      method: "POST",
      body: payload,
    }),
  alipayQueryOrder: (
    payload: { outTradeNo?: string; chargeOrderId?: number }
  ): Promise<ApiResponse<AlipayQueryOrderResult>> => {
    const params = new URLSearchParams();
    if (payload.outTradeNo) params.set("outTradeNo", payload.outTradeNo);
    if (payload.chargeOrderId) params.set("chargeOrderId", String(payload.chargeOrderId));
    const query = params.toString();
    return request(`/api/alipay/query-order${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  alipayCloseOrder: (
    payload: { outTradeNo: string }
  ): Promise<ApiResponse<AlipayCloseOrderResult>> =>
    request("/api/alipay/close-order", {
      method: "POST",
      body: payload,
    }),
  rechargeOrders: (
    limit = 20
  ): Promise<ApiResponse<{ items: ChargeOrderItem[] }>> =>
    request(`/api/recharge/orders?limit=${limit}`, {
      method: "GET",
    }),
  transactions: (
    payload: { limit?: number; kind?: "all" | "recharge" | "expense" } = {}
  ): Promise<ApiResponse<{ items: TransactionItem[]; kind: "all" | "recharge" | "expense" }>> => {
    const params = new URLSearchParams();
    if (payload.limit) params.set("limit", String(payload.limit));
    if (payload.kind) params.set("kind", payload.kind);
    const query = params.toString();
    return request(`/api/transactions${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  clearHistory: (): Promise<ApiResponse<{ ok: boolean }>> =>
    request("/api/history/clear", {
      method: "POST",
    }),
  adminUsers: (
    keyword?: string
  ): Promise<ApiResponse<{ items: AdminUserView[] }>> => {
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    return request(`/api/admin/users${query}`, {
      method: "GET",
    });
  },
  adminUpdateRole: (
    userId: number,
    payload: { isAdmin: boolean }
  ): Promise<ApiResponse<{ user: AdminUserView }>> =>
    request(`/api/admin/users/${userId}/role`, {
      method: "POST",
      body: payload,
    }),
  adminUpdateBlacklist: (
    userId: number,
    payload: { isBlacklisted: boolean; reason?: string }
  ): Promise<ApiResponse<{ user: AdminUserView }>> =>
    request(`/api/admin/users/${userId}/blacklist`, {
      method: "POST",
      body: payload,
    }),
  adminAdjustAccount: (
    userId: number,
    payload: { action: "add" | "subtract" | "reset"; amount?: number; reason: string }
  ): Promise<ApiResponse<AdminAccountAdjustmentResult>> =>
    request(`/api/admin/users/${userId}/account-adjustment`, {
      method: "POST",
      body: payload,
    }),
  adminAutoCreditRules: (): Promise<ApiResponse<{ items: AutoCreditRuleView[] }>> =>
    request("/api/admin/auto-credit-rules", {
      method: "GET",
    }),
  adminCreateAutoCreditRule: (
    payload: { name: string; intervalDays: number; amount: number; enabled: boolean }
  ): Promise<ApiResponse<{ item: AutoCreditRuleView }>> =>
    request("/api/admin/auto-credit-rules", {
      method: "POST",
      body: payload,
    }),
  adminUpdateAutoCreditRule: (
    ruleId: number,
    payload: Partial<{
      name: string;
      intervalDays: number;
      amount: number;
      enabled: boolean;
    }>
  ): Promise<ApiResponse<{ item: AutoCreditRuleView }>> =>
    request(`/api/admin/auto-credit-rules/${ruleId}`, {
      method: "PATCH",
      body: payload,
    }),
};
