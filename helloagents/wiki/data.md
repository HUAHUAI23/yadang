# 数据模型

## 概述
前端以本地状态与本地存储保存用户积分、历史记录与检索结果。

---

## 数据边界
- **业务库（MySQL）:** 由 Prisma Migrate 管理表结构与迁移
- **外部商品库（MySQL）:** 仅通过 `prisma db pull` 同步结构，可读写但不维护表结构
- **Milvus 向量库:** 通过 SDK 访问（规划）

---

## 数据结构

### SearchConfig
**描述:** 检索配置

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| patents | boolean | 非空 | 是否检索外观专利 |
| trademarks | boolean | 非空 | 是否检索商标 |

---

### PatentResult
**描述:** 检索结果条目

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | string | 主键 | 条目ID |
| type | enum | 非空 | DESIGN_PATENT / TRADEMARK |
| title | string | 非空 | 标题 |
| number | string | 非空 | 编号 |
| owner | string | 非空 | 权利人 |
| filingDate | string | 可选 | 申请日期 |
| issueDate | string | 可选 | 授权日期 |
| description | string | 非空 | 描述 |
| imageUrl | string | 非空 | 图片URL |
| status | string | 可选 | 状态 |
| similarityScore | number | 可选 | 相似度 0-1 |

---

### UserCredits
**描述:** 用户积分

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| balance | number | 非空 | 当前余额 |
| totalRecharged | number | 非空 | 累计充值 |

---

### HistoryItem
**描述:** 检索历史

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | string | 主键 | 历史记录ID |
| timestamp | number | 非空 | 时间戳 |
| thumbnail | string | 非空 | 缩略图 Base64 |
| config | object | 非空 | 检索配置 |
| cost | number | 非空 | 消耗积分 |
| results | object | 非空 | 结果集合 |
