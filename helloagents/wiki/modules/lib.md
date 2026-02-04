# lib

## 目的
提供共享工具与 API 封装。

## 模块概述
- **职责:** 工具函数、API Client、Mock 数据、类型辅助与 Prisma 数据库客户端封装
- **状态:** 🚧开发中
- **最后更新:** 2026-02-04

## 规范
### 需求: API 统一封装
**模块:** lib
所有网络请求统一通过 Client/Service 层处理，支持伪接口切换。

#### 场景: 触发检索
调用统一 API 方法
- 返回结构稳定且可测试

### 需求: 数据库客户端封装
**模块:** lib/db
提供业务库与外部商品库的 Prisma Client 封装，并确保仅服务端使用。

#### 场景: 业务库访问
通过 Prisma Client 访问业务库，使用 Prisma Migrate 管理表结构。

#### 场景: 外部商品库访问
通过 Prisma Client 访问外部库，仅同步结构不做迁移。

#### 场景: 环境变量加载
通过 dotenv 统一加载 `.env`，覆盖 Prisma CLI 与服务端模块。

#### 场景: Prisma 配置管理
使用 `prisma.config.ts` 统一定义多库 schema 路径与连接信息。

## API接口
- 参见 `wiki/api.md`

## 数据模型
- 参见 `wiki/data.md`

## 依赖
- Prisma ORM
- dotenv

## 变更历史
- [202601301535_yadang-ui-ux](../../history/2026-01/202601301535_yadang-ui-ux/) - Mock API 与类型封装
- [202601310841_prisma-multi-db](../../history/2026-01/202601310841_prisma-multi-db/) - Prisma 多数据库客户端封装
- [202602040627_prisma7-introspection](../../history/2026-02/202602040627_prisma7-introspection/) - Prisma 7 仅结构拉取工作流
- [202602040741_prisma7-config-mysql](../../history/2026-02/202602040741_prisma7-config-mysql/) - Prisma 7 Config 多库配置
