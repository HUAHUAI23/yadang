# 支付宝接入配置指南

更新时间：`2026-03-13`

本文档只说明“接入本项目支付宝支付”必须配置的内容，包括环境变量、支付宝开放平台配置、数据库初始化与上线检查。

## 1. 前置条件

1. 项目依赖已安装：`alipay-sdk`、`croner`。
2. 业务库已迁移到包含支付表结构的版本（`PaymentConfig`、`ChargeOrder`）。
3. 服务部署在可被支付宝回调访问的公网 HTTPS 域名下。

## 2. 环境变量配置

## 2.1 必配变量（用于启用支付）

| 变量名 | 说明 | 示例 |
|---|---|---|
| `ALIPAY_APP_ID` | 支付宝应用 AppId | `2021000xxxxxxx` |
| `ALIPAY_PRIVATE_KEY` | 商户应用私钥（RSA2） | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----` |
| `ALIPAY_PUBLIC_KEY` | 支付宝公钥 | `-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----` |

说明：

1. 应用私钥和支付宝公钥必须与支付宝开放平台配置一致。
2. 项目兼容读取 `ALIPAY_APPID`，但建议统一使用 `ALIPAY_APP_ID`。
3. 脚本 `payment:config:init` 会用这 3 个变量判断是否启用支付宝支付。

## 2.2 建议配置（有默认值）

| 变量名 | 默认值 | 用途 |
|---|---|---|
| `ALIPAY_GATEWAY` | `https://openapi.alipay.com/gateway.do` | 支付宝网关地址 |
| `ALIPAY_NOTIFY_URL` | 无 | 支付宝异步通知地址（建议配置，未配置时不影响启用状态） |
| `ALIPAY_RETURN_URL` | 无 | 电脑网站支付完成后，浏览器同步跳回地址 |
| `ALIPAY_APP_AUTH_TOKEN` | 无 | 服务商代商户调用时的应用授权令牌 |
| `PAYMENT_ORDER_TIMEOUT_MINUTES` | `10` | 订单超时时间（分钟） |
| `PAYMENT_SCHEDULER_ENABLED` | `true` | 是否启用后端兜底任务 |
| `PAYMENT_ORDER_SYNC_CRON` | `*/20 * * * * *` | pending 订单状态同步周期 |
| `PAYMENT_ORDER_CLOSE_CRON` | `*/30 * * * * *` | 超时订单自动关单周期 |
| `PAYMENT_ORDER_SYNC_BATCH_SIZE` | `50` | 每次同步批量数 |
| `PAYMENT_ORDER_CLOSE_BATCH_SIZE` | `50` | 每次关单批量数 |
| `PAYMENT_ORDER_PROCESSING_STALE_SECONDS` | `120` | processing 订单回收阈值（秒） |
| `LOG_LEVEL` | `info` | 服务端结构化日志等级 |

说明：

1. 兜底任务基于 Croner 执行。
2. `ALIPAY_NOTIFY_URL` 建议配置为公网可访问 HTTPS 地址，便于接收支付宝主动回调。
3. 电脑网站支付建议配置 `ALIPAY_RETURN_URL`，便于支付完成后回跳商家页面。
4. 若是服务商代商户收款，需要同时配置 `ALIPAY_APP_AUTH_TOKEN`，并确保商户已完成支付产品签约和应用授权。
5. 生产环境建议按实际 QPS 调整 Cron 周期和批量大小。
6. `PAYMENT_ORDER_PROCESSING_STALE_SECONDS` 用于回收异常中断后卡在 `processing` 的订单。

