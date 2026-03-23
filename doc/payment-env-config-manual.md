# 支付环境变量配置手册

更新时间：`2026-03-15`

本文档只整理当前代码中“支付链路真实读取并生效”的环境变量，范围限定为支付宝充值与订单同步。

## 1. 读取位置

支付相关环境变量的主要读取点如下：

1. `lib/env.ts`
2. `lib/server/payment/alipay.ts`
3. `lib/server/payment/charge-orders.ts`
4. `lib/server/payment/scheduler.ts`
5. `scripts/init-payment-config.ts`

## 2. 启用支付的最小配置

以下 3 项是支付宝支付真正启用的最小条件：

1. `ALIPAY_APP_ID`
2. `ALIPAY_PRIVATE_KEY`
3. `ALIPAY_PUBLIC_KEY`

说明：

1. 任意一项缺失，`isAlipayEnabled()` 会返回 `false`。
2. `pnpm payment:config:init` 也会基于这 3 项决定是否把 `PaymentConfig(provider=alipay)` 置为 `enabled`。
3. 代码兼容读取 `ALIPAY_APPID`，但只建议统一使用 `ALIPAY_APP_ID`。

## 3. 当前已生效的支付环境变量

| 变量名 | 是否必需 | 默认值 | 生效位置 | 作用 |
|---|---|---|---|---|
| `ALIPAY_APP_ID` | 是 | 无 | `lib/env.ts` / `alipay.ts` / `init-payment-config.ts` | 支付宝应用 AppId |
| `ALIPAY_APPID` | 兼容别名 | 无 | `lib/env.ts` | `ALIPAY_APP_ID` 缺失时的兼容读取值 |
| `ALIPAY_PRIVATE_KEY` | 是 | 无 | `lib/env.ts` / `alipay.ts` / `init-payment-config.ts` | 商户应用私钥 |
| `ALIPAY_PUBLIC_KEY` | 是 | 无 | `lib/env.ts` / `alipay.ts` / `init-payment-config.ts` | 支付宝公钥 |
| `ALIPAY_NOTIFY_URL` | 强烈建议 | 无 | `lib/env.ts` / `alipay.ts` | 异步通知地址 |
| `ALIPAY_RETURN_URL` | 可选 | 无 | `lib/env.ts` / `alipay.ts` | 电脑网站支付完成后的同步回跳地址 |
| `ALIPAY_APP_AUTH_TOKEN` | 按需 | 无 | `lib/env.ts` / `alipay.ts` | 服务商代商户模式下的应用授权令牌 |
| `ALIPAY_GATEWAY` | 建议显式配置 | `https://openapi.alipay.com/gateway.do` | `lib/env.ts` / `alipay.ts` | 支付宝网关地址 |
| `PAYMENT_ORDER_TIMEOUT_MINUTES` | 建议显式配置 | `10` | `lib/env.ts` / `charge-orders.ts` / `init-payment-config.ts` | 订单超时时间 |
| `PAYMENT_SCHEDULER_ENABLED` | 建议显式配置 | `true` | `lib/env.ts` / `scheduler.ts` | 是否启动支付兜底任务 |
| `PAYMENT_ORDER_SYNC_CRON` | 可选 | `*/20 * * * * *` | `lib/env.ts` / `scheduler.ts` | pending 订单同步任务周期 |
| `PAYMENT_ORDER_CLOSE_CRON` | 可选 | `*/30 * * * * *` | `lib/env.ts` / `scheduler.ts` | 过期订单关单任务周期 |
| `PAYMENT_ORDER_SYNC_BATCH_SIZE` | 可选 | `50` | `lib/env.ts` / `charge-orders.ts` | 单次同步领取批量 |
| `PAYMENT_ORDER_CLOSE_BATCH_SIZE` | 可选 | `50` | `lib/env.ts` / `charge-orders.ts` | 单次关单领取批量 |
| `PAYMENT_ORDER_PROCESSING_STALE_SECONDS` | 可选 | `120` | `lib/env.ts` / `charge-orders.ts` | `processing` 卡单回收阈值 |

## 4. 当前预留但尚未实际接线的变量

下列变量在 `lib/env.ts` 中有读取入口，但当前支付主链路没有真实使用：

| 变量名 | 当前状态 | 说明 |
|---|---|---|
| `ALIPAY_SYS_SERVICE_PROVIDER_ID` | 预留未接线 | 当前下单、查单、关单、回调中都没有把它写入请求参数 |

这类变量不要误判为“已经生效”。如果后续要启用服务商补充分润或特定服务商链路，需要再补代码接线与回归验证。

## 5. 关键变量说明

