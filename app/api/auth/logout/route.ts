import { clearSessionCookie } from "@/lib/auth/jwt";
import { jsonOk } from "@/lib/server/response";

export async function POST() {
  clearSessionCookie();
  return jsonOk({ ok: true });
}

export const runtime = "nodejs";
