# 支付接入设计手册（支付宝）

更新时间：`2026-03-03`

## 1. 目标与范围

本手册说明当前项目支付宝充值接入的完整工程设计，覆盖：

1. 支付业务流程与状态机
2. 数据表职责与并发安全设计
3. API 与定时任务协作关系
4. 支付宝接入最小配置与默认值

适用代码：

1. `lib/server/payment/charge-orders.ts`
2. `lib/server/payment/alipay.ts`
3. `lib/server/payment/scheduler.ts`
4. `app/api/alipay/*`
5. `app/api/recharge/route.ts`
6. `instrumentation.ts`

---

## 2. 总体设计思路

充值链路采用“三层兜底，一条入账真相”的设计：

1. 主路径：`notify` 异步回调（最实时，优先）
2. 前端兜底：`query-order` 轮询查单（用户态可见）
3. 后端兜底：Croner 定时任务（平台侧最终一致性）

三条路径最终都收敛到同一入账函数（事务内）：

1. 锁订单（`FOR UPDATE`）
2. 校验金额
3. 幂等判断（已 success 直接返回）
4. 写交易流水 + 更新余额 + 更新订单状态

这样可保证“多路径并发触发时不重复加钱”。

---

## 3. 关键数据模型与职责

## 3.1 `PaymentConfig`

职责：支付通道开关、展示配置、充值限额、公开配置（非敏感）。

敏感信息（私钥、公钥、密钥）不落库，只走环境变量。

## 3.2 `ChargeOrder`

职责：充值订单主表，记录：

1. 金额（分）
2. provider
3. 商户单号（`outTradeNo`）
4. 第三方交易号（`externalTransactionId`）
5. 状态（`pending/processing/success/failed/closed`）
6. 过期时间、回调原文、支付凭证、关联交易ID

## 3.3 `Transaction`

职责：资金账本（余额变动事实记录），通过 `bizId` 与订单关联。

---

## 4. 并发与交易安全设计

## 4.1 幂等与唯一约束

1. `Transaction`：`bizId` 唯一约束，防止同业务重复记账。
2. `ChargeOrder`：`[provider, externalTransactionId]` 唯一约束，防止同平台交易号重复落单。

## 4.2 锁策略

1. 入账与关单核心路径对订单行使用 `FOR UPDATE`。
2. 调度任务领取 pending 单使用 `FOR UPDATE SKIP LOCKED`，多实例下避免重复抢单。
3. 领取后先把状态置为 `processing`，执行失败再回滚到 `pending`。

## 4.3 `processing` 卡单回收

通过 `PAYMENT_ORDER_PROCESSING_STALE_SECONDS` 回收异常 worker 遗留任务，避免永久卡在 `processing`。

---

## 5. API 协作关系

1. `POST /api/recharge`：统一充值入口（当前仅 alipay）。
2. `POST /api/alipay/create-order`：创建订单并返回二维码。
3. `POST /api/alipay/notify`：平台回调验签并入账（主路径）。
4. `GET /api/alipay/query-order`：前端轮询查单并兜底同步。
5. `POST /api/alipay/close-order`：用户取消/系统关单。
6. `GET /api/payment/config`：支付配置可用性查询。
7. `GET /api/recharge/orders`：充值订单列表。
8. `GET /api/transactions`：交易记录列表。

---

## 6. 定时任务：启动机制与默认参数

## 6.1 任务何时启动

启动入口有两处：

1. `instrumentation.ts`（Next.js Node runtime 启动时自动触发）
2. `POST /api/recharge`、`POST /api/alipay/create-order` 中的 `ensurePaymentSchedulersStarted()`（兜底）

`scheduler` 内部有全局单例状态，已启动后不会重复注册任务。

## 6.2 两个任务与默认值

任务一：`syncPendingAlipayOrders`

1. 默认 cron：`*/20 * * * * *`（每 20 秒）
2. 默认 batch size：`50`

任务二：`closeExpiredPendingOrders`

1. 默认 cron：`*/30 * * * * *`（每 30 秒）
2. 默认 batch size：`50`

其他相关默认值：

1. `PAYMENT_SCHEDULER_ENABLED=true`
2. `PAYMENT_ORDER_TIMEOUT_MINUTES=10`
3. `PAYMENT_ORDER_PROCESSING_STALE_SECONDS=120`

---

## 7. 支付宝接入配置：最小必配与建议显式配置

## 7.1 最小必配（无默认，缺失会导致支付宝能力不可用）

必须配置：

1. `ALIPAY_APP_ID`
2. `ALIPAY_PRIVATE_KEY`
3. `ALIPAY_PUBLIC_KEY`
4. `ALIPAY_NOTIFY_URL`

说明：

1. 这 4 项用于“是否启用支付宝支付”的核心判定。
2. 任何一项缺失，支付配置会被初始化为 `disabled`。

## 7.2 建议显式配置（有默认值）

推荐在生产显式写出以下项，便于运维可控：

1. `ALIPAY_GATEWAY`（默认 `https://openapi.alipay.com/gateway.do`）
2. `PAYMENT_SCHEDULER_ENABLED`（默认 `true`）
3. `PAYMENT_ORDER_TIMEOUT_MINUTES`（默认 `10`）
4. `PAYMENT_ORDER_SYNC_CRON`（默认 `*/20 * * * * *`）
5. `PAYMENT_ORDER_CLOSE_CRON`（默认 `*/30 * * * * *`）
6. `PAYMENT_ORDER_SYNC_BATCH_SIZE`（默认 `50`）
7. `PAYMENT_ORDER_CLOSE_BATCH_SIZE`（默认 `50`）
8. `PAYMENT_ORDER_PROCESSING_STALE_SECONDS`（默认 `120`）

---

## 8. 你给出的配置清单结论（直接可用）

你列出的这组变量是“生产建议全配”的完整支付配置：

1. `ALIPAY_APP_ID`
2. `ALIPAY_PRIVATE_KEY`
3. `ALIPAY_PUBLIC_KEY`
4. `ALIPAY_NOTIFY_URL`
5. `ALIPAY_GATEWAY`
6. `PAYMENT_SCHEDULER_ENABLED`
7. `PAYMENT_ORDER_TIMEOUT_MINUTES`
8. `PAYMENT_ORDER_SYNC_CRON`
9. `PAYMENT_ORDER_CLOSE_CRON`
10. `PAYMENT_ORDER_SYNC_BATCH_SIZE`
11. `PAYMENT_ORDER_CLOSE_BATCH_SIZE`
12. `PAYMENT_ORDER_PROCESSING_STALE_SECONDS`

其中“支付宝接入最小配置”只要求前 4 项；其余都有默认值，但生产强烈建议显式设置。

---

## 9. 建议的最小生产配置样例

```env
ALIPAY_APP_ID="2021000xxxxxxx"
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
ALIPAY_NOTIFY_URL="https://your-domain.com/api/alipay/notify"

ALIPAY_GATEWAY="https://openapi.alipay.com/gateway.do"
PAYMENT_SCHEDULER_ENABLED="true"
PAYMENT_ORDER_TIMEOUT_MINUTES="10"
PAYMENT_ORDER_SYNC_CRON="*/20 * * * * *"
PAYMENT_ORDER_CLOSE_CRON="*/30 * * * * *"
PAYMENT_ORDER_SYNC_BATCH_SIZE="50"
PAYMENT_ORDER_CLOSE_BATCH_SIZE="50"
PAYMENT_ORDER_PROCESSING_STALE_SECONDS="120"
```

