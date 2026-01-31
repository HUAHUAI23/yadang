# 变更提案: Prisma 多数据库接入（业务库 + 外部商品库）

## 需求背景
- 当前仅有前端与伪接口，后续需要接入三类数据源：Milvus 向量库、外部商品信息库（MySQL）、业务库（MySQL）
- 本次仅接入 Prisma 以覆盖业务库与外部商品库的数据访问能力；外部库可读可写但不做表结构维护
- 需要为未来可能新增的管理端或其他项目预留可复用的数据层基础

## 变更内容
1. 引入 Prisma ORM，并为业务库与外部商品库分别建立 schema 与 Client
2. 统一脚本与环境变量，明确业务库迁移链路与外部库同步链路
3. 提供统一的数据库客户端封装层，供后续 API/Server Action 使用

## 影响范围
- **模块:** prisma、lib、package.json、环境变量、wiki
- **文件:** package.json、prisma/**、lib/db/**、.env.example、helloagents/wiki/*
- **API:** 现阶段无后端改动，仅提供数据访问基础设施
- **数据:** 业务库迁移由 Prisma 管理；外部库仅 db pull 同步，不生成迁移

## 核心场景

### 需求: 多数据库接入
**模块:** 数据访问层
本次引入 Prisma，分别连接业务库与外部商品库。

#### 场景: 业务库可迁移
通过 Prisma Migrate 管理业务库 schema，生成迁移文件并生成 Client。

#### 场景: 外部库可读写但不迁移
通过 `prisma db pull` 同步外部库结构，仅生成 Client，不执行 migrate。

## 风险评估
- **风险:** 误对外部库执行 migrate 造成结构变更
  - **缓解:** 脚本拆分为 business/external，外部库仅提供 db pull/generate
- **风险:** 多 Client 输出路径冲突
  - **缓解:** 为每个 schema 指定独立的 client 输出目录
