export type PaymentConfigView = {
  provider: "alipay";
  displayName: string;
  description: string;
  icon: string;
  minAmount: number;
  maxAmount: number;
  presetAmounts: number[];
  orderTimeoutMinutes: number;
};

export type PaymentConfigResult = {
  available: boolean;
  payment: PaymentConfigView | null;
  message?: string;
};

export type AlipayCreateOrderResult = {
  chargeOrderId: number;
  outTradeNo: string;
  amount: number;
  paymentUrl: string;
  expireInSeconds: number;
  expireAt: string;
};

export type ChargeOrderStatusView = {
  chargeOrderId: number;
  outTradeNo: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  expireAt: string | null;
  externalTransactionId: string | null;
};

export type AlipayQueryOrderResult = ChargeOrderStatusView & {
  alipayOrder?: {
    trade_no?: string;
    trade_status?: string;
    total_amount?: string;
    buyer_pay_amount?: string;
    receipt_amount?: string;
    buyer_logon_id?: string;
    buyer_id?: string;
    buyer_open_id?: string;
    send_pay_date?: string;
    subject?: string;
    body?: string;
  } | null;
  alipayQueryFailed?: boolean;
};

export type AlipayCloseOrderResult = Pick<
  ChargeOrderStatusView,
  "chargeOrderId" | "outTradeNo" | "amount" | "status"
> & {
  closePending?: boolean;
  closePendingReason?: "platform_not_ready" | "close_not_confirmed";
  message?: string;
};

export type ChargeOrderView = {
  id: number;
  outTradeNo: string;
  amount: number;
  provider: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  expireAt: string | null;
  externalTransactionId: string | null;
};

export type TransactionView = {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  bizId: string;
  createdAt: string;
};

export type ChargeOrderItem = ChargeOrderView;
export type TransactionItem = TransactionView;
