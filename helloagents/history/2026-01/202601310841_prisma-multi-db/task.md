# 任务清单: Prisma 多数据库接入（业务库 + 外部商品库）

目录: `helloagents/plan/202601310841_prisma-multi-db/`

---

## 1. 依赖与脚本
- [√] 1.1 在 `package.json` 中新增 Prisma 相关依赖与脚本，验证 why.md#需求-多数据库接入-场景-业务库可迁移
- [√] 1.2 新增 `.env.example` 并补充 BUSINESS_DATABASE_URL / EXTERNAL_DATABASE_URL，验证 why.md#需求-多数据库接入-场景-业务库可迁移

## 2. Prisma Schema
- [√] 2.1 新建 `prisma/business/schema.prisma`（business datasource + generator output），验证 why.md#需求-多数据库接入-场景-业务库可迁移
- [√] 2.2 新建 `prisma/external/schema.prisma`（external datasource + generator output + 注释说明 db pull 流程），验证 why.md#需求-多数据库接入-场景-外部库可读写但不迁移

## 3. Prisma Client 封装
- [√] 3.1 新增 `lib/db/business.ts` 统一 PrismaClient 初始化与缓存，验证 why.md#需求-多数据库接入-场景-业务库可迁移
- [√] 3.2 新增 `lib/db/external.ts` 统一 PrismaClient 初始化与缓存，验证 why.md#需求-多数据库接入-场景-外部库可读写但不迁移
- [√] 3.3 新增 `lib/db/index.ts` 导出封装入口，验证 why.md#需求-多数据库接入-场景-外部库可读写但不迁移

## 4. 文档更新
- [√] 4.1 更新 `helloagents/project.md` 技术栈，验证 why.md#需求-多数据库接入-场景-业务库可迁移
- [√] 4.2 更新 `helloagents/wiki/arch.md` 增加业务库/外部库与 Milvus 位置说明，验证 why.md#需求-多数据库接入-场景-外部库可读写但不迁移
- [√] 4.3 更新 `helloagents/wiki/data.md` 数据边界说明，验证 why.md#需求-多数据库接入-场景-外部库可读写但不迁移
- [√] 4.4 更新 `helloagents/wiki/modules/lib.md` 记录数据库客户端封装，验证 why.md#需求-多数据库接入-场景-业务库可迁移

## 5. 安全检查
- [√] 5.1 执行安全检查（连接字符串不入库、外部库不执行 migrate、Prisma 仅服务端使用）

## 6. 测试
- [-] 6.1 运行 `pnpm prisma:business:generate` 验证业务库 client 生成
  > 备注: 未安装新依赖，未执行生成命令。
- [-] 6.2 运行 `pnpm prisma:external:pull` 验证外部库同步（需可用 DB）
  > 备注: 未配置外部数据库连接，未执行同步。
