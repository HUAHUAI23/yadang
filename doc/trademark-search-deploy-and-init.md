# 商标检索功能配置与初始化说明

本文档覆盖本次任务新增功能的部署前检查、环境变量说明、初始化脚本和联调顺序。

## 1. 本次新增配置是否有错误

结论：

1. `lib/env.ts` 中新增配置项整体可用，未发现阻断性错误。
2. `.env.example` 已补齐本次功能所需示例，凭证命名已统一（短信使用 `ALIYUN_SMS_ACCESS_KEY_ID` / `ALIYUN_SMS_ACCESS_KEY_SECRET`，OSS 使用 `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET`）。
3. 已新增初始化脚本用于“全局商标检索价格”配置，避免仅依赖 migration seed。

## 2. 本次新增功能涉及的环境变量

最小必配（不配会影响核心功能）：

1. `BUSINESS_DATABASE_URL`
2. `EXTERNAL_DATABASE_URL`
3. `JWT_SECRET`
4. `SMS_CODE_SECRET`
5. `ALIYUN_SMS_SIGN_NAME`
6. `ALIYUN_SMS_TEMPLATE_CODE`
7. `ALIYUN_SMS_ACCESS_KEY_ID` / `ALIYUN_SMS_ACCESS_KEY_SECRET`
8. `ALIYUN_OSS_REGION`
9. `ALIYUN_OSS_BUCKET`
10. `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET`
11. `MILVUS_ADDRESS`

建议配置（线上推荐）：

1. `MILVUS_TOKEN`（显式 token，避免用户名密码回退）
2. `MILVUS_COLLECTION_NAME`
3. `MILVUS_TOP_K`
4. `MILVUS_SEARCH_PARAMS`
5. `VECTOR_API_ENDPOINT`
6. `VECTOR_API_KEY`
7. `VECTOR_MODEL_ID`
8. `VECTOR_DIMENSION`（需与 Milvus 向量维度一致）
9. `INITIAL_ACCOUNT_BALANCE`
10. `TRADEMARK_SEARCH_GLOBAL_PRICE`（用于初始化脚本）

备注：

1. 当前实现不再提供伪向量 fallback；`VECTOR_API_ENDPOINT` 必须指向可用的真实向量服务。
2. 建议在主服务与向量服务同时配置 `VECTOR_API_KEY`，通过 Bearer Token 启用接口鉴权。

## 3. 初始化脚本

### 3.1 认证方式初始化（已有）

脚本：

1. `scripts/init-auth-method-config.ts`

命令：

```bash
pnpm auth:config:init
```

作用：

1. 初始化 `AuthMethodConfig`（`PASSWORD`/`SMS`）。

### 3.2 商标检索配置初始化（本次新增）

脚本：

1. `scripts/init-trademark-search-config.ts`

命令：

```bash
pnpm search:config:init
```

可选强制更新全局价格：

```bash
pnpm search:config:init -- --force-amount
```

作用：

1. 检查并初始化 `SearchPrice(code=TRADEMARK_IMAGE_SEARCH, userId=NULL)` 全局价格。
2. 检查是否存在多条全局价格并给出告警（MySQL `NULL` 唯一约束语义导致的常见情况）。
3. 支持通过 `TRADEMARK_SEARCH_GLOBAL_PRICE` 指定目标价格。

### 3.3 一键初始化

命令：

```bash
pnpm system:config:init
```

作用：

1. 依次执行认证方式初始化与商标检索配置初始化。

## 4. 部署与联调顺序

1. 配置 `.env`（可参考 `.env.example`）。
2. 执行业务库迁移：

```bash
pnpm prisma:business:migrate:deploy
```

3. 初始化配置：

```bash
pnpm system:config:init
```

4. 冒烟验证流程：
   1. 登录/注册
   2. 查询价格 `GET /api/search/price`
   3. 图片检索 `POST /api/search`
   4. 校验余额变化与 `trsanction` 流水
   5. 查询历史 `GET /api/search/history`
   6. 清空历史 `POST /api/history/clear`
   7. 充值 `POST /api/recharge`

## 5. 关键代码位置

1. 环境变量管理：`lib/env.ts`
2. 示例配置：`.env.example`
3. 检索服务编排：`lib/server/trademark-search/service.ts`
4. 价格策略：`lib/server/trademark-search/pricing.ts`
5. 账户流水：`lib/server/trademark-search/account-ledger.ts`
6. 初始化脚本（认证）：`scripts/init-auth-method-config.ts`
7. 初始化脚本（检索配置）：`scripts/init-trademark-search-config.ts`
