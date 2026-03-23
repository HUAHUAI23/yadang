import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/session";
import {
  createAutoCreditRule,
  listAutoCreditRules,
} from "@/lib/server/admin/service";
import { withRequestTrace } from "@/lib/server/logger";
import { jsonError, jsonOk } from "@/lib/server/response";
import { autoCreditRuleCreatePayloadSchema } from "@/lib/validation/admin";

export async function GET(request: Request) {
  return withRequestTrace(request, async () => {
    try {
      await requireAdminSession({ createAccountIfMissing: true });
      const items = await listAutoCreditRules();
      return jsonOk({ items });
    } catch (error) {
      return jsonError(
        (error as { status?: number }).status ?? 500,
        (error as Error).message ?? "获取自动加钱规则失败",
      );
    }
  });
}

export async function POST(request: Request) {
  return withRequestTrace(request, async () => {
    try {
      const session = await requireAdminSession({ createAccountIfMissing: true });
      const body = await request.json().catch(() => null);
      const parsed = autoCreditRuleCreatePayloadSchema.parse(body);
      const item = await createAutoCreditRule(parsed, session.user.id);
      return jsonOk({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return jsonError(400, "参数错误");
      }
      return jsonError(
        (error as { status?: number }).status ?? 500,
        (error as Error).message ?? "创建自动加钱规则失败",
      );
    }
  });
}

export const runtime = "nodejs";
