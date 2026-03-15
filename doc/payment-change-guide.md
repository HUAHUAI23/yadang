# 支付链路改造说明

更新时间：`2026-03-15`

本文档只描述本轮支付改造真实落地到代码的部分，重点覆盖支付宝充值链路、订单状态机、BFF 接口语义和前端交互收口。

## 1. 适用范围

本次改造主要涉及以下文件：

1. `lib/server/payment/alipay.ts`
2. `lib/server/payment/charge-orders.ts`
3. `lib/validation/payment.ts`
4. `app/api/recharge/route.ts`
5. `app/api/alipay/query-order/route.ts`
6. `app/api/alipay/close-order/route.ts`
7. `app/api/alipay/notify/route.ts`
8. `components/patent-lens/recharge-dialog.tsx`
9. `components/patent-lens/recharge-dialog-pay-view.tsx`
10. `components/patent-lens/recharge-dialog-checkout.ts`
11. `components/patent-lens/recharge-dialog-shared.tsx`
12. `components/patent-lens/recharge-dialog-records-view.tsx`

## 2. 本次改造要解决的问题

改造前主要有 5 类问题：

1. 平台状态未确认时，部分关单场景可能过早把本地订单落为终态，存在错账风险。
2. 极端竞态下，平台已支付成功，但本地订单已经被标成 `closed` 或 `failed`，后续无法自动纠正。
3. 支付网关异常时，仍可能先创建本地订单，再发现支付宝不可用，容易产生无效待支付订单。
4. 充值金额校验过松，前端和服务端都需要更严格的“两位小数内正数金额”约束。
5. 用户主动关闭订单时，平台暂未确认关闭被直接展示为错误，前端体验与后端保守语义不一致。

## 3. 设计原则

本次支付链路按以下原则收敛：

1. 平台状态优先，宁可返回 `pending`，也不在平台未确认时误落 `closed`。
2. 支付成功只有一条真相路径，最终都收敛到统一的入账逻辑。
3. 路由层保持轻量，只做鉴权、校验、状态码映射。
4. 前端不放大中间态，不把“确认中”误提示成“失败”。
5. 复杂性只保留在领域服务层，避免在 API 和页面层重复实现支付判断。

## 4. 后端改造

## 4.1 支付网关适配层

文件：`lib/server/payment/alipay.ts`

新增或强化了以下能力：

1. `probeAlipayOrderQuery(outTradeNo)`
   - 在创建订单阶段做支付宝网关预探测。
   - 只有 `ACQ.TRADE_NOT_EXIST` 被视为“网关可用但该订单尚不存在”的正常结果。
   - 其他异常直接视为网关不可用，阻止本地创建无效订单。
2. `isAlipayTradeAlreadyClosedError(error)`
   - 用于识别 `ACQ.TRADE_HAS_CLOSE`，避免平台已关闭时重复报错。
3. `withAppAuthToken(...)`
   - 如果配置了 `ALIPAY_APP_AUTH_TOKEN`，会自动附带到下单、查单、关单请求中。

## 4.2 订单领域服务

文件：`lib/server/payment/charge-orders.ts`

### 4.2.1 创建订单

`createAlipayChargeOrder(...)` 的执行顺序现在是：

1. 校验支付配置与金额范围。
2. 生成 `outTradeNo` 和支付页 URL。
3. 立刻调用 `probeAlipayOrderQuery(outTradeNo)` 做网关健康探测。
4. 只有探测通过后，才创建本地 `ChargeOrder`。

这样可以把“网关已异常但本地先落单”的问题前移拦截。

### 4.2.2 关单状态机

`closeAlipayChargeOrder(...)` 现在是保守状态机，核心规则如下：

1. 先查平台状态，避免“平台已支付成功但本地还没同步”时误关单。
2. 平台若已是 `success` 或 `closed`，直接返回对账后的真实状态。
3. 调用 `alipay.trade.close` 成功后，再落本地 `closed`。
4. 如果支付宝返回 `ACQ.TRADE_HAS_CLOSE`，本地补落 `closed`。
5. 如果关单失败，再做一次平台对账。
6. 如果平台仍未明确返回可确认状态，则返回：
   - `status: "pending"`
   - `retryable: true`
   - `reason: "platform_not_ready" | "close_not_confirmed"`

这里的 `pending` 不是错误，而是“平台尚未确认，先保持本地可继续同步”。

### 4.2.3 成功回补

`finalizeAlipaySuccess(...)` 现在允许从以下状态恢复为成功：

1. `pending`
2. `processing`
3. `closed`
4. `failed`

恢复成功后会在 `metadata` 中写入：

1. `recoveredFromStatus`
2. `recoveredAt`

这一步是为了解决“先被本地关单或失败，后又被平台确认支付成功”的极端竞态。

### 4.2.4 金额校验

金额校验已收紧为：

1. 必须是有限数值。
2. 必须大于 `0`。
3. 最多保留两位小数。

服务端入口有两层保护：

