"use client";

import {
  ArrowUpRightIcon,
  Clock3Icon,
  CreditCardIcon,
  ShieldCheckIcon,
  WalletIcon,
} from "lucide-react";

import {
  type PaymentStatusTag,
  SectionHeading,
  statusTagClasses,
  SummaryMetric,
  Surface,
  toAmountText,
  toCountdown,
} from "@/components/patent-lens/recharge-dialog-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AlipayCreateOrderResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type RechargePayViewProps = {
  available: boolean;
  paymentMessage: string;
  presetAmounts: number[];
  minAmount: number;
  maxAmount: number;
  selectedAmount: number;
  customAmount: string;
  actualAmountText: string;
  creatingOrder: boolean;
  closeLoading: boolean;
  queryingOrder: boolean;
  hasActiveOrder: boolean;
  hasRetryableOrder: boolean;
  expireSeconds: number;
  chargeOrder: AlipayCreateOrderResult | null;
  statusTag: PaymentStatusTag;
  closeHint: string;
  onSelectAmount: (amount: number) => void;
  onChangeCustomAmount: (value: string) => void;
  onCreateOrder: () => void;
  onQueryOrder: () => void;
  onOpenCheckout: () => void;
  onCloseOrder: () => void;
  onResetOrder: () => void;
};

