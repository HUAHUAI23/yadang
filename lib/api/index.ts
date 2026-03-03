import { request } from "@/lib/api/client";
import type {
  AlipayCloseOrderResult,
  AlipayCreateOrderResult,
  AlipayQueryOrderResult,
  ApiResponse,
  AuthConfig,
  AuthResult,
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
    payload: { amount: number; provider?: "alipay" | "wechat" | "stripe" }
  ): Promise<ApiResponse<AlipayCreateOrderResult>> =>
    request("/api/recharge", {
      method: "POST",
      body: payload,
    }),
  alipayCreateOrder: (
    payload: { amount: number }
  ): Promise<ApiResponse<AlipayCreateOrderResult>> =>
    request("/api/alipay/create-order", {
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
};
