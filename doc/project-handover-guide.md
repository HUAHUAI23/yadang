# ZRT 项目全面分析与接手指南

文档版本：`v1.0`

更新时间：`2026-03-02`

适用对象：新接手本项目的人类工程师、AI Agent、DevOps、测试与产品协作人员。

---

## 1. 项目定位与结论速览

`zrt` 是一个双服务协作的“图片检索 + 账户扣费”系统：

1. 主服务：Next.js 16（App Router）承载前端页面与 BFF API。
2. 子服务：FastAPI（Python）提供图片向量化能力。
3. 数据侧：业务 MySQL + 外部 MySQL + Milvus + 阿里云 OSS。
4. 业务闭环：登录/注册 -> 上传图片 -> 向量检索 -> 外部库匹配 -> 账户扣费 -> 历史追溯 -> 充值。

当前项目可构建、可运行，但存在文档老化、测试体系缺失、部分依赖未落地使用等典型“可交付但需治理”的问题。

---

## 2. 仓库结构总览（逐目录）

以下覆盖仓库顶层每个目录的职责。

| 目录 | 类型 | 作用 | 是否建议纳入接手重点 |
|---|---|---|---|
| `.github/` | 配置 | CI、Docker 多架构构建与发布工作流 | 是 |
| `.next/` | 产物目录 | Next 构建输出（本地生成） | 否（仅排错时） |
| `.pnpm-store/` | 缓存目录 | pnpm 本地依赖缓存 | 否 |
| `.vscode/` | IDE 配置 | 格式化、ESLint 保存动作等 | 中 |
| `app/` | 业务核心 | Next App Router 页面与 API 路由 | 是 |
| `components/` | 业务核心 | 页面业务组件 + shadcn/ui 基础组件 | 是 |
| `doc/` | 文档 | 部署/环境说明（本文件也在这里） | 是 |
| `helloagents/` | 协作知识库 | 历史方案、wiki、changelog、流程资产 | 中（参考） |
| `hooks/` | 代码 | 通用 Hook（目前仅 `use-mobile`） | 低 |
| `lib/` | 业务核心 | API 客户端、认证、数据库、检索服务 | 是 |
| `node_modules/` | 依赖目录 | 本地依赖安装结果 | 否 |
| `prisma/` | 数据核心 | business/external schema、迁移、生成目录 | 是 |
| `public/` | 静态资源 | 字体、静态图标 | 中 |
| `scripts/` | 运维脚本 | 初始化认证方式和检索价格配置 | 是 |
| `services/` | 子服务 | FastAPI 向量化服务 | 是 |
| `stores/` | 前端状态 | Zustand 全局状态 | 中 |
| `tmp/` | 临时目录 | 本地临时产物目录（当前为空） | 否 |
| `types/` | 类型补充 | `ali-oss` 声明补充 | 低 |

### 2.1 根文件重点

| 文件 | 作用 |
|---|---|
| `package.json` | Node 依赖与脚本中枢 |
| `pnpm-lock.yaml` | Node 依赖锁定 |
| `Dockerfile` | 主服务多阶段镜像构建 |
| `next.config.ts` | Next standalone、serverExternalPackages、remote images |
| `tsconfig.json` | TS 编译约束，排除 Python 子服务 |
| `eslint.config.mjs` | 规则 + 忽略项（`components/ui/**` 被忽略） |
| `.env.example` | 主服务环境变量模板 |
| `README.md` | 仍是 Next 默认模板，未反映真实业务 |

---

## 3. 技术栈与框架

### 3.1 主服务（Node/前后端一体）

1. 框架：`next@16.1.6`（App Router）
2. 前端：`react@19.2.3` + TypeScript
3. 样式：`tailwindcss@4` + `tw-animate-css`
4. 组件体系：shadcn/ui + Radix UI 套件
5. 状态：`zustand`
6. 校验：`zod` + `react-hook-form`
7. 鉴权：`jose`（JWT + HttpOnly Cookie）
8. 数据访问：`prisma@7.3.0` + `@prisma/adapter-mariadb`
9. 向量检索：`@zilliz/milvus2-sdk-node`
10. 对象存储：`ali-oss`（动态 require）
11. 短信：阿里云 `@alicloud/dysmsapi20170525`

