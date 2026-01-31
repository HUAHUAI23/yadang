# 技术设计: yadang-1 UI/UX 复刻（Next 16 App Router）

## 技术方案
### 核心技术
- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS 4 + tw-animate-css
- shadcn/ui (Radix UI) 作为基础组件
- Zustand + persist 进行本地状态持久化
- react-hook-form + zod 用于复杂表单校验

### 实现要点
- **路由组织:** 使用 Route Groups 对功能域进行隔离，主页在 `(site)` 下，未来 admin 在 `(admin)` 下扩展；保持单一路由入口避免路径冲突。
- **目录结构:** 业务组件聚合到 `components/patent-lens/`；API 与类型集中于 `lib/`；状态集中于 `stores/`；页面仅负责组装。
- **RSC 策略:** 页面默认 Server Component，实际交互逻辑在 `use client` 的 AppShell/子组件中完成。
- **样式与性能:** 继承 yadang-1 的 glass/gradient/blur 语言，限制 blur 半径与层级，减少大面积 backdrop-filter，加入 `prefers-reduced-motion` 兜底。
- **表单处理:** Auth 弹窗使用 RHF + zod；上传/搜索作为客户端交互，直接调用 API client。

## 架构设计
```mermaid
flowchart TD
  A[app/(site)/page.tsx] --> B[AppShell Client]
  B --> C[Header/Landing/Upload/Results/History]
  B --> D[Dialogs(Auth/Recharge/Detail)]
  B --> E[Zustand Store]
  B --> F[API Client(Mock)]
```

## 架构决策 ADR
### ADR-002: 采用 Route Groups 进行入口分区
**上下文:** 未来需要扩展 admin 管理台
**决策:** 采用 `(site)` 作为主站分组，预留 `(admin)` 分组
**理由:** 在不改变 URL 的前提下组织代码、隔离布局
**替代方案:** 单入口扁平目录 → 拓展性差
**影响:** 页面结构清晰，需确保避免路径冲突

### ADR-003: 使用 Zustand + persist 做本地状态管理
**上下文:** 需要本地持久化登录态、积分与历史
**决策:** 使用 Zustand + persist middleware
**理由:** 轻量、易维护、可控性强
**替代方案:** React state + useEffect + localStorage → 分散且难维护
**影响:** 状态集中管理，需保证 client-only 调用

## API设计
保持 `wiki/api.md` 的伪接口定义，接口层统一走 `lib/api/`，当前返回 mock 数据。

## 数据模型
沿用 `wiki/data.md` 中的结构：PatentResult、UserCredits、HistoryItem。

## 安全与性能
- 文件上传仅允许图片类型，尺寸限制在前端进行提示
- 关闭自动播放与高频动画，避免影响性能
- 对 `backdrop-filter`、`blur` 进行数量与尺寸控制

## 测试与部署
- UI 烟测：登录/注册弹窗、上传流程、结果展示、历史回填
- 运行 `pnpm lint` 做基础检查
