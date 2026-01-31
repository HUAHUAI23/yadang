# PatentLens 前端 (zrt)

> 本文件包含项目级别的核心信息。详细的模块文档见 `modules/` 目录。

---

## 1. 项目概述

### 目标与背景
以 `yadang-1` 目录为 UI/UX 参考，使用 Next.js App Router + Route Groups 实现同等交互与视觉体验，仅前端实现，后端暂以伪接口占位。

### 范围
- **范围内:** 交互与视觉对齐、组件工程化、API 统一封装、目录组织优化。
- **范围外:** 真实后端与支付、鉴权服务接入。

### 干系人
- **负责人:** 产品/前端

---

## 2. 模块索引

| 模块名称 | 职责 | 状态 | 文档 |
|---------|------|------|------|
| app | 路由、布局、全局样式 | 🚧开发中 | [modules/app.md](modules/app.md) |
| components | 业务组件与页面区域 | 🚧开发中 | [modules/components.md](modules/components.md) |
| components/ui | shadcn UI 原子组件 | ✅稳定 | [modules/components-ui.md](modules/components-ui.md) |
| hooks | 共享 Hook | 🚧开发中 | [modules/hooks.md](modules/hooks.md) |
| lib | 工具与 API 封装（含 mock） | 🚧开发中 | [modules/lib.md](modules/lib.md) |
| stores | Zustand 状态管理与持久化 | 🚧开发中 | [modules/stores.md](modules/stores.md) |

---

## 3. 快速链接
- [技术约定](../project.md)
- [架构设计](arch.md)
- [API 手册](api.md)
- [数据模型](data.md)
- [变更历史](../history/index.md)
