"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreditCardIcon, HistoryIcon, ShieldCheckIcon } from "lucide-react";

import {
  openCheckoutWindow,
  openCheckoutWindowShell,
  redirectCheckoutWindow,
  showCheckoutWindowError,
} from "@/components/patent-lens/recharge-dialog-checkout";
import { RechargePayView } from "@/components/patent-lens/recharge-dialog-pay-view";
import { RechargeRecordsView } from "@/components/patent-lens/recharge-dialog-records-view";
import {
  getPaymentStatusTag,
  type RecordsView,
  type TransactionKind,
} from "@/components/patent-lens/recharge-dialog-shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { AlipayCreateOrderResult, ChargeOrderItem, TransactionItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRechargeSuccess?: () => Promise<void> | void;
}

type TabKey = "pay" | "records";

const AMOUNT_INPUT_PATTERN = /^\d*(?:\.\d{0,2})?$/;

const sanitizeAmountInput = (value: string) => {
  const normalized = value.replace(/[^\d.]/g, "");
  if (!normalized) {
    return "";
  }

  if (!AMOUNT_INPUT_PATTERN.test(normalized)) {
    return null;
  }

  if (normalized.startsWith(".")) {
    return `0${normalized}`;
  }

  return normalized;
};

export default function RechargeDialog({
  open,
  onOpenChange,
  onRechargeSuccess,
}: RechargeDialogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("pay");
  const [recordsView, setRecordsView] = useState<RecordsView>("orders");
  const [txnKind, setTxnKind] = useState<TransactionKind>("all");

  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [presetAmounts, setPresetAmounts] = useState<number[]>([]);
  const [minAmount, setMinAmount] = useState(1);
  const [maxAmount, setMaxAmount] = useState(100000);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [queryingOrder, setQueryingOrder] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);

  const [chargeOrder, setChargeOrder] = useState<AlipayCreateOrderResult | null>(null);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [expireSeconds, setExpireSeconds] = useState(0);
  const [closeHint, setCloseHint] = useState("");

  const [chargeOrders, setChargeOrders] = useState<ChargeOrderItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const checkoutWindowRef = useRef<Window | null>(null);

  const actualAmount = useMemo(() => {
    const raw = customAmount.trim();
    if (!raw) return selectedAmount;

    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }, [customAmount, selectedAmount]);

  const actualAmountText = useMemo(() => {
    if (!Number.isFinite(actualAmount) || actualAmount <= 0) return "--";
    return actualAmount.toFixed(2);
  }, [actualAmount]);

  const statusTag = useMemo(() => getPaymentStatusTag(orderStatus), [orderStatus]);

  const hasActiveOrder = Boolean(chargeOrder && ["pending", "processing"].includes(orderStatus));
  const hasRetryableOrder = Boolean(chargeOrder && ["closed", "failed"].includes(orderStatus));

  const refreshRecords = useCallback(
    async (kind: TransactionKind = txnKind) => {
      const [orderRes, transactionRes] = await Promise.all([
        api.rechargeOrders(20),
        api.transactions({ limit: 50, kind }),
      ]);

      if (orderRes.code === 0 && orderRes.data) {
        setChargeOrders(orderRes.data.items);
      }

      if (transactionRes.code === 0 && transactionRes.data) {
        setTransactions(transactionRes.data.items);
      }
    },
    [txnKind],
  );

  const loadDialogData = useCallback(async () => {
    setLoading(true);
    try {
      const configResponse = await api.paymentConfig();
      if (configResponse.code === 0 && configResponse.data) {
        const payment = configResponse.data.payment;
        setAvailable(configResponse.data.available);
        setPaymentMessage(configResponse.data.message ?? "");

        if (payment) {
          setPresetAmounts(payment.presetAmounts);
          setMinAmount(payment.minAmount);
          setMaxAmount(payment.maxAmount);
          setSelectedAmount(payment.presetAmounts[0] ?? payment.minAmount);
        }
      } else {
        setAvailable(false);
        setPaymentMessage(configResponse.message ?? "支付配置加载失败");
      }

      await refreshRecords("all");
    } finally {
      setLoading(false);
    }
  }, [refreshRecords]);

  useEffect(() => {
    if (!open) return;

    setActiveTab("pay");
    setRecordsView("orders");
    setTxnKind("all");
    setCustomAmount("");
    setChargeOrder(null);
    setOrderStatus("pending");
    setExpireSeconds(0);
    setCloseHint("");

    void loadDialogData();
  }, [loadDialogData, open]);

  useEffect(() => {
    if (!open || !chargeOrder || expireSeconds <= 0) return;
    if (!["pending", "processing"].includes(orderStatus)) return;

    const timer = window.setInterval(() => {
      setExpireSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [chargeOrder, expireSeconds, open, orderStatus]);

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
        if (status !== "pending" && status !== "processing") {
          setCloseHint("");
        }

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
    }, 5000);

    return () => window.clearInterval(timer);
  }, [chargeOrder, open, orderStatus, queryOrderStatus]);

  useEffect(() => {
    return () => {
      if (checkoutWindowRef.current && !checkoutWindowRef.current.closed) {
        checkoutWindowRef.current.close();
      }
      checkoutWindowRef.current = null;
    };
  }, []);

  const handleOpenCheckout = useCallback(() => {
    if (!chargeOrder) return;

    const opened =
      redirectCheckoutWindow({
        paymentUrl: chargeOrder.paymentUrl,
        currentWindow: checkoutWindowRef.current,
      }) ?? openCheckoutWindow(chargeOrder.paymentUrl);

    if (opened) {
      checkoutWindowRef.current = opened;
      return;
    }

    window.alert("支付窗口被浏览器拦截，请允许弹窗后重试。");
  }, [chargeOrder]);

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

    checkoutWindowRef.current = openCheckoutWindowShell();
    if (!checkoutWindowRef.current) {
      window.alert("支付窗口被浏览器拦截，请允许弹窗后重试。");
      return;
    }

    setCreatingOrder(true);
    try {
      const response = await api.rechargeCreateOrder({ amount: actualAmount });
      if (response.code !== 0 || !response.data) {
        showCheckoutWindowError(checkoutWindowRef.current);
        checkoutWindowRef.current = null;
        window.alert(response.message ?? "创建订单失败");
        return;
      }

      setChargeOrder(response.data);
      setOrderStatus("pending");
      setExpireSeconds(response.data.expireInSeconds);
      setCloseHint("");
      await refreshRecords();

      const opened =
        redirectCheckoutWindow({
          paymentUrl: response.data.paymentUrl,
          currentWindow: checkoutWindowRef.current,
        }) ?? openCheckoutWindow(response.data.paymentUrl);

      if (opened) {
        checkoutWindowRef.current = opened;
      } else {
        showCheckoutWindowError(checkoutWindowRef.current);
        checkoutWindowRef.current = null;
        window.alert("支付窗口被浏览器拦截，请允许弹窗后重试。");
      }
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
      setCloseHint(response.data.closePending ? response.data.message ?? "" : "");
      await refreshRecords();

      if (response.data.closePending) {
        await queryOrderStatus(chargeOrder.outTradeNo);
      }
    } finally {
      setCloseLoading(false);
    }
  };

  const handleResetOrder = () => {
    setChargeOrder(null);
    setOrderStatus("pending");
    setExpireSeconds(0);
    setCloseHint("");
  };

  const handleTransactionKindChange = async (kind: TransactionKind) => {
    setTxnKind(kind);
    await refreshRecords(kind);
  };

  const handleCustomAmountChange = (value: string) => {
    const normalized = sanitizeAmountInput(value);
    if (normalized === null) {
      return;
    }

    setCustomAmount(normalized);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="wide"
        className="max-h-[90vh] overflow-hidden rounded-4xl border-slate-200 bg-slate-50 p-0 shadow-none sm:max-w-[1180px]"
      >
        <div className="flex max-h-[92vh] min-h-0 flex-col">
          <DialogHeader className="border-b border-slate-200 bg-white px-6 py-5 text-left sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2 pr-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  账户充值中心
                </p>
                <DialogTitle className="text-4xl font-bold tracking-tight text-slate-950">
                  支付宝充值
                </DialogTitle>
                <p className="max-w-2xl text-sm leading-6 text-slate-500">
                  保持支付流程简洁清晰。当前弹窗负责金额选择、订单跟踪和账单查看，支付页会自动打开。
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:w-auto">
                {[
                  { icon: CreditCardIcon, label: "自动拉起支付页" },
                  { icon: ShieldCheckIcon, label: "到账状态自动同步" },
                  { icon: HistoryIcon, label: "账单记录统一查看" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex min-w-[120px] flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center"
                  >
                    <Icon className="size-4 text-slate-900" />
                    <span className="text-xs font-semibold text-slate-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 ring-1 ring-slate-200">
              {(["pay", "records"] as TabKey[]).map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "h-12 rounded-xl text-sm font-semibold",
                      active ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {tab === "pay" ? "发起充值" : "订单与账单"}
                  </button>
                );
              })}
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white text-sm font-semibold text-slate-400">
                  加载中...
                </div>
              ) : activeTab === "pay" ? (
                <RechargePayView
                  available={available}
                  paymentMessage={paymentMessage}
                  presetAmounts={presetAmounts}
                  minAmount={minAmount}
                  maxAmount={maxAmount}
                  selectedAmount={selectedAmount}
                  customAmount={customAmount}
                  actualAmountText={actualAmountText}
                  creatingOrder={creatingOrder}
                  closeLoading={closeLoading}
                  queryingOrder={queryingOrder}
                  hasActiveOrder={hasActiveOrder}
                  hasRetryableOrder={hasRetryableOrder}
                  expireSeconds={expireSeconds}
                  chargeOrder={chargeOrder}
                  statusTag={statusTag}
                  closeHint={closeHint}
                  onSelectAmount={(amount) => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  onChangeCustomAmount={handleCustomAmountChange}
                  onCreateOrder={handleCreateOrder}
                  onQueryOrder={() =>
                    chargeOrder ? void queryOrderStatus(chargeOrder.outTradeNo) : undefined
                  }
                  onOpenCheckout={handleOpenCheckout}
                  onCloseOrder={handleCloseOrder}
                  onResetOrder={handleResetOrder}
                />
              ) : (
                <RechargeRecordsView
                  recordsView={recordsView}
                  txnKind={txnKind}
                  chargeOrders={chargeOrders}
                  transactions={transactions}
                  onRefresh={() => void refreshRecords()}
                  onChangeRecordsView={setRecordsView}
                  onChangeTransactionKind={(kind) => void handleTransactionKindChange(kind)}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
