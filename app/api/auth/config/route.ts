import { getAuthConfig } from "@/lib/auth/config";
import { jsonOk } from "@/lib/server/response";

export async function GET() {
  const config = await getAuthConfig();
  return jsonOk(config);
}

export const runtime = "nodejs";