### 3.2 向量子服务（Python）

1. 框架：FastAPI
2. 模型：Transformers + Torch（`facebook/dinov3-vitl16-pretrain-lvd1689m`）
3. 接口：`POST /v1/vectorize`（Bearer 鉴权）
4. 环境管理：`pydantic-settings`
5. 依赖管理：`pyproject.toml + uv.lock + requirements.txt`

---

## 4. package.json 深度解析

### 4.1 Scripts（接手常用）

1. `pnpm dev`：Next 开发模式。
2. `pnpm build`：生产构建。
3. `pnpm start`：生产启动。
4. `pnpm lint`：ESLint。
5. `pnpm prisma:business:*`：业务库 generate/migrate/studio。
6. `pnpm prisma:external:*`：外部库 pull/generate/studio。
7. `pnpm auth:config:init`：初始化认证方式表。
8. `pnpm search:config:init`：初始化全局检索价格。
9. `pnpm system:config:init`：组合执行两类初始化脚本。

### 4.2 依赖使用现状

从源码静态导入看，主干依赖覆盖了 UI、鉴权、数据库、Milvus、短信、表单、状态管理。

“疑似未直接使用（仅 package.json 声明）”依赖：

1. `@tanstack/react-query`
2. `@tanstack/react-query-devtools`
3. `alipay-sdk`
4. `date-fns`
5. `immer`

说明：`ali-oss` 虽未静态 import，但在 `lib/server/trademark-search/oss.ts` 中通过 `createRequire` 动态加载，属于已使用依赖。

---

## 5. 代码结构与主业务链路

## 5.1 前端入口

1. 路由入口：`app/(site)/page.tsx`。
2. 页面主壳：`components/patent-lens/app-shell.tsx`。
3. 状态中心：`stores/patent-lens.ts`。
4. API 客户端：`lib/api/index.ts` + `lib/api/client.ts`。

## 5.2 主业务流程（检索）

1. 用户登录后上传图片（Base64 Data URL）。
2. `POST /api/search` 做参数校验（zod）。
3. 读取会话 + 账户（`resolveSessionContext`）。
4. 获取生效价格（用户价优先，回退全局价）。
5. 校验余额，不足返回 `402`。
6. 图片解码、计算 sha256、生成 OSS objectKey。
7. 上传查询图到 OSS 并获得签名 URL。
8. 调用 FastAPI 向量接口取向量。
9. 使用 Milvus 搜索向量 TopK。
10. 用命中的 publication/serial 关联外部库 `patent_design`。
11. 在事务内扣费并写流水（`trsanction`）+ 检索记录。
12. 返回结果、消耗、余额、历史主键。

## 5.3 API 路由清单

| 路由 | 方法 | 是否需要会话 | 功能 |
|---|---|---|---|
| `/api/auth/config` | GET | 否 | 获取登录方式开关 |
| `/api/auth/login/password` | POST | 否 | 用户名密码登录 |
| `/api/auth/login/sms` | POST | 否 | 短信登录 |
| `/api/auth/register` | POST | 否 | 注册并登录 |
| `/api/auth/sms` | POST | 否 | 发送短信验证码 |
| `/api/auth/logout` | POST | 否 | 清会话 Cookie |
| `/api/auth/me` | GET | 是 | 返回当前用户和账户 |
| `/api/search/price` | GET | 是 | 获取当前检索价格和余额 |
| `/api/search` | POST | 是 | 发起检索并扣费 |
| `/api/search/history` | GET | 是 | 最近 50 条历史 |
| `/api/history/clear` | POST | 是 | 清空个人历史 |
| `/api/recharge` | POST | 是 | 套餐充值（直充） |

