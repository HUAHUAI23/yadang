# Changelog

本文件记录项目所有重要变更。
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/),
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增
- yadang-1 UI/UX 复刻与 Route Groups 页面结构
- 新增业务组件集（Header/Landing/Upload/Results/Dialogs 等）
- Mock API 统一封装与 Zustand 持久化状态
- Prisma 多数据库接入基础设施（业务库 + 外部商品库）

### 变更
- 全局样式与字体体系对齐 yadang-1 视觉规范
- 移除 yadang-1 参考目录并清理文档索引
- 修复 `components/ui/sidebar.tsx` 的渲染纯度 lint 错误
- 将业务图片标签替换为 `next/image` 以通过 lint 与优化资源加载