export function RechargePayView(props: RechargePayViewProps) {
  const {
    available,
    paymentMessage,
    presetAmounts,
    minAmount,
    maxAmount,
    selectedAmount,
    customAmount,
    actualAmountText,
    creatingOrder,
    closeLoading,
    queryingOrder,
    hasActiveOrder,
    hasRetryableOrder,
    expireSeconds,
    chargeOrder,
    statusTag,
    closeHint,
    onSelectAmount,
    onChangeCustomAmount,
    onCreateOrder,
    onQueryOrder,
    onOpenCheckout,
    onCloseOrder,
    onResetOrder,
  } = props;

  if (hasActiveOrder && chargeOrder) {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <Surface className="overflow-hidden">
          <div className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-white sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  当前支付订单
                </p>
                <h3 className="text-4xl font-bold tracking-tight">待完成付款</h3>
                <p className="max-w-xl text-sm leading-6 text-slate-300">
                  支付窗口已经自动打开。你只需要在支付宝页面完成付款，当前弹窗会持续同步到账状态。
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-xs font-bold uppercase tracking-[0.16em]",
                  statusTagClasses[statusTag.tone],
                )}
              >
                {statusTag.text}
              </span>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6 sm:px-8">
            <div className="grid gap-3 md:grid-cols-3">
              <SummaryMetric label="订单金额" value={`¥${toAmountText(chargeOrder.amount)}`} emphasize />
              <SummaryMetric
                label="剩余支付时间"
                value={expireSeconds > 0 ? toCountdown(expireSeconds) : "--:--"}
              />
              <SummaryMetric label="支付方式" value="支付宝网页收银台" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                商户订单号
              </p>
              <p className="mt-2 break-all font-mono text-xs text-slate-700">
                {chargeOrder.outTradeNo}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Button
                onClick={onOpenCheckout}
                className="h-12 rounded-2xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <ArrowUpRightIcon />
                继续支付
              </Button>
              <Button
                variant="outline"
                onClick={onQueryOrder}
                disabled={queryingOrder}
                className="h-12 rounded-2xl border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              >
                {queryingOrder ? "刷新中..." : "刷新状态"}
              </Button>
              <Button
                variant="outline"
                onClick={onCloseOrder}
                disabled={closeLoading}
                className="h-12 rounded-2xl border-rose-200 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50"
              >
                {closeLoading ? "关闭中..." : "关闭订单"}
              </Button>
            </div>

            {closeHint ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-700">
                {closeHint}
              </div>
            ) : null}
          </div>
        </Surface>

        <div className="space-y-5">
          <Surface className="p-6">
            <SectionHeading
              eyebrow="支付说明"
              title="一步完成付款"
              description="支付流程已尽量压缩为单一步骤，不需要再额外扫码、复制信息或切换多个视图。"
            />
            <div className="mt-5 space-y-3">
              {[
                "订单创建后会自动打开支付页，避免浏览器把异步跳转当作可疑弹窗。",
                "付款完成后当前窗口会自动轮询状态，到账后余额和账单会一起更新。",
                "如果长时间未完成支付，可以关闭这笔订单后重新发起。",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheckIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">到账链路已做双重兜底</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  支付成功后会通过前端轮询和后端任务共同确认订单状态，减少漏到账风险。
                </p>
              </div>
            </div>
          </Surface>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.95fr]">
      <Surface className="p-6 sm:p-8">
        <SectionHeading
          eyebrow="创建充值订单"
          title="选择本次充值金额"
          description="保留必要信息，聚焦一件事。确认金额后会自动打开支付宝支付页。"
        />

        {!available ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-700">
            {paymentMessage || "支付宝支付暂不可用，请联系管理员。"}
          </div>
        ) : null}

        {hasRetryableOrder && chargeOrder ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">上一笔订单已结束，可重新发起</p>
                <p className="mt-1 break-all text-xs text-slate-500">{chargeOrder.outTradeNo}</p>
              </div>
              <Button
                variant="ghost"
                onClick={onResetOrder}
                className="h-10 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                重新选择金额
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {presetAmounts.map((amount) => {
            const active = selectedAmount === amount && customAmount.trim().length === 0;

            return (
              <button
                key={amount}
                type="button"
                onClick={() => onSelectAmount(amount)}
                className={cn(
                  "rounded-3xl border px-4 py-5 text-left",
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-950 hover:border-slate-300 hover:bg-white",
                )}
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  预设金额
                </span>
                <span
                  className={cn(
                    "mt-4 block text-2xl font-bold tracking-tight",
                    active ? "text-white" : "text-slate-950",
                  )}
                >
                  ¥{toAmountText(amount)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Input
            value={customAmount}
            onChange={(event) => onChangeCustomAmount(event.target.value)}
            placeholder={`输入自定义金额（${minAmount}-${maxAmount} 元）`}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-sm shadow-none"
            inputMode="decimal"
          />
          <Button
            onClick={onCreateOrder}
            disabled={creatingOrder || !available}
            className="h-12 rounded-2xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {creatingOrder ? "正在创建订单..." : "立即去支付"}
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {[
            { icon: CreditCardIcon, label: "自动打开支付宝支付页" },
            { icon: ShieldCheckIcon, label: "支付完成后自动同步余额" },
            { icon: Clock3Icon, label: "超时订单可关闭后重建" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
            >
              <Icon className="size-4 text-slate-900" />
              {label}
            </div>
          ))}
        </div>
      </Surface>

      <div className="space-y-5">
        <Surface className="overflow-hidden">
          <div className="bg-linear-to-b from-slate-50 to-white px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              本次支付摘要
            </p>
            <div className="mt-5 rounded-4xl bg-slate-950 px-6 py-6 text-white">
              <p className="text-sm text-slate-300">到账金额</p>
              <p className="mt-3 text-5xl font-bold tracking-tighter">¥{actualAmountText}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                充值成功后将立即计入账户余额，可直接继续图像检索。
              </p>
            </div>
          </div>

          <div className="space-y-4 px-6 py-6">
            <div className="grid gap-3">
              <SummaryMetric label="单笔范围" value={`${minAmount}-${maxAmount} 元`} />
              <SummaryMetric label="付款渠道" value="支付宝网页收银台" />
              <SummaryMetric label="到账确认" value="自动轮询 + 后端补偿" />
            </div>
          </div>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <WalletIcon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">简洁的支付流程</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                充值页只保留金额、摘要和主操作，避免在关键路径塞入过多说明信息。
              </p>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
