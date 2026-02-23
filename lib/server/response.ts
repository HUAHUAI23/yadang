import { NextResponse } from "next/server";

import type { ApiResponse } from "@/lib/types";

import "server-only";

export function jsonOk<T>(data: T) {
  const payload: ApiResponse<T> = { code: 0, data };
  return NextResponse.json(payload);
}

export function jsonError<T>(code: number, message: string) {
  const payload: ApiResponse<T> = {
    code,
    data: null,
    message,
  };
  return NextResponse.json(payload, { status: code });
}
