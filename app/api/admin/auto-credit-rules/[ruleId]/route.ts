import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/session";
import { updateAutoCreditRule } from "@/lib/server/admin/service";
import { withRequestTrace } from "@/lib/server/logger";
import { jsonError, jsonOk } from "@/lib/server/response";
import { autoCreditRuleUpdatePayloadSchema } from "@/lib/validation/admin";

const parseRuleId = async (params: Promise<{ ruleId: string }>) => {
  const { ruleId } = await params;
  const parsed = Number.parseInt(ruleId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("规则参数无效");
  }
  return parsed;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> },
) {
  return withRequestTrace(request, async () => {
    try {
      const session = await requireAdminSession({ createAccountIfMissing: true });
      const body = await request.json().catch(() => null);
      const parsed = autoCreditRuleUpdatePayloadSchema.parse(body);
      const ruleId = await parseRuleId(params);
      const item = await updateAutoCreditRule(ruleId, parsed, session.user.id);
      return jsonOk({ item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return jsonError(400, "参数错误");
      }
      return jsonError(
        (error as { status?: number }).status ?? 500,
        (error as Error).message ?? "更新自动加钱规则失败",
      );
    }
  });
}

export const runtime = "nodejs";
