# 数据模型

## 概述
前端以本地状态与本地存储保存用户积分、历史记录与检索结果。

---

## 数据边界
- **业务库（MySQL）:** 在本项目内维护表结构并使用 Prisma Migrate 管理
- **外部商品库（MySQL）:** 仅通过 `prisma db pull` 同步结构，可读写但不维护表结构
- **Milvus 向量库:** 通过 SDK 访问（规划）
- **Prisma 配置:** 业务库/外部库均使用 `prisma.config.ts` 统一管理连接与 schema 路径

---

## 业务库表结构（基础）

### User
**描述:** 用户账号

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | 主键 | 自增ID |
| username | String | 唯一 | 用户名（可为空） |
| phone | String | 唯一 | 手机号（可为空） |
| email | String | 唯一 | 邮箱（可为空） |
| avatar | String | 非空 | 头像 |
| passwordHash | String | 可选 | 密码摘要 |
| createdAt | DateTime | 非空 | 创建时间 |
| updatedAt | DateTime | 非空 | 更新时间 |

### UserCredits
**描述:** 用户积分

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | 主键 | 自增ID |
| userId | Int | 唯一 | 关联用户 |
| balance | Int | 非空 | 当前余额 |
| totalRecharged | Int | 非空 | 累计充值 |
| createdAt | DateTime | 非空 | 创建时间 |
| updatedAt | DateTime | 非空 | 更新时间 |

### Account
**描述:** 账户额度（使用大整数，单位为最小计费单位）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | 主键 | 自增ID |
| userId | Int | 唯一 | 关联用户 |
| balance | BigInt | 非空 | 当前额度 |
| createdAt | DateTime | 非空 | 创建时间 |
| updatedAt | DateTime | 非空 | 更新时间 |

### SearchHistory
**描述:** 检索历史

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | 主键 | 自增ID |
| userId | Int | 非空 | 关联用户 |
| createdAt | DateTime | 非空 | 创建时间 |
| thumbnail | String | 非空 | 缩略图 |
| config | Json | 非空 | 检索配置 |
| cost | Int | 非空 | 消耗积分 |

### SearchResult
**描述:** 检索结果条目

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | 主键 | 自增ID |
| historyId | Int | 非空 | 关联历史 |
| type | enum | 非空 | DESIGN_PATENT / TRADEMARK |
| title | String | 非空 | 标题 |
| number | String | 非空 | 编号 |
| owner | String | 非空 | 权利人 |
| filingDate | DateTime | 可选 | 申请日期 |
| issueDate | DateTime | 可选 | 授权日期 |
| description | String | 非空 | 描述 |
| imageUrl | String | 非空 | 图片URL |
| status | String | 可选 | 状态 |
| similarityScore | Float | 可选 | 相似度 0-1 |

### RechargePackage
**描述:** 充值套餐

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | String | 主键 | 套餐ID |
| amount | Int | 非空 | 价格 |
| credits | Int | 非空 | 积分 |
| isPopular | Boolean | 非空 | 热门标记 |
| createdAt | DateTime | 非空 | 创建时间 |

### RechargeRecord
**描述:** 充值记录

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | 主键 | 自增ID |
| userId | Int | 非空 | 关联用户 |
| packageId | String | 非空 | 套餐ID |
| amount | Int | 非空 | 价格 |
| credits | Int | 非空 | 积分 |
| createdAt | DateTime | 非空 | 创建时间 |

### AuthMethodConfig
**描述:** 登录方式配置

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | 主键 | 自增ID |
| method | enum | 唯一 | PASSWORD / SMS |
| enabled | Boolean | 非空 | 是否启用 |
| createdAt | DateTime | 非空 | 创建时间 |
| updatedAt | DateTime | 非空 | 更新时间 |

### VerificationCode
**描述:** 短信验证码

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | Int | 主键 | 自增ID |
| recipient | String | 非空 | 接收手机号 |
| channel | enum | 非空 | SMS |
| purpose | enum | 非空 | LOGIN / REGISTER |
| codeHash | String | 非空 | 哈希后的验证码 |
| expiresAt | DateTime | 非空 | 过期时间 |
| used | Boolean | 非空 | 是否已使用 |
| attempts | Int | 非空 | 尝试次数 |
| maxAttempts | Int | 非空 | 最大次数 |
| userId | Int | 可选 | 关联用户 |
| createdAt | DateTime | 非空 | 创建时间 |

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
