import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/session";
import { listAdminUsers } from "@/lib/server/admin/service";
import { withRequestTrace } from "@/lib/server/logger";
import { jsonError, jsonOk } from "@/lib/server/response";
import { adminUserQuerySchema } from "@/lib/validation/admin";

export async function GET(request: Request) {
  return withRequestTrace(request, async () => {
    try {
      await requireAdminSession({ createAccountIfMissing: true });
      const { searchParams } = new URL(request.url);
      const parsed = adminUserQuerySchema.parse({
        keyword: searchParams.get("keyword") ?? undefined,
      });
      const items = await listAdminUsers(parsed.keyword);
      return jsonOk({ items });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return jsonError(400, "参数错误");
      }
      return jsonError(
        (error as { status?: number }).status ?? 500,
        (error as Error).message ?? "获取用户列表失败",
      );
    }
  });
}

export const runtime = "nodejs";
