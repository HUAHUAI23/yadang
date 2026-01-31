import { request } from "@/lib/api/client";
import {
  mockSearch,
  mockLogin,
  mockRegister,
  mockRecharge,
  mockSendSms,
  mockClearHistory,
} from "@/lib/api/mock";
import type {
  ApiResponse,
  AuthPayload,
  AuthResult,
  RegisterPayload,
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
  authLogin: (payload: AuthPayload): Promise<ApiResponse<AuthResult>> =>
    request("/api/auth/login", {
      method: "POST",
      body: payload,
      mock: () => mockLogin(payload),
    }),
  authRegister: (
    payload: RegisterPayload
  ): Promise<ApiResponse<AuthResult>> =>
    request("/api/auth/register", {
      method: "POST",
      body: payload,
      mock: () => mockRegister(payload),
    }),
  sendSms: (phone: string): Promise<ApiResponse<{ sms: string }>> =>
    request("/api/auth/sms", {
      method: "POST",
      body: { phone },
      mock: () => mockSendSms(phone),
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
