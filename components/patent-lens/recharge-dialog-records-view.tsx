"use client";

import { useMemo } from "react";
import { CircleDollarSignIcon, ReceiptTextIcon, RefreshCcwIcon } from "lucide-react";

import {
  EmptyState,
  getOrderStatusLabel,
  getPaymentStatusTag,
  getTransactionDescription,
  getTransactionKindLabel,
  getTransactionTypeLabel,
  normalizeTransactionKind,
  type RecordsView,
  SectionHeading,
  statusTagClasses,
  Surface,
  toAmountText,
  toDatetime,
  type TransactionKind,
} from "@/components/patent-lens/recharge-dialog-shared";
import { Button } from "@/components/ui/button";
import type { ChargeOrderItem, TransactionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type RecordsToolbarProps = {
  recordsView: RecordsView;
  txnKind: TransactionKind;
  visibleCount: number;
  onRefresh: () => void;
  onChangeRecordsView: (view: RecordsView) => void;
  onChangeTransactionKind: (kind: TransactionKind) => void;
};

function RecordsToolbar(props: RecordsToolbarProps) {
  const {
    recordsView,
    txnKind,
    visibleCount,
    onRefresh,
    onChangeRecordsView,
    onChangeTransactionKind,
  } = props;

  return (
    <Surface className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            {(["orders", "transactions"] as RecordsView[]).map((view) => {
              const active = recordsView === view;

              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => onChangeRecordsView(view)}
                  className={cn(
                    "h-11 min-w-[120px] rounded-xl px-4 text-sm font-semibold",
                    active ? "bg-white text-slate-950" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {view === "orders" ? "充值订单" : "交易记录"}
                </button>
              );
            })}
          </div>

          {recordsView === "transactions" ? (
            <div className="flex flex-wrap gap-2">
              {(["all", "recharge", "expense"] as TransactionKind[]).map((kind) => {
                const active = txnKind === kind;

                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => onChangeTransactionKind(kind)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold",
                      active
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800",
                    )}
                  >
                    {getTransactionKindLabel(kind)}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            当前显示 <span className="font-semibold text-slate-900">{visibleCount}</span> 条
          </span>
          <Button
            variant="outline"
            onClick={onRefresh}
            className="h-11 rounded-2xl border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            <RefreshCcwIcon />
            刷新
          </Button>
        </div>
      </div>
    </Surface>
  );
}

function OrderRecordCard({ item }: { item: ChargeOrderItem }) {
  const statusTag = getPaymentStatusTag(item.status);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
              <CircleDollarSignIcon className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                ¥{toAmountText(item.amount)}
              </p>
              <p className="text-sm text-slate-500">{getOrderStatusLabel(item.status)}</p>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
            <p>创建时间：{toDatetime(item.createdAt)}</p>
            <p>支付渠道：支付宝</p>
            <p>支付时间：{toDatetime(item.paidAt)}</p>
            <p>过期时间：{toDatetime(item.expireAt)}</p>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex h-8 items-center rounded-full border px-3 text-xs font-bold uppercase tracking-[0.16em]",
            statusTagClasses[statusTag.tone],
          )}
        >
          {statusTag.text}
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          订单号
        </p>
        <p className="mt-2 break-all font-mono text-xs text-slate-700">{item.outTradeNo}</p>
      </div>
    </article>
  );
}

function TransactionRecordCard({ item }: { item: TransactionItem }) {
  const kind = normalizeTransactionKind(item.type);
  const toneClass =
    kind === "recharge"
      ? "bg-emerald-50 text-emerald-600"
      : kind === "expense"
        ? "bg-rose-50 text-rose-600"
        : "bg-slate-100 text-slate-600";

  return (
    <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", toneClass)}>
              <ReceiptTextIcon className="size-5" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-slate-950">
                {getTransactionTypeLabel(item.type)}
              </p>
              <p className="text-sm text-slate-500">{getTransactionDescription(item)}</p>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2">
            <p>流水时间：{toDatetime(item.createdAt)}</p>
            <p>筛选分类：{getTransactionKindLabel(kind)}</p>
            <p>变更后余额：¥{toAmountText(item.balanceAfter)}</p>
            <p>业务标识：{item.bizId || "-"}</p>
          </div>
        </div>

        <div className="text-left lg:text-right">
          <p
            className={cn(
              "text-xl font-semibold tracking-tight",
              item.amount >= 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {item.amount >= 0 ? "+" : ""}¥{toAmountText(item.amount)}
          </p>
        </div>
      </div>
    </article>
  );
}

type RechargeRecordsViewProps = {
  recordsView: RecordsView;
  txnKind: TransactionKind;
  chargeOrders: ChargeOrderItem[];
  transactions: TransactionItem[];
  onRefresh: () => void;
  onChangeRecordsView: (view: RecordsView) => void;
  onChangeTransactionKind: (kind: TransactionKind) => void;
};

export function RechargeRecordsView(props: RechargeRecordsViewProps) {
  const {
    recordsView,
    txnKind,
    chargeOrders,
    transactions,
    onRefresh,
    onChangeRecordsView,
    onChangeTransactionKind,
  } = props;

  const filteredTransactions = useMemo(() => {
    if (txnKind === "all") {
      return transactions;
    }

    return transactions.filter((item) => normalizeTransactionKind(item.type) === txnKind);
  }, [transactions, txnKind]);

  const visibleCount =
    recordsView === "orders" ? chargeOrders.length : filteredTransactions.length;

  return (
    <div className="space-y-5">
      <RecordsToolbar
        recordsView={recordsView}
        txnKind={txnKind}
        visibleCount={visibleCount}
        onRefresh={onRefresh}
        onChangeRecordsView={onChangeRecordsView}
        onChangeTransactionKind={onChangeTransactionKind}
      />

      <Surface className="p-5 sm:p-6">
        <SectionHeading
          eyebrow={recordsView === "orders" ? "订单管理" : "资金记录"}
          title={recordsView === "orders" ? "充值订单列表" : `${getTransactionKindLabel(txnKind)}流水`}
          description={
            recordsView === "orders"
              ? "展示最近充值订单的完整状态，适合核对支付是否到账。"
              : txnKind === "all"
                ? "展示全部资金变动记录。"
                : `仅展示${getTransactionKindLabel(txnKind)}相关流水。`
          }
        />

        <div className="mt-5 space-y-4">
          {recordsView === "orders" ? (
            chargeOrders.length === 0 ? (
              <EmptyState title="暂无充值订单" description="当你发起充值后，订单会按时间顺序显示在这里。" />
            ) : (
              chargeOrders.map((item) => <OrderRecordCard key={item.id} item={item} />)
            )
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title={`暂无${txnKind === "all" ? "" : getTransactionKindLabel(txnKind)}记录`}
              description="当前筛选条件下没有匹配的流水，可以切换筛选或刷新后再查看。"
            />
          ) : (
            filteredTransactions.map((item) => <TransactionRecordCard key={item.id} item={item} />)
          )}
        </div>
      </Surface>
    </div>
  );
}
