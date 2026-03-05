"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { AlipayCreateOrderResult, ChargeOrderItem, TransactionItem } from "@/lib/types";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRechargeSuccess?: () => Promise<void> | void;
}

type TabKey = "pay" | "records";
type TxnKind = "all" | "recharge" | "expense";

const toAmountText = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const toDatetime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
};

const toCountdown = (seconds: number) => {
  const total = Math.max(0, seconds);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

export default function RechargeDialog({
  open,
  onOpenChange,
  onRechargeSuccess,
}: RechargeDialogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("pay");
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [presetAmounts, setPresetAmounts] = useState<number[]>([]);
  const [minAmount, setMinAmount] = useState(1);
  const [maxAmount, setMaxAmount] = useState(100000);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [queryingOrder, setQueryingOrder] = useState(false);
  const [chargeOrder, setChargeOrder] = useState<AlipayCreateOrderResult | null>(null);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [expireSeconds, setExpireSeconds] = useState(0);
  const [closeLoading, setCloseLoading] = useState(false);
  const [chargeOrders, setChargeOrders] = useState<ChargeOrderItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [txnKind, setTxnKind] = useState<TxnKind>("all");

  const refreshRecords = useCallback(
    async (kind: TxnKind = txnKind) => {
      const [orderRes, txnRes] = await Promise.all([
        api.rechargeOrders(20),
        api.transactions({ limit: 50, kind }),
      ]);

      if (orderRes.code === 0 && orderRes.data) {
        setChargeOrders(orderRes.data.items);
      }
      if (txnRes.code === 0 && txnRes.data) {
        setTransactions(txnRes.data.items);
      }
    },
    [txnKind],
  );

  const loadDialogData = useCallback(async () => {
    setLoading(true);
    try {
      const configRes = await api.paymentConfig();
      if (configRes.code === 0 && configRes.data) {
        setAvailable(configRes.data.available);
        setPaymentMessage(configRes.data.message ?? "");
        const payment = configRes.data.payment;
        if (payment) {
          setPresetAmounts(payment.presetAmounts);
          setMinAmount(payment.minAmount);
          setMaxAmount(payment.maxAmount);
          setSelectedAmount(payment.presetAmounts[0] ?? payment.minAmount);
        }
      } else {
        setAvailable(false);
        setPaymentMessage(configRes.message ?? "支付配置加载失败");
      }
      await refreshRecords("all");
    } finally {
      setLoading(false);
    }
  }, [refreshRecords]);

  useEffect(() => {
    if (!open) return;
    setActiveTab("pay");
    setChargeOrder(null);
    setOrderStatus("pending");
    setExpireSeconds(0);
    setCustomAmount("");
    setTxnKind("all");
    void loadDialogData();
  }, [open, loadDialogData]);

  useEffect(() => {
    if (!open || !chargeOrder) return;
    if (!["pending", "processing"].includes(orderStatus)) return;
    if (expireSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setExpireSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [open, chargeOrder, expireSeconds, orderStatus]);

  const queryOrderStatus = useCallback(
    async (outTradeNo: string) => {
      if (queryingOrder) return;
      setQueryingOrder(true);
      try {
        const response = await api.alipayQueryOrder({ outTradeNo });
        if (response.code !== 0 || !response.data) {
          return;
        }

        const status = response.data.status.toLowerCase();
        setOrderStatus(status);

        if (status === "success") {
          await refreshRecords();
          await onRechargeSuccess?.();
        }
      } finally {
        setQueryingOrder(false);
      }
    },
    [onRechargeSuccess, queryingOrder, refreshRecords],
  );

  useEffect(() => {
    if (!open || !chargeOrder) return;
    if (!["pending", "processing"].includes(orderStatus)) return;

    const timer = window.setInterval(() => {
      void queryOrderStatus(chargeOrder.outTradeNo);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [open, chargeOrder, orderStatus, queryOrderStatus]);

  const actualAmount = useMemo(() => {
    const raw = customAmount.trim();
    if (!raw) return selectedAmount;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, [customAmount, selectedAmount]);

  const statusTag = useMemo(() => {
    if (orderStatus === "success") return { text: "支付成功", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    if (orderStatus === "closed") return { text: "订单已关闭", cls: "bg-slate-100 text-slate-600 border-slate-200" };
    if (orderStatus === "failed") return { text: "支付失败", cls: "bg-rose-50 text-rose-600 border-rose-100" };
    if (orderStatus === "processing") return { text: "处理中", cls: "bg-amber-50 text-amber-600 border-amber-100" };
    return { text: "待支付", cls: "bg-blue-50 text-blue-600 border-blue-100" };
  }, [orderStatus]);

  const handleCreateOrder = async () => {
    if (!available) {
      window.alert(paymentMessage || "支付宝支付暂不可用");
      return;
    }

    if (!Number.isFinite(actualAmount)) {
      window.alert("请输入合法的充值金额");
      return;
    }

    if (actualAmount < minAmount || actualAmount > maxAmount) {
      window.alert(`充值金额需在 ${minAmount}-${maxAmount} 元之间`);
      return;
    }

    setCreatingOrder(true);
    try {
      const response = await api.rechargeCreateOrder({
        amount: actualAmount,
        provider: "alipay",
      });
      if (response.code !== 0 || !response.data) {
        window.alert(response.message ?? "创建订单失败");
        return;
      }

      setChargeOrder(response.data);
      setOrderStatus("pending");
      setExpireSeconds(response.data.expireInSeconds);
      await refreshRecords();
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleCloseOrder = async () => {
    if (!chargeOrder) return;
    setCloseLoading(true);
    try {
      const response = await api.alipayCloseOrder({ outTradeNo: chargeOrder.outTradeNo });
      if (response.code !== 0 || !response.data) {
        window.alert(response.message ?? "关闭订单失败");
        return;
      }
      setOrderStatus(response.data.status.toLowerCase());
      await refreshRecords();
    } finally {
      setCloseLoading(false);
    }
  };

  const payTab = (
    <div className="space-y-6">
      {!available && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          {paymentMessage || "支付宝支付暂不可用，请联系管理员。"}
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">选择金额</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount("");
              }}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                selectedAmount === amount && !customAmount
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
              type="button"
            >
              <span className="block text-lg font-black text-slate-900">¥{toAmountText(amount)}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                预设金额
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <input
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            placeholder={`自定义金额（${minAmount}-${maxAmount} 元）`}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none ring-blue-400/40 transition-all focus:border-blue-300 focus:ring-4"
            inputMode="decimal"
          />
        </div>

        <button
          onClick={handleCreateOrder}
          disabled={creatingOrder || !available}
          className="mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-black uppercase tracking-widest text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          {creatingOrder ? "创建中..." : "生成支付宝订单"}
        </button>
      </div>

      {chargeOrder && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">扫码支付</h3>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTag.cls}`}>
              {statusTag.text}
            </span>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3">
            <div className="relative h-52 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3">
              <Image
                src={chargeOrder.qrCodeDataUrl}
                alt="Alipay QR"
                fill
                unoptimized
                sizes="208px"
                className="object-contain p-3"
              />
            </div>
            <p className="text-xs font-bold text-slate-500">
              金额：<span className="text-slate-900">¥{toAmountText(chargeOrder.amount)}</span>
            </p>
            <p className="text-xs font-bold text-slate-500">
              订单号：<span className="font-mono text-slate-700">{chargeOrder.outTradeNo}</span>
            </p>
            {["pending", "processing"].includes(orderStatus) && (
              <p className="text-xs font-bold text-amber-600">剩余支付时间 {toCountdown(expireSeconds)}</p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => void queryOrderStatus(chargeOrder.outTradeNo)}
              disabled={queryingOrder}
              className="h-11 rounded-2xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-700 transition-all hover:border-blue-300"
              type="button"
            >
              {queryingOrder ? "查询中..." : "查询支付状态"}
            </button>
            <button
              onClick={handleCloseOrder}
              disabled={closeLoading || !["pending", "processing"].includes(orderStatus)}
              className="h-11 rounded-2xl border border-rose-200 bg-rose-50 text-xs font-black uppercase tracking-widest text-rose-600 transition-all disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {closeLoading ? "关闭中..." : "取消订单"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const recordsTab = (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">充值订单</h3>
          <button
            type="button"
            onClick={() => void refreshRecords()}
            className="text-[10px] font-black uppercase tracking-widest text-blue-600"
          >
            刷新
          </button>
        </div>
        <div className="space-y-3">
          {chargeOrders.length === 0 && (
            <p className="text-xs font-medium text-slate-400">暂无充值订单</p>
          )}
          {chargeOrders.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">¥{toAmountText(item.amount)}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-[10px] font-mono text-slate-500">{item.outTradeNo}</p>
              <p className="mt-2 text-[10px] text-slate-500">创建时间：{toDatetime(item.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">交易记录</h3>
          <div className="flex items-center gap-2">
            {(["all", "recharge", "expense"] as TxnKind[]).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={async () => {
                  setTxnKind(kind);
                  await refreshRecords(kind);
                }}
                className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${
                  txnKind === kind
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              >
                {kind === "all" ? "全部" : kind === "recharge" ? "充值" : "消费"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {transactions.length === 0 && (
            <p className="text-xs font-medium text-slate-400">暂无交易记录</p>
          )}
          {transactions.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                  {item.type}
                </span>
                <span
                  className={`text-sm font-black ${
                    item.amount >= 0 ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {item.amount >= 0 ? "+" : ""}
                  ¥{toAmountText(item.amount)}
                </span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">{item.description || "-"}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                余额：¥{toAmountText(item.balanceAfter)} | 时间：{toDatetime(item.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 px-8 py-6">
          <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
            账户充值
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500">单位为人民币元，支付成功后自动到账。</p>
        </DialogHeader>

        <div className="p-8">
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("pay")}
              className={`h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === "pay" ? "bg-white text-slate-900 shadow" : "text-slate-500"
              }`}
            >
              发起充值
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("records")}
              className={`h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === "records" ? "bg-white text-slate-900 shadow" : "text-slate-500"
              }`}
            >
              订单与账单
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm font-bold text-slate-400">加载中...</div>
          ) : activeTab === "pay" ? (
            payTab
          ) : (
            recordsTab
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