1. `lib/validation/payment.ts` 的 `zod` 校验。
2. `lib/server/payment/charge-orders.ts` 的金额解析与分值换算。

## 4.3 BFF API 语义

### 4.3.1 `POST /api/recharge`

职责：

1. 创建支付宝充值订单。
2. 返回支付页 URL 和过期时间。
3. 在请求内触发 `ensurePaymentSchedulersStarted()`，保证兜底任务已启动。

### 4.3.2 `GET /api/alipay/query-order`

职责：

1. 只在本地状态为 `pending` 或 `processing` 时主动向支付宝查单。
2. 平台查单成功后，必要时触发本地状态同步或入账。
3. 返回最新本地视图。

### 4.3.3 `POST /api/alipay/close-order`

这是本次最重要的接口语义变更。

当前返回不再只有“成功 / 失败”两态，而是三种语义：

1. 平台确认已关闭
2. 平台已确认支付成功
3. 平台尚未确认关闭，返回 `200` + `closePending`

`closePending` 场景下的典型响应如下：

```json
{
  "code": 0,
  "data": {
    "chargeOrderId": 123,
    "outTradeNo": "ALI17420000000001ABCD",
    "amount": 100,
    "status": "pending",
    "closePending": true,
    "closePendingReason": "close_not_confirmed",
    "message": "关闭请求已提交，平台确认中。当前订单状态会继续自动同步。"
  }
}
```

注意：

1. `closePending` 不代表本地已关闭。
2. 前端应继续轮询或主动查单，而不是把它当成失败终态。

### 4.3.4 `POST /api/alipay/notify`

职责：

1. 验签支付宝回调。
2. 只处理 `trade_status=TRADE_SUCCESS`。
3. 调用统一成功入账逻辑。

## 5. 前端改造

文件：

1. `components/patent-lens/recharge-dialog.tsx`
2. `components/patent-lens/recharge-dialog-pay-view.tsx`
3. `components/patent-lens/recharge-dialog-records-view.tsx`
4. `components/patent-lens/recharge-dialog-shared.tsx`
5. `components/patent-lens/recharge-dialog-checkout.ts`

本次前端调整分两层：

### 5.1 结构拆分

原充值弹窗已拆成支付视图、记录视图、共享工具和收银台窗口工具，减少单文件过大带来的维护成本。

### 5.2 关单交互收口

`handleCloseOrder()` 现在的行为是：

1. 正常关闭时更新本地订单状态。
2. 如果后端返回 `closePending`，不再弹错误框。
3. 改为显示页内轻提示：平台确认中，状态会继续自动同步。
4. 同时补一次主动查单，后续仍保留原有轮询。

也就是说，本次把“平台确认中”从报错语义改成了状态语义。

## 6. 当前状态机说明

本地订单状态仍是：

1. `pending`
2. `processing`
3. `success`
4. `closed`
5. `failed`

但需要明确两点：

1. `closed` 和 `failed` 不再是绝对不可恢复状态。
2. 只要平台后来确认支付成功，本地仍允许回补成 `success`。

建议按下面的理解使用：

1. `pending`：等待支付或等待平台确认。
2. `processing`：被任务或对账流程领取处理中。
3. `success`：已成功入账，终态。
4. `closed`：平台或本地已确认关闭，原则上终态，但仍允许被平台成功支付纠正。
5. `failed`：本地判定失败，原则上终态，但仍允许被平台成功支付纠正。

## 7. 运维注意事项

1. 支付启用的最小条件是：
   - `ALIPAY_APP_ID`
   - `ALIPAY_PRIVATE_KEY`
   - `ALIPAY_PUBLIC_KEY`
2. `ALIPAY_NOTIFY_URL` 强烈建议配置为公网 HTTPS 地址，否则只能依赖前端轮询和定时任务补偿。
3. `PAYMENT_SCHEDULER_ENABLED` 在生产建议保持开启，否则超时关单和 pending 对账只能依赖应用内其他触发点。
4. `payment:config:init` 会根据支付宝密钥是否齐全决定 `PaymentConfig` 是否置为 `enabled`。
5. 关单接口现在存在“平台确认中”中间态，这是有意设计，不应回退成直接报错。

## 8. 回归验证建议

建议至少手工验证以下场景：

1. 正常创建订单并跳转收银台。
2. 支付成功后通过 notify 入账。
3. notify 丢失时，通过 `query-order` 自动补账。
4. 超时订单被调度任务关闭。
5. 用户手动关闭订单时，如果平台未立即确认，前端展示轻提示而不是失败弹窗。
6. 订单本地已 `closed` 后，平台又回调成功时，可自动纠正为 `success`。
7. 输入 `0`、负数、三位小数金额时，前后端都能拒绝。

## 9. 相关文档

如需查看部署与环境变量，请继续阅读：

1. `doc/payment-env-config-manual.md`
2. `doc/alipay-integration-config.md`
3. `doc/payment-integration-manual.md`
