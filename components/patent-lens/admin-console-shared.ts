import type { AdminUserView } from "@/lib/types";

export type AdjustmentAction = "add" | "subtract" | "reset";

export type AdminConsoleFeedback = {
  variant: "success" | "error";
  title: string;
  message: string;
};

export const formatAmount = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatDatetime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("zh-CN", { hour12: false });
};

export const getUserLabel = (user: Pick<AdminUserView, "id" | "phone" | "username">) =>
  user.phone || user.username || `用户#${user.id}`;