## 5.1 `ALIPAY_NOTIFY_URL`

建议值：

```text
https://your-domain.com/api/alipay/notify
```

说明：

1. 未配置时，不影响“是否启用支付”的判断。
2. 但未配置后，支付宝不会主动回调到本系统。
3. 此时只能依赖前端 `query-order` 和后端调度任务兜底同步。

## 5.2 `ALIPAY_RETURN_URL`

说明：

1. 这是用户浏览器付款完成后的同步回跳地址。
2. 当前创建收银台 URL 时会自动带上该值。
3. 不配置不会阻塞下单，但会失去浏览器端回跳体验。

## 5.3 `ALIPAY_APP_AUTH_TOKEN`

说明：

1. 当前代码已经接入该变量。
2. 如果配置了值，`page pay`、`query`、`close` 请求都会自动附带。
3. 仅服务商代商户模式需要，普通直连商户不要误配。

## 5.4 `PAYMENT_ORDER_TIMEOUT_MINUTES`

说明：

1. 控制订单过期时间。
2. 同时会写入 `payment:config:init` 生成的支付公开配置。
3. 前端创建订单成功后展示的倒计时也会基于这个值。

## 5.5 `PAYMENT_SCHEDULER_ENABLED`

说明：

1. 控制应用内的支付调度任务是否启动。
2. 关闭后，不会启动：
   - pending 订单同步任务
   - 过期订单自动关单任务
3. 关闭该开关后，支付最终一致性将更依赖 notify 和前端查单。

## 6. 推荐生产配置

```env
ALIPAY_APP_ID="2021000xxxxxxx"
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

ALIPAY_NOTIFY_URL="https://your-domain.com/api/alipay/notify"
ALIPAY_RETURN_URL="https://your-domain.com/"
ALIPAY_APP_AUTH_TOKEN=""
ALIPAY_GATEWAY="https://openapi.alipay.com/gateway.do"

PAYMENT_ORDER_TIMEOUT_MINUTES="10"
PAYMENT_SCHEDULER_ENABLED="true"
PAYMENT_ORDER_SYNC_CRON="*/20 * * * * *"
PAYMENT_ORDER_CLOSE_CRON="*/30 * * * * *"
PAYMENT_ORDER_SYNC_BATCH_SIZE="50"
PAYMENT_ORDER_CLOSE_BATCH_SIZE="50"
PAYMENT_ORDER_PROCESSING_STALE_SECONDS="120"
```

## 7. 本地开发最小示例

如果只是本地验证“支付配置是否可启用”，最少需要：

```env
ALIPAY_APP_ID="2021000xxxxxxx"
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

但如果要完整验证 notify、回跳、关单和最终一致性，仍建议把第 6 节中的推荐配置补齐。

## 8. 初始化与上线步骤

建议按下面顺序操作：

1. 配置支付环境变量。
2. 执行数据库迁移：

```bash
pnpm prisma:business:migrate:deploy
```

3. 初始化支付配置：

```bash
pnpm payment:config:init
```

4. 如需覆盖默认展示名、图标、金额区间和预设金额，再执行：

```bash
pnpm payment:config:init -- --force-overwrite
```

5. 手工验证：
   - 创建订单
   - 跳转支付页
   - notify 回调
   - 前端查单
   - 订单关闭
   - 超时自动关单

## 9. 常见错误与排查

1. 现象：支付配置显示不可用。  
原因：`ALIPAY_APP_ID`、`ALIPAY_PRIVATE_KEY`、`ALIPAY_PUBLIC_KEY` 缺失其一。  
处理：补齐环境变量后重启服务，并重新执行 `pnpm payment:config:init`。

2. 现象：支付页能打开，但一直没有回调。  
原因：`ALIPAY_NOTIFY_URL` 未配置或公网不可达。  
处理：配置公网 HTTPS 地址，并检查反向代理是否允许 `POST /api/alipay/notify`。

3. 现象：关单时前端提示“平台确认中”。  
原因：平台尚未确认关单，这不是配置错误。  
处理：保留轮询，让前端继续查单即可。

4. 现象：定时任务未执行。  
原因：`PAYMENT_SCHEDULER_ENABLED=false`，或应用未跑在 Node runtime 常驻进程中。  
处理：确认部署模型，再核对开关和日志。

5. 现象：服务商模式接口调用失败。  
原因：`ALIPAY_APP_AUTH_TOKEN` 缺失、失效，或商户未完成授权。  
处理：重新获取授权令牌，并确认商户签约与授权状态。

## 10. 相关文档

1. `doc/payment-change-guide.md`
2. `doc/alipay-integration-config.md`
3. `doc/payment-integration-manual.md`
