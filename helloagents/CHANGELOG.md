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
- Prisma 7 仅结构拉取工作流与脚本
- 业务库迁移表结构与 dotenv 统一加载
- Prisma 7 Config 多库配置（prisma.config.ts）
- 用户系统（用户名密码 + 短信验证码登录）
- 环境变量统一管理类（EnvConfig）
- 新增 Account 表（账户额度 BIGINT）

### 变更
- 全局样式与字体体系对齐 yadang-1 视觉规范
- 移除 yadang-1 参考目录并清理文档索引
- 修复 `components/ui/sidebar.tsx` 的渲染纯度 lint 错误
- 将业务图片标签替换为 `next/image` 以通过 lint 与优化资源加载
- 升级阿里云短信 SDK 至 `@alicloud/dysmsapi20180501` 并兼容新旧发送 API

### 修复
- 修正 Prisma config 的 schema/migrations 路径解析，避免重复拼接路径
- 放宽短信登录手机号校验为至少9位数字
- 补充 Prisma schema 的 datasource url，修复 Prisma Client 初始化失败