## 5.4 认证体系

1. JWT：HS256，`sub` 存 userId。
2. Cookie：`httpOnly + sameSite=lax + secure(生产)`。
3. 密码：Node `scrypt` + salt 哈希。
4. 短信码：HMAC-SHA256 存 hash，含过期/冷却/尝试次数。
5. 登录方式可配置（`AuthMethodConfig`）。

---

## 6. 数据层设计

## 6.1 业务库（`prisma/business/schema.prisma`）

核心模型：

1. `User`
2. `Account`（余额 BigInt）
3. `AuthMethodConfig`
4. `VerificationCode`
5. `SearchPrice`（全局价 + 用户特价）
6. `Transaction`（映射表名 `trsanction`）
7. `TrademarkSearchRecord`（完整链路审计快照）

迁移历史：

1. `20260208145005_init_user_account`
2. `20260223130837_remove_user_credits`
3. `20260301142458_add_trademark_search_pricing_and_records`

## 6.2 外部库（`prisma/external/schema.prisma`）

1. 仅 `patent_design` 模型。
2. 项目只读查询，不维护迁移。

## 6.3 Prisma 生成客户端注意事项（关键）

源码直接引用了 `@/prisma/generated/business/*` 和 `@/prisma/generated/external/*`。

这些生成文件不在 Git 跟踪中，接手后必须先执行：

```bash
pnpm prisma:business:generate
pnpm prisma:external:generate
```

否则编译会缺少类型与 client。

---

## 7. 目录详细分析（逐目录）

## 7.1 `app/`

1. `layout.tsx`：加载本地字体、全局 metadata。
2. `globals.css`：Tailwind v4 设计令牌 + 动效类。
3. `api/*/route.ts`：所有后端接口都在这里。

设计特征：采用 Next BFF 结构，前后端同仓，减少跨仓协调成本。

## 7.2 `components/`

### `components/patent-lens/`

业务组件集中在这个目录，含：

1. `app-shell.tsx`：页面状态中枢与 API 编排。
2. `auth-dialog.tsx`：登录/注册/SMS 表单交互。
3. `upload-section.tsx`：上传、拖拽、检索触发。
4. `search-results.tsx`：结果卡片。
5. `history-sidebar.tsx`：历史记录侧栏。
6. `patent-detail.tsx`：详情弹窗。
7. `recharge-dialog.tsx`：充值套餐。
8. `header.tsx`/`landing.tsx`/`footer.tsx`：导航与营销展示。

### `components/ui/`

1. 共 53 个 shadcn/Radix 原子组件。
2. 基本无业务逻辑，偏模板化基础层。
3. 已被 ESLint 忽略（避免模板代码告警噪音）。

## 7.3 `hooks/`

1. 当前仅 `use-mobile.ts`，用于断点识别。

## 7.4 `lib/`

### `lib/api/`

1. `client.ts`：统一请求函数，统一 `ApiResponse`。
2. `index.ts`：前端 API 方法集合。

### `lib/auth/`

1. `jwt.ts`：签发/验签/写删 cookie。
2. `session.ts`：会话解析和账户补建。
3. `password.ts`：scrypt 哈希验证。
4. `sms.ts`：阿里云短信发送。
5. `verification.ts`：短信验证码生命周期。
6. `config.ts`：登录方式开关。
7. `user.ts`：DB -> API DTO 映射。

### `lib/db/`

1. `adapter.ts`：MariaDB adapter 封装。
2. `db-url.ts`：连接串解析 + SSL 选项。
3. `business.ts`/`external.ts`：Prisma Client 单例。

### `lib/server/trademark-search/`

1. `service.ts`：检索主编排（最核心）。
2. `pricing.ts`：价格策略。
3. `account-ledger.ts`：账户扣费与流水。
4. `vectorizer.ts`：调用 FastAPI 向量接口。
5. `milvus.ts`：向量检索。
6. `repository.ts`：外部库匹配与结果组装。
7. `oss.ts`：上传/签名 URL。
8. `utils.ts`：解码、哈希、对象键构造、BigInt/JSON 安全转换。

