import { request } from "@/lib/api/client";
import type {
  ApiResponse,
  AuthConfig,
  AuthResult,
  PasswordLoginPayload,
  RechargeResult,
  RegisterPayload,
  SearchHistoryItem,
  SearchPrice,
  SearchResponse,
  SmsLoginPayload,
  SmsSendPayload,
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
  recharge: (packageId: string): Promise<ApiResponse<RechargeResult>> =>
    request("/api/recharge", {
      method: "POST",
      body: { packageId },
    }),
  clearHistory: (): Promise<ApiResponse<{ ok: boolean }>> =>
    request("/api/history/clear", {
      method: "POST",
    }),
};
