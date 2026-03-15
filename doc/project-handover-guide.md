# ZRT 项目接手总指南（完整工程版）

文档版本：`v2.0`  
更新时间：`2026-03-02`

## 1. 项目定位
`zrt` 是一个「图像检索 + 账户计费 + 在线充值」一体化系统，当前采用 BFF 架构：

1. 前后端主服务：`Next.js 16 + React 19 + TypeScript`
2. 向量服务：`FastAPI`（独立目录 `services/vector-api-fastapi`）
3. 数据存储：业务库 MySQL + 外部库 MySQL + Milvus + OSS
4. 支付：支付宝接入，采用 `notify 回调 + 前端轮询 + 后端 Croner 轮询/关单` 三重兜底

核心业务闭环：

1. 用户登录
2. 上传图片执行商标检索
3. 按账户价格扣费（单位：分）
4. 前端展示统一换算为元
5. 余额不足时发起支付宝充值并自动到账

---

## 2. 仓库目录全量分析（逐目录）

> 下面覆盖仓库顶层主要目录职责，供新同学/AI Agent快速定位。

| 目录 | 职责 | 关键说明 |
|---|---|---|
| `.github/` | CI/CD 工作流 | 包含 CI、Docker 构建推送工作流 |
| `.next/` | Next 构建产物 | 本地构建缓存与输出，非源码 |
| `.pnpm-store/` | 依赖缓存 | pnpm 本地缓存 |
| `.vscode/` | IDE 配置 | 本地开发器配置 |
| `app/` | Next App Router 主目录 | 页面入口、所有 BFF API 路由 |
| `components/` | 前端组件 | `patent-lens` 业务组件 + `ui` 基础组件 |
| `doc/` | 项目文档 | 运维、环境、交接文档 |
| `helloagents/` | 历史方案与知识库 | 过程资产，不是运行时依赖 |
| `hooks/` | React Hooks | 通用 Hook（当前体量较小） |
| `lib/` | 核心业务代码 | 鉴权、数据库、支付、检索服务、API客户端 |
| `prisma/` | 数据模型与迁移 | business/external 双 schema + migration + generated client |
| `public/` | 静态资源 | 本地字体、静态图片 |
| `scripts/` | 初始化脚本 | 认证、检索价格、支付配置初始化 |
| `services/` | 子服务 | FastAPI 向量服务（独立部署） |
| `stores/` | 前端状态管理 | Zustand 全局状态 |
| `tmp/` | 临时目录 | 本地临时文件 |
| `types/` | TS 声明补充 | 第三方类型补充 |
| `node_modules/` | 依赖安装目录 | 非源码 |

### 2.1 `app/` 细分

1. `app/(site)/page.tsx`：站点入口页面。
2. `app/api/**/route.ts`：后端接口（鉴权、检索、支付、历史、订单、交易）。
3. `app/layout.tsx`：全局字体和页面壳。
4. `app/globals.css`：全局样式变量与效果。

### 2.2 `components/` 细分

1. `components/patent-lens/*`：核心业务 UI（上传、结果、历史、充值弹窗等）。
2. `components/ui/*`：通用 UI 组件库（基本来自 shadcn 体系）。

### 2.3 `lib/` 细分（重点）

1. `lib/api/*`：前端请求封装与 API 方法。
2. `lib/auth/*`：JWT、会话、用户转换。
3. `lib/db/*`：Prisma Client 单例与连接参数。
4. `lib/server/trademark-search/*`：检索业务编排（上传、向量化、Milvus、扣费、历史记录）。
5. `lib/server/payment/*`：支付宝网关适配、订单服务、定时任务。
6. `lib/money.ts`：分/元换算工具（统一金额语义）。
7. `lib/types.ts`：前后端共享 TS 类型。

### 2.4 `prisma/` 细分

1. `prisma/business/schema.prisma`：业务核心模型。
2. `prisma/business/migrations/*`：业务迁移历史。
3. `prisma/external/schema.prisma`：外部库读取模型（只读场景）。
4. `prisma/generated/*`：Prisma 生成客户端（业务和外部）。