### `lib/validation/`

1. `auth.ts`：注册/登录/SMS 校验。
2. `search.ts`：检索/充值校验。

## 7.5 `prisma/`

1. `business/`：业务 schema + migration + prisma config。
2. `external/`：外部 schema + prisma config。
3. `generated/`：本地生成客户端目录（不在 Git 跟踪）。

## 7.6 `scripts/`

1. `init-auth-method-config.ts`：初始化 `PASSWORD/SMS` 开关。
2. `init-trademark-search-config.ts`：初始化全局检索价格，支持 `--force-amount`。

## 7.7 `services/vector-api-fastapi/`

1. `app/main.py`：应用入口、生命周期、鉴权、路由。
2. `app/inference.py`：模型加载与向量推理。
3. `app/config.py`：环境变量配置。
4. `app/schemas.py`：请求响应模型。
5. `Dockerfile`/`docker-compose.yml`：容器化运行。
6. `pyproject.toml` + `uv.lock` + `requirements.txt`：依赖管理。

说明：该目录存在本地 `.venv`，属于开发环境产物，不应纳入源码评审。

## 7.8 `stores/`

1. `patent-lens.ts`：登录态、余额、历史缓存与操作器。

## 7.9 `types/`

1. `ali-oss.d.ts`：动态 require 场景下的模块声明补丁。

## 7.10 `public/`

1. 字体文件和图标资源。
2. 结果图并不来自 `public`，来自 OSS / 外部 URL。

## 7.11 `doc/`

已有文档覆盖 env、CI、部署初始化，但需要与当前代码持续比对更新。

## 7.12 `helloagents/`

1. 内部协作知识库、历史方案、wiki。
2. 部分内容与当前代码存在漂移（见风险章节）。

## 7.13 `.github/workflows/`

1. `ci.yml`：Node lint。
2. `docker-build-push.yml`：主服务多架构镜像构建与发布。
3. `vector-api-fastapi-ci.yml`：子服务 lint + 构建发布。

---

## 8. 环境变量与外部系统依赖

主服务最低依赖（摘要）：

1. 两套 MySQL：`BUSINESS_DATABASE_URL`、`EXTERNAL_DATABASE_URL`
2. JWT：`JWT_SECRET` 等
3. 短信：阿里云 SMS AK/SK + 签名模板
4. OSS：桶、地域、AK/SK
5. Milvus：地址、集合名、检索参数
6. 向量接口：`VECTOR_API_ENDPOINT`、`VECTOR_API_KEY`

子服务最低依赖（摘要）：

1. 模型 ID 与设备策略
2. `VECTOR_API_KEY`
3. 可选 `HF_TOKEN`（gated 模型）

重点一致性约束：

1. 主服务 `VECTOR_API_KEY` 必须与子服务一致。
2. `VECTOR_DIMENSION` 必须与向量模型输出、Milvus 集合维度一致。

---

## 9. CI/CD 与容器

## 9.1 主服务 Docker

1. Node 22 alpine 多阶段构建。
2. 构建阶段先 `prisma generate` 再 `next build`。
3. 运行阶段使用 Next standalone 产物。
4. `.dockerignore` 排除了 `doc/`、`helloagents/`、`tmp/`。

## 9.2 GitHub Actions

1. Node CI：`pnpm lint`。
2. 主服务 Docker workflow：PR 构建校验，主分支推送镜像。
3. Vector API workflow：ruff + compile check + Docker 多架构发布。

---

## 10. 实测验证结果（本次分析过程）

已执行并确认：

1. `pnpm lint`：通过，仅 1 条 warning（`patent-detail.tsx` 的 `setState in effect`）。
2. `pnpm build`：在放宽沙箱限制后成功完成，路由产物正常。
3. `services/vector-api-fastapi`：`.venv/bin/ruff check app` 通过。
4. `python3 -m compileall -q services/vector-api-fastapi/app` 通过。

