import type { ApiResponse } from "@/lib/types";

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  mock?: () => Promise<ApiResponse<T>>;
};

export async function request<T>(
  path: string,
  options: RequestOptions<T> = {}
): Promise<ApiResponse<T>> {
  if (options.mock) {
    return options.mock();
  }

  const response = await fetch(path, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!response.ok) {
    return {
      code: response.status,
      data: null,
      message: payload?.message ?? "请求失败",
    };
  }

  return (
    payload ?? {
      code: response.status,
      data: null,
      message: "响应为空",
    }
  );
}
