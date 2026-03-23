"use client";

import type { ReactNode } from "react";

import type { TransactionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export type TransactionKind = "all" | "recharge" | "expense";
export type RecordsView = "orders" | "transactions";

export type PaymentStatusTag = {
  tone: "blue" | "emerald" | "amber" | "rose" | "slate";
  text: string;
};

export const statusTagClasses: Record<PaymentStatusTag["tone"], string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const toAmountText = (value: number) => numberFormatter.format(value);

export const toDatetime = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return dateFormatter.format(date).replace(/\//g, "-");
};

export const toCountdown = (seconds: number) => {
  const total = Math.max(0, seconds);
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const remainder = String(total % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
};

export const getPaymentStatusTag = (status: string): PaymentStatusTag => {
  if (status === "success") return { tone: "emerald", text: "支付成功" };
  if (status === "closed") return { tone: "slate", text: "已关闭" };
  if (status === "failed") return { tone: "rose", text: "支付失败" };
  if (status === "processing") return { tone: "amber", text: "处理中" };
  return { tone: "blue", text: "待支付" };
};

export const getTransactionKindLabel = (kind: TransactionKind) => {
  if (kind === "recharge") return "充值";
  if (kind === "expense") return "消费";
  return "全部";
};

export const getOrderStatusLabel = (status: string) => {
  if (status === "success") return "支付成功";
  if (status === "closed") return "订单关闭";
  if (status === "failed") return "支付失败";
  if (status === "processing") return "处理中";
  return "待支付";
};

export const normalizeTransactionKind = (type: string): TransactionKind => {
  if (type === "RECHARGE" || type === "ADMIN_ADJUSTMENT" || type === "AUTO_CREDIT") {
    return "recharge";
  }
  if (type === "SEARCH_DEBIT") return "expense";
  return "all";
};

export const getTransactionTypeLabel = (type: string) => {
  if (type === "RECHARGE") return "账户充值";
  if (type === "SEARCH_DEBIT") return "检索扣费";
  if (type === "ADMIN_ADJUSTMENT") return "人工调整";
  if (type === "AUTO_CREDIT") return "自动加钱";
  return type;
};

export const getTransactionDescription = (item: TransactionItem) => {
  if (item.description) return item.description;
  if (item.type === "RECHARGE") return "支付宝充值到账";
  if (item.type === "SEARCH_DEBIT") return "图像检索扣费";
  if (item.type === "ADMIN_ADJUSTMENT") return "管理员调整账户余额";
  if (item.type === "AUTO_CREDIT") return "系统按规则自动发放";
  return "-";
};

export function Surface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-3xl border border-slate-200 bg-white", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {eyebrow}
        </p>
        <div className="space-y-1">
          <h3 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h3>
          {description ? (
            <p className="max-w-xl text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SummaryMetric({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4",
        emphasize
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-slate-50 text-slate-950",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.16em]",
          emphasize ? "text-slate-300" : "text-slate-400",
        )}
      >
        {label}
      </p>
      <p className={cn("mt-2 text-lg font-bold", emphasize ? "text-white" : "text-slate-950")}>
        {value}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