说明：`pnpm build` 在默认沙箱下会触发 Turbopack 端口绑定限制导致失败，这属于执行环境限制，不是代码构建错误。

---

## 11. 当前风险与技术债

1. `README.md` 仍是 Next 默认模板，接手成本高。
2. 自动化测试缺失（Node/Python 都无业务测试）。
3. `components/ui/**` 被 ESLint 全量忽略，模板改坏难被发现。
4. `helloagents/wiki` 中部分描述已过时：
   1. 仍描述“向量 API 伪实现/可回退 mock”。
   2. 部分记录提到短信 SDK 20180501，但当前代码为 20170525。
5. 依赖治理未完成：存在疑似未使用依赖（React Query、Alipay SDK 等）。
6. 鉴权与风控仍偏轻：
   1. 登录/检索接口无统一限流。
   2. 注册验证码图形校验在前端本地生成，不具备强安全性。
7. 运维耦合高：外部系统较多（双 MySQL + OSS + Milvus + FastAPI），本地搭建复杂。

---

## 12. 新接手人员操作手册（Human + AI Agent）

## 12.1 首次接手 Checklist

1. 安装 Node 22 + pnpm 10。
2. 安装 Python 3.12（子服务建议 uv）。
3. 复制并填写 `.env` 与 `services/vector-api-fastapi/.env`。
4. 启动 MySQL（business/external）与 Milvus。
5. 安装依赖：`pnpm install`。
6. 生成 Prisma 客户端：

```bash
pnpm prisma:business:generate
pnpm prisma:external:generate
```

7. 迁移业务库：

```bash
pnpm prisma:business:migrate:deploy
```

8. 初始化系统配置：

```bash
pnpm system:config:init
```

9. 启动向量子服务：

```bash
cd services/vector-api-fastapi
uv run uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 1
```

10. 启动主服务：

```bash
pnpm dev
```

## 12.2 冒烟验证顺序

1. `POST /api/auth/register` 或登录。
2. `GET /api/search/price`。
3. `POST /api/search`（上传图）。
4. 检查余额与流水变化。
5. `GET /api/search/history`。
6. `POST /api/history/clear`。
7. `POST /api/recharge`。

## 12.3 AI Agent 接手建议

1. 先读 `lib/server/trademark-search/service.ts`，再读 `app/api/search/route.ts`。
2. 修改数据逻辑前先核对 `prisma/business/schema.prisma` 与迁移。
3. 涉及图片结果时先判断 URL 来源是 `imageList` 还是 OSS 签名。
4. 任何改动后至少执行：`pnpm lint` 与 `pnpm build`。
5. 文档变更优先同步 `doc/` 与 `helloagents/wiki`，避免继续漂移。

---

## 13. 建议的近期治理优先级

1. 重写 `README.md`（替换默认模板，接入本指南关键段落）。
2. 增加最小测试集：
   1. API 合约测试（auth/search/recharge）。
   2. `service.ts` 的核心流程单测（mock OSS/Milvus/Vector API）。
3. 清理未使用依赖并锁定依赖策略。
4. 修复文档漂移（`helloagents/wiki` 与代码一致化）。
5. 为检索/充值加限流与幂等设计。

---

## 14. 关键文件导航（快速跳转）

1. 主流程编排：`lib/server/trademark-search/service.ts`
2. 检索 API：`app/api/search/route.ts`
3. 认证会话：`lib/auth/session.ts`
4. 数据模型：`prisma/business/schema.prisma`
5. 外部库模型：`prisma/external/schema.prisma`
6. 前端主壳：`components/patent-lens/app-shell.tsx`
7. 状态管理：`stores/patent-lens.ts`
8. 向量服务入口：`services/vector-api-fastapi/app/main.py`
9. 向量推理核心：`services/vector-api-fastapi/app/inference.py`
10. 环境变量配置：`lib/env.ts` 与 `services/vector-api-fastapi/app/config.py`

