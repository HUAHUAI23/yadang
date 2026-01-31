# 任务清单: yadang-1 UI/UX 复刻（Next 16 App Router）

目录: `helloagents/history/2026-01/202601301535_yadang-ui-ux/`

---

## 1. 路由与布局
- [√] 1.1 更新 `app/layout.tsx`：使用中文元数据与 Plus Jakarta Sans，设置 `lang="zh-CN"`，验证 why.md#需求-首页视觉与交互复刻-场景-用户进入首页
- [√] 1.2 新建 `app/(site)/page.tsx` 渲染 AppShell，并移除 `app/page.tsx`，验证 why.md#需求-首页视觉与交互复刻-场景-用户进入首页

## 2. 全局样式与性能
- [√] 2.1 在 `app/globals.css` 中补齐 yadang-1 对齐样式（glass/gradient/blur/scan-line/scrollbar），加入 reduced-motion 兜底，验证 why.md#需求-首页视觉与交互复刻-场景-用户进入首页

## 3. 类型/常量/状态
- [√] 3.1 新建 `lib/types.ts` 与 `lib/constants.ts`，对齐 yadang-1 结构与中文文案，验证 why.md#需求-上传检索与结果展示-场景-上传并检索
- [√] 3.2 新建 `stores/patent-lens.ts`（Zustand + persist），保存 auth/credits/history/searchConfig，验证 why.md#需求-历史侧边栏-场景-点击历史记录

## 4. API 统一封装（Mock）
- [√] 4.1 新建 `lib/api/client.ts` 与 `lib/api/mock.ts`，实现统一 request + mock 数据返回，验证 why.md#需求-API-统一封装-场景-触发检索请求
- [√] 4.2 新建 `lib/api/index.ts` 暴露 auth/search/recharge/history 方法，验证 why.md#需求-API-统一封装-场景-触发检索请求

## 5. 业务组件（UI/UX 复刻）
- [√] 5.1 新建 `components/patent-lens/app-shell.tsx`、`components/patent-lens/header.tsx`、`components/patent-lens/landing.tsx`，对齐顶部与首屏，验证 why.md#需求-首页视觉与交互复刻-场景-用户进入首页
- [√] 5.2 新建 `components/patent-lens/upload-section.tsx`、`components/patent-lens/library-option.tsx`、`components/patent-lens/search-results.tsx`，对齐上传区与结果区，验证 why.md#需求-上传检索与结果展示-场景-上传并检索
- [√] 5.3 新建 `components/patent-lens/history-sidebar.tsx`、`components/patent-lens/footer.tsx`，对齐历史与页脚，验证 why.md#需求-历史侧边栏-场景-点击历史记录
- [√] 5.4 新建 `components/patent-lens/patent-detail.tsx`、`components/patent-lens/recharge-dialog.tsx`、`components/patent-lens/auth-dialog.tsx`，对齐弹窗体验，验证 why.md#需求-详情弹窗与认证/充值-场景-打开详情弹窗

## 6. 安全检查
- [√] 6.1 执行安全检查（按G9: 输入校验、敏感信息、权限与高风险操作规避）

## 7. 文档更新
- [√] 7.1 更新 `helloagents/wiki/overview.md` 与 `helloagents/wiki/modules/components.md`，记录新增结构与模块职责

## 8. 测试
- [√] 8.1 执行 `pnpm lint`，通过
