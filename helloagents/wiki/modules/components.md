# components

## 目的
承载业务组件与页面区域组件。

## 模块概述
- **职责:** Header、Landing、Upload、Results、Modals 等业务组件
- **状态:** 🚧开发中
- **最后更新:** 2026-01-30

## 规范
### 需求: 业务组件拆分
**模块:** components
业务组件集中在 `components/patent-lens/`，按区域拆分 Header、Landing、Upload、Results、Dialogs 等，避免单文件过大。

#### 场景: 复用组件
组件按功能命名并保持低耦合
- 支持跨页面复用与未来 admin 扩展

## API接口
无

## 数据模型
无

## 依赖
- components/ui
- lib
- hooks

## 变更历史
- [202601301535_yadang-ui-ux](../../history/2026-01/202601301535_yadang-ui-ux/) - UI/UX 复刻组件落地
