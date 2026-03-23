import {
  AuthSessionError,
  resolveBusinessSessionContext,
} from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/server/response";
import { trademarkSearchService } from "@/lib/server/trademark-search";
import { searchPayloadSchema } from "@/lib/validation/search";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = searchPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "参数错误");
  }

  try {
    const session = await resolveBusinessSessionContext({
      createAccountIfMissing: true,
    });
    const response = await trademarkSearchService.search({
      userId: session.user.id,
      accountId: session.account.id,
      accountBalance: session.account.balance,
      imageBase64: parsed.data.imageBase64,
      requestId: request.headers.get("x-request-id") ?? undefined,
    });

    return jsonOk(response);
  } catch (error) {
    if (error instanceof AuthSessionError) {
      return jsonError(error.status, error.message);
    }

    const message = (error as Error).message ?? "检索失败，请稍后再试";
    if (message.includes("余额不足")) {
      return jsonError(402, message);
    }
    return jsonError(500, message);
  }
}

export const runtime = "nodejs";