### 2.5 `services/vector-api-fastapi/` 细分

1. `app/main.py`：FastAPI 入口。
2. `app/inference.py`：模型加载与向量推理。
3. `app/config.py`：服务配置读取。
4. `app/schemas.py`：接口输入输出 Schema。
5. `Dockerfile` / `docker-compose.yml`：子服务容器化。

---

## 3. 框架与架构设计

## 3.1 主服务技术栈

1. 框架：`next@16.1.6`（App Router）。
2. 前端：`react@19.2.3` + Tailwind CSS v4。
3. 数据层：`prisma@7` + MariaDB adapter。
4. 鉴权：`jose` + HttpOnly Cookie。
5. 状态管理：`zustand`。
6. 表单与校验：`react-hook-form` + `zod`。
7. 支付：`alipay-sdk` + `croner`。
8. 观测：`pino` + `AsyncLocalStorage`（traceId 链路透传）。

## 3.2 关键设计模式（工程化）

1. 网关适配模式：`lib/server/payment/alipay.ts`
   - 屏蔽支付宝 SDK 细节，对外暴露统一方法（下单/查单/关单/验签）。
2. 领域服务模式：`lib/server/payment/charge-orders.ts`
   - 聚合订单、账户、流水更新的业务规则和事务边界。
3. 薄路由模式：`app/api/**/route.ts`
   - 路由仅做鉴权、参数校验、返回码映射；核心逻辑交给服务层。
4. 单例资源模式：Prisma 客户端、支付 SDK、Scheduler 使用全局单例。
5. 幂等 + 行锁模式：支付回调与补偿路径均使用事务和 `FOR UPDATE` 防重复入账。

---

## 4. package.json 全解析

## 4.1 Scripts

| Script | 作用 |
|---|---|
| `dev` | Next 开发模式 |
| `build` | Next 构建（默认 Turbopack） |
| `start` | Next 生产启动 |
| `lint` / `lint:fix` | ESLint 检查/自动修复 |
| `prisma:business:generate` | 生成业务库 Prisma Client |
| `prisma:business:migrate:dev` | 业务库开发迁移 |
| `prisma:business:migrate:deploy` | 业务库生产迁移 |
| `prisma:business:studio` | 业务库可视化 |
| `prisma:external:pull/generate/studio` | 外部库建模同步 |
| `auth:config:init` | 初始化认证方式配置 |
| `search:config:init` | 初始化检索价格配置 |
| `payment:config:init` | 初始化支付配置（支付宝） |
| `system:config:init` | 一键初始化 auth + search + payment |

## 4.2 依赖分类（主要）

1. UI 体系：Radix + shadcn 组件集。
2. 服务端能力：Prisma、Aliyun SDK、Milvus SDK、OSS。
3. 支付能力：`alipay-sdk`、`croner`。
4. 数据校验/状态：`zod`、`zustand`。

---

## 5. 数据模型设计（重点）

## 5.1 现有核心模型

1. `User`：用户主体。
2. `Account`：账户余额（`BigInt`，单位：分）。
3. `Transaction`：资金流水（充值、扣费等，支持 `bizId` 业务外联）。
4. `TrademarkSearchRecord`：每次检索审计与结果快照。

## 5.2 新增支付模型（本次）

1. `PaymentConfig`
   - 支付渠道配置（非敏感配置落库，敏感密钥走环境变量）。
   - 字段覆盖：provider、displayName、status、限额、预设金额、publicConfig。
2. `ChargeOrder`
   - 通用充值订单模型。
   - 支持 provider、平台单号、支付凭证、状态机、过期时间、元数据、交易关联。

## 5.3 新增枚举（本次）

1. `PaymentMethod`：`balance/wechat/stripe/alipay/manual`
2. `PaymentProvider`：`wechat/alipay/stripe`
3. `PaymentConfigStatus`：`enabled/disabled`
4. `ChargeOrderStatus`：`pending/processing/success/failed/closed`

---

## 6. 金额体系（必须遵守）

统一规则：

