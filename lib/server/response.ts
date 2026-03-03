import { NextResponse } from "next/server";

import { bindTraceToHeaders } from "@/lib/server/logger";
import type { ApiResponse } from "@/lib/types";

import "server-only";

const withTraceHeaders = <T extends NextResponse>(response: T) => {
  bindTraceToHeaders(response.headers);
  return response;
};

export function jsonOk<T>(data: T) {
  const payload: ApiResponse<T> = { code: 0, data };
  return withTraceHeaders(NextResponse.json(payload));
}

export function jsonError<T>(code: number, message: string) {
  const payload: ApiResponse<T> = {
    code,
    data: null,
    message,
  };
  return withTraceHeaders(NextResponse.json(payload, { status: code }));
}
