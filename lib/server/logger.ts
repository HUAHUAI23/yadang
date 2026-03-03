import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import pino, { type Logger } from "pino";

import { env } from "@/lib/env";

import "server-only";

export const TRACE_ID_HEADER = "x-trace-id";
export const REQUEST_ID_HEADER = "x-request-id";

type TraceSource = "api" | "scheduler" | "worker" | "unknown";

export type TraceContext = {
  traceId: string;
  source: TraceSource;
};

const traceStorage = new AsyncLocalStorage<TraceContext>();

const parseTraceparent = (value: string | null) => {
  if (!value) return "";
  const parts = value.trim().split("-");
  if (parts.length < 4) return "";
  const traceId = parts[1];
  return /^[a-fA-F0-9]{32}$/.test(traceId) ? traceId : "";
};

const sanitizeTraceId = (value: string | null | undefined) => {
  if (!value) return "";
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.slice(0, 128);
};

const resolveIncomingTraceId = (request: Request) => {
  const fromHeader = sanitizeTraceId(request.headers.get(TRACE_ID_HEADER));
  if (fromHeader) {
    return fromHeader;
  }

  const fromRequestId = sanitizeTraceId(request.headers.get(REQUEST_ID_HEADER));
  if (fromRequestId) {
    return fromRequestId;
  }

  const fromTraceparent = parseTraceparent(request.headers.get("traceparent"));
  if (fromTraceparent) {
    return fromTraceparent;
  }

  return createTraceId();
};

const baseLogger = pino({
  name: "zrt-api",
  level: env.logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.authorization",
      "*.Authorization",
      "*.privateKey",
      "*.secret",
      "*.smsCode",
      "*.alipayPrivateKey",
      "*.ALIPAY_PRIVATE_KEY",
    ],
    remove: true,
  },
  mixin() {
    const traceId = getTraceId();
    if (!traceId) {
      return {};
    }
    return { traceId };
  },
});

export const logger = baseLogger;

export const createTraceId = () => randomUUID();

export const getTraceContext = () => traceStorage.getStore();

export const getTraceId = () => getTraceContext()?.traceId ?? "";

export const bindTraceToHeaders = (headers: Headers) => {
  const traceId = getTraceId();
  if (traceId && !headers.has(TRACE_ID_HEADER)) {
    headers.set(TRACE_ID_HEADER, traceId);
  }
};

export const withTraceContext = <T>(
  context: Pick<TraceContext, "traceId"> & Partial<Pick<TraceContext, "source">>,
  handler: () => T,
) => {
  const traceId = sanitizeTraceId(context.traceId) || createTraceId();
  const source = context.source ?? "unknown";
  return traceStorage.run({ traceId, source }, handler);
};

export const withRequestTrace = <T>(request: Request, handler: () => T) => {
  const traceId = resolveIncomingTraceId(request);
  return withTraceContext({ traceId, source: "api" }, handler);
};

export const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
};

export const childLogger = (bindings: Record<string, unknown>): Logger =>
  logger.child(bindings);