1. 数据库存储与计算：`分`（BigInt）。
2. 前端展示与 API 展示字段：`元`（number，保留两位）。
3. 换算工具：`lib/money.ts`
   - `fenToYuan`
   - `yuanToFen`
   - `yuanToFenNumber`
   - `formatYuan`

当前已统一的关键接口：

1. `/api/auth/me` 返回 `account.balance` 为元。
2. `/api/search/price` 返回 `amount/balance` 为元。
3. 检索结果和历史中的 `cost/balance` 为元。
4. 充值/订单/交易列表展示均为元。

---

## 7. 支付架构与接口设计（本次新增）

## 7.1 支付状态保障策略

采用三层兜底：

1. 主路径：`notify`（支付宝异步回调）
   - 实时性最好，支付成功后优先入账。
2. 前端兜底：`query-order` 轮询
   - 用户支付后前端主动查单，发现平台成功但本地未更新时自动补账。
3. 后端兜底：`Croner` 定时任务
   - 周期同步 pending 订单状态；超时订单自动关闭。

三条路径并存不会重复加钱：

1. 订单处理在事务内执行。
2. 使用 `FOR UPDATE` 行锁。
3. 幂等判断：订单已 success 则直接返回。

## 7.2 支付 API 清单

1. `POST /api/recharge`
   - 创建支付宝充值订单，返回收银台跳转信息与过期时间。
2. `GET /api/alipay/query-order?outTradeNo=...|chargeOrderId=...`
   - 查询订单状态，必要时触发补偿入账。
3. `POST /api/alipay/close-order`
   - 主动关闭订单（取消支付/超时关单）。
4. `POST /api/alipay/notify`
   - 支付宝回调，验签后处理到账。
5. `GET /api/payment/config`
   - 获取支付配置可用性与公开配置。
6. `GET /api/recharge/orders`
   - 查询用户充值订单。
7. `GET /api/transactions?kind=all|recharge|expense`
   - 查询交易记录（含消费记录）。

支付平台文档参考：

1. 支付宝开放平台（电脑网站支付/交易接口）：<https://opendocs.alipay.com/open/270>

---

## 8. 定时任务设计（Croner）

定时任务入口：`lib/server/payment/scheduler.ts`  
启动入口：根目录 `instrumentation.ts`

任务：

1. pending 订单同步：`syncPendingAlipayOrders`
2. 超时订单关闭：`closeExpiredPendingOrders`

Cron 表达式由环境变量控制：

1. `PAYMENT_ORDER_SYNC_CRON`
2. `PAYMENT_ORDER_CLOSE_CRON`
3. `PAYMENT_ORDER_PROCESSING_STALE_SECONDS`

关键点：

1. 使用 `Croner` 的 `protect: true`，避免同任务重入。
2. 使用全局状态防止重复启动。
3. 后端轮询采用“领取任务（`FOR UPDATE SKIP LOCKED`）+ `processing` 状态”减少多实例重复处理。
4. `processing` 订单超时可回收，避免 worker 异常导致卡单。
5. 每次任务执行生成 `traceId`，输出结构化日志：`job.start / job.finish / job.error`。

参考文档：

1. Croner 官方文档：<https://croner.56k.guru/getting-started/>
2. Croner GitHub：<https://github.com/Hexagon/croner>

---

## 9. 前端当前主设计

## 9.1 页面布局

1. 顶部：Header（余额、登录态、充值入口）。
2. 左侧：历史检索侧栏。
3. 中间：上传与搜索配置区域。
4. 底部：结果与详情抽屉。

## 9.2 充值弹窗（本次重构）

`components/patent-lens/recharge-dialog.tsx` 已改造为：

1. Tab1「发起充值」
   - 读取支付配置
   - 选择预设金额或自定义金额
   - 创建订单并打开支付宝收银台
   - 订单状态轮询与倒计时
   - 支持主动取消订单
2. Tab2「订单与账单」
   - 充值订单列表
   - 交易记录列表（全部/充值/消费筛选）

交互目标：

1. 用户可在新标签页完成付款，原页面负责同步订单结果。
2. 支付成功后自动刷新余额与账单。

---

## 10. 环境变量（支付新增部分）

### 10.1 支付网关

