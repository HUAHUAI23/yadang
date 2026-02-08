import { request } from "@/lib/api/client";
import {
  mockSearch,
  mockRecharge,
  mockClearHistory,
} from "@/lib/api/mock";
import type {
  ApiResponse,
  AuthConfig,
  AuthResult,
  PasswordLoginPayload,
  RegisterPayload,
  SmsLoginPayload,
  SmsSendPayload,
  SearchConfig,
  SearchResponse,
} from "@/lib/types";

export const api = {
  search: (payload: {
    imageBase64: string;
    config: SearchConfig;
  }): Promise<ApiResponse<SearchResponse>> =>
    request("/api/search", {
      method: "POST",
      body: payload,
      mock: () => mockSearch(payload.imageBase64, payload.config),
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
  recharge: (packageId: string) =>
    request("/api/recharge", {
      method: "POST",
      body: { packageId },
      mock: () => mockRecharge(packageId),
    }),
  clearHistory: () =>
    request("/api/history/clear", {
      method: "POST",
      mock: () => mockClearHistory(),
    }),
};
