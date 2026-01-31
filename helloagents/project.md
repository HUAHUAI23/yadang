# 项目技术约定

---

## 技术栈
- **核心:** Next.js 16.1.6 (App Router) / React 19.2.3 / TypeScript 5
- **样式:** Tailwind CSS 4 / tw-animate-css
- **UI 组件:** shadcn/ui (Radix UI)
- **状态管理:** Zustand
- **表单与校验:** react-hook-form + zod + @hookform/resolvers
- **数据访问:** Prisma ORM（业务库 + 外部商品库）
- **数据库:** MySQL（业务/外部）/ Milvus（向量库，规划）

---

## 开发约定
- **路由组织:** 仅在 `app/` 下创建路由与布局，按功能分组使用 Route Groups；页面为 `page.tsx`。
- **组件规范:** 业务组件按功能分组；UI 原子组件固定在 `components/ui/`。
- **命名约定:** 组件 PascalCase，hooks 以 `use` 前缀，类型与接口以 `Xxx` 命名。
- **样式原则:** 优先 Tailwind utility；全局样式仅用于设计令牌与通用效果。

---

## 错误与日志
- **策略:** 前端错误统一在 UI 侧提示，控制台保留调试日志；伪接口以可预测错误结构返回。
- **日志:** 开发环境 console 级别；生产日志待后续引入。

---

## 测试与流程
- **测试:** 当前未建立测试体系，后续按功能补充。
- **提交:** 未强制规范（建议 Conventional Commits）。
