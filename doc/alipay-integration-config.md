# 支付宝接入配置指南

更新时间：`2026-03-02`

本文档只说明“接入本项目支付宝支付”必须配置的内容，包括环境变量、支付宝开放平台配置、数据库初始化与上线检查。

## 1. 前置条件

1. 项目依赖已安装：`alipay-sdk`、`qrcode`、`croner`。
2. 业务库已迁移到包含支付表结构的版本（`PaymentConfig`、`ChargeOrder`）。
3. 服务部署在可被支付宝回调访问的公网 HTTPS 域名下。

## 2. 环境变量配置

## 2.1 必配变量（缺一不可）

| 变量名 | 说明 | 示例 |
|---|---|---|
| `ALIPAY_APP_ID` | 支付宝应用 AppId | `2021000xxxxxxx` |
| `ALIPAY_PRIVATE_KEY` | 商户应用私钥（RSA2） | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----` |
| `ALIPAY_PUBLIC_KEY` | 支付宝公钥 | `-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----` |
| `ALIPAY_NOTIFY_URL` | 支付宝异步通知地址 | `https://your-domain.com/api/alipay/notify` |

说明：

1. `ALIPAY_NOTIFY_URL` 必须是公网可访问的 HTTPS 地址，不能是内网地址。
2. 应用私钥和支付宝公钥必须与支付宝开放平台配置一致。
3. 项目兼容读取 `ALIPAY_APPID`，但建议统一使用 `ALIPAY_APP_ID`。
4. 脚本 `payment:config:init` 会用这 4 个变量判断是否启用支付宝支付。

## 2.2 建议配置（有默认值）

| 变量名 | 默认值 | 用途 |
|---|---|---|
| `ALIPAY_GATEWAY` | `https://openapi.alipay.com/gateway.do` | 支付宝网关地址 |
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
2. 生产环境建议按实际 QPS 调整 Cron 周期和批量大小。
3. `PAYMENT_ORDER_PROCESSING_STALE_SECONDS` 用于回收异常中断后卡在 `processing` 的订单。

## 2.3 `.env` 示例

```env
ALIPAY_APP_ID="2021000xxxxxxx"
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
ALIPAY_NOTIFY_URL="https://your-domain.com/api/alipay/notify"
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
4. 异步通知地址配置为 `ALIPAY_NOTIFY_URL`。
5. 通知必须可直接访问到项目路由：`POST /api/alipay/notify`。

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
| `POST /api/recharge` | 统一充值下单入口（当前走支付宝） |
| `POST /api/alipay/create-order` | 创建支付宝订单，返回二维码 |
| `GET /api/alipay/query-order` | 查订单状态并做兜底同步 |
| `POST /api/alipay/close-order` | 用户取消或系统关单 |
| `POST /api/alipay/notify` | 支付宝异步通知回调 |
| `GET /api/payment/config` | 拉取支付可用配置 |
| `GET /api/recharge/orders` | 查询充值订单 |
| `GET /api/transactions` | 查询交易/消费记录 |

## 6. 上线核对清单

1. `ALIPAY_*` 四项必配变量已配置且无拼写错误。
2. `ALIPAY_NOTIFY_URL` 可被公网 POST 访问。
3. 业务库迁移完成，`PaymentConfig`、`ChargeOrder` 表存在。
4. `pnpm payment:config:init` 执行成功，`PaymentConfig(provider=alipay)` 状态正确。
5. 订单创建、扫码支付、notify 回调、前端轮询、后端定时兜底均验证通过。
6. 日志中无签名校验失败、金额不匹配、重复入账异常。

## 7. 常见问题排查

1. 现象：支付配置显示不可用。  
原因：`ALIPAY_APP_ID`、`ALIPAY_PRIVATE_KEY`、`ALIPAY_PUBLIC_KEY`、`ALIPAY_NOTIFY_URL` 有缺失。  
处理：补齐后重启服务并执行 `pnpm payment:config:init`。

2. 现象：创建订单失败“支付宝异步回调地址未配置”。  
原因：`ALIPAY_NOTIFY_URL` 未配置。  
处理：配置后重启。

3. 现象：notify 一直失败。  
原因：域名不可达、证书错误、验签密钥不匹配。  
处理：先验证公网连通，再核对平台公钥/应用私钥。

4. 现象：用户已支付但本地仍 pending。  
原因：notify 丢失或失败。  
处理：前端 `query-order` 和后端 Croner 会兜底同步；同时排查 notify 日志。

## 8. 参考文档

1. 支付宝开放平台：<https://opendocs.alipay.com/open/270>
2. Croner 文档：<https://croner.56k.guru/getting-started/>