## 2.3 `.env` 示例

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
LOG_LEVEL="info"
```

## 3. 支付宝开放平台配置

在支付宝开放平台需要确认以下项：

1. 应用 `AppId` 与 `ALIPAY_APP_ID` 一致。
2. 签名算法使用 `RSA2`。
3. 平台公钥、应用私钥与项目环境变量一致。
4. 当前接入按“电脑网站支付”实现，`alipay.trade.page.pay` 使用 `product_code=FAST_INSTANT_TRADE_PAY`。
5. 异步通知地址配置为 `ALIPAY_NOTIFY_URL`。
6. 同步回跳地址建议配置为 `ALIPAY_RETURN_URL`。
7. 通知必须可直接访问到项目路由：`POST /api/alipay/notify`。
8. 若为服务商模式，商户需完成产品签约，并向应用完成授权。

## 4. 数据库与初始化

## 4.1 迁移

```bash
pnpm prisma:business:migrate:deploy
```

## 4.2 初始化支付配置

常规初始化：

```bash
pnpm payment:config:init
```

强制覆盖默认展示/金额配置：

```bash
pnpm payment:config:init -- --force-overwrite
```

说明：

1. 默认模式是“保守更新”，只会更新必要状态与公开配置。
2. `--force-overwrite` 才会覆盖显示名、图标、预设金额、金额区间等。

## 4.3 一键初始化

```bash
pnpm system:config:init
```

该命令会依次执行：认证配置初始化、检索价格初始化、支付配置初始化。

## 5. 服务端路由与行为

| 路由 | 作用 |
|---|---|
| `POST /api/recharge` | 创建支付宝充值订单，返回收银台跳转信息 |
| `GET /api/alipay/query-order` | 查订单状态并做兜底同步 |
| `POST /api/alipay/close-order` | 用户取消或系统超时后撤销未完成订单 |
| `POST /api/alipay/notify` | 支付宝异步通知回调 |
| `GET /api/payment/config` | 拉取支付可用配置 |
| `GET /api/recharge/orders` | 查询充值订单 |
| `GET /api/transactions` | 查询交易/消费记录 |

## 6. 上线核对清单

1. `ALIPAY_APP_ID`、`ALIPAY_PRIVATE_KEY`、`ALIPAY_PUBLIC_KEY` 已配置且无拼写错误。
2. 如使用主动回调，`ALIPAY_NOTIFY_URL` 可被公网 POST 访问。
3. 若为服务商代调用，`ALIPAY_APP_AUTH_TOKEN` 已配置，商户授权有效。
4. 业务库迁移完成，`PaymentConfig`、`ChargeOrder` 表存在。
5. `pnpm payment:config:init` 执行成功，`PaymentConfig(provider=alipay)` 状态正确。
6. 订单创建、跳转支付宝收银台、notify 回调、前端轮询、后端定时兜底均验证通过。
7. 日志中无签名校验失败、金额不匹配、重复入账异常。

## 7. 常见问题排查

1. 现象：支付配置显示不可用。  
原因：`ALIPAY_APP_ID`、`ALIPAY_PRIVATE_KEY`、`ALIPAY_PUBLIC_KEY` 有缺失。  
处理：补齐后重启服务并执行 `pnpm payment:config:init`。

2. 现象：未收到支付宝主动回调。  
原因：`ALIPAY_NOTIFY_URL` 未配置，或地址不可达。  
处理：配置为公网可访问 HTTPS 地址并重启服务。

3. 现象：notify 一直失败。  
原因：域名不可达、证书错误、验签密钥不匹配。  
处理：先验证公网连通，再核对平台公钥/应用私钥。

4. 现象：用户已支付但本地仍 pending。  
原因：notify 丢失或失败。  
处理：前端 `query-order` 和后端 Croner 会兜底同步；同时排查 notify 日志。

5. 现象：下单返回 `ACQ.ACCESS_FORBIDDEN`。  
原因：应用未上线、未开通电脑网站支付、商户未签约，或服务商模式缺少 `ALIPAY_APP_AUTH_TOKEN`。  
处理：先核对开放平台产品权限、应用上线状态、商户授权状态，再检查服务商参数。

## 8. 参考文档

1. 支付宝开放平台：<https://open.alipay.com/>
2. 电脑网站支付产品介绍/接入准备：<https://opendocs.alipay.com/open/270/105898>
3. `alipay.trade.page.pay` 接口：<https://opendocs.alipay.com/open-v3/054ayg>
4. Croner 文档：<https://croner.56k.guru/getting-started/>
