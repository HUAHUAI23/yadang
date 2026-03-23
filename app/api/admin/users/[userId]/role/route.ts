import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/session";
import { updateUserAdminRole } from "@/lib/server/admin/service";
import { withRequestTrace } from "@/lib/server/logger";
import { jsonError, jsonOk } from "@/lib/server/response";
import { adminRolePayloadSchema } from "@/lib/validation/admin";

const parseUserId = async (params: Promise<{ userId: string }>) => {
  const { userId } = await params;
  const parsed = Number.parseInt(userId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("用户参数无效");
  }
  return parsed;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  return withRequestTrace(request, async () => {
    try {
      const session = await requireAdminSession({ createAccountIfMissing: true });
      const body = await request.json().catch(() => null);
      const parsed = adminRolePayloadSchema.parse(body);
      const userId = await parseUserId(params);
      const user = await updateUserAdminRole(userId, parsed.isAdmin, session.user.id);
      return jsonOk({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return jsonError(400, "参数错误");
      }
      return jsonError(
        (error as { status?: number }).status ?? 500,
        (error as Error).message ?? "更新管理员权限失败",
      );
    }
  });
}

export const runtime = "nodejs";