1. `ALIPAY_APP_ID`
2. `ALIPAY_PRIVATE_KEY`
3. `ALIPAY_PUBLIC_KEY`
4. `ALIPAY_NOTIFY_URL`
5. `ALIPAY_GATEWAY`

### 10.2 后端补偿任务

1. `PAYMENT_SCHEDULER_ENABLED`
2. `PAYMENT_ORDER_TIMEOUT_MINUTES`
3. `PAYMENT_ORDER_SYNC_CRON`
4. `PAYMENT_ORDER_CLOSE_CRON`
5. `PAYMENT_ORDER_SYNC_BATCH_SIZE`
6. `PAYMENT_ORDER_CLOSE_BATCH_SIZE`
7. `PAYMENT_ORDER_PROCESSING_STALE_SECONDS`

### 10.3 日志与追踪

1. `LOG_LEVEL`

---

## 11. 初始化与启动流程（接手必做）

1. 安装依赖：`pnpm install`
2. 生成 Prisma Client：
   - `pnpm prisma:business:generate`
   - `pnpm prisma:external:generate`
3. 执行数据库迁移：`pnpm prisma:business:migrate:deploy`
4. 初始化系统配置：`pnpm system:config:init`
5. 启动开发：`pnpm dev`

支付上线前最小验证：

1. 创建充值订单成功。
2. 支付成功时 notify 可入账。
3. notify 不可达时，前端 query-order 可补账。
4. 长时间 pending 能被后端任务同步/关闭。

---

## 12. API 与目录接手建议（给 AI Agent）

建议执行顺序：

1. 先读 `lib/server/payment/charge-orders.ts`（业务真相）。
2. 再读 `app/api/alipay/*`（接口编排）。
3. 再读 `components/patent-lens/recharge-dialog.tsx`（前端交互流）。
4. 再读 `doc/logging-trace-guide.md`（日志链路与 trace 规范）。
5. 再读 `doc/payment-integration-manual.md`（支付接入与默认配置总手册）。
6. 最后读 `prisma/business/schema.prisma`（数据边界）。

变更原则：

1. 资金相关逻辑必须进事务。
2. 订单状态机修改要同时校验 notify/query/cron 三条路径。
3. 新增金额字段必须声明单位（分或元）。
4. 优先改服务层，再让路由保持薄控制器。

---

## 13. 风险点与排错清单

## 13.1 高风险点

1. 任意新增充值入口绕过订单体系导致错账。
2. 金额单位混用（分/元）导致错账。
3. notify 验签失败导致支付成功未入账。
4. 未启用 scheduler 导致 pending 订单积压。

## 13.2 快速排错

1. 下单失败：检查 `payment_configs`、`ALIPAY_*` 环境变量、网关连通性。
2. 回调失败：检查 `ALIPAY_NOTIFY_URL`、签名配置、公钥是否正确。
3. 入账重复担忧：查 `ChargeOrder.status` 和 `Transaction.bizId` 是否幂等。
4. 订单不关闭：检查 Cron 配置和 `instrumentation.ts` 是否在运行实例加载。

---

## 14. 当前改造摘要（2026-03-02）

本次已完成：

1. 支付配置表 + 充值订单表 + 枚举模型落地。
2. 支付服务分层（网关适配、订单领域服务、调度器）。
3. 支付 API 全链路（create/query/close/notify + config/orders/transactions）。
4. 前端充值弹窗升级到支付宝支付闭环。
5. 金额单位统一到「库内分、展示元」。
6. 新增支付配置初始化脚本并接入系统初始化命令。

---

## 15. 后续优化建议

1. 增加支付与资金相关单元测试/集成测试（当前以运行验证为主）。
2. 已完成支付全链路统一日志（API/领域服务/网关/调度）。建议下一步接入日志平台（ELK/Loki/Sentry）并按 `traceId` 建立查询面板。
3. 为交易记录加入分页游标接口，避免长列表全量拉取。
4. 为支付状态轮询改造为 SSE/WebSocket，减少轮询开销。
5. 增加后台管理端（支付配置管理、人工补单、对账报表）。
