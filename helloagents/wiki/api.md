# API 手册

## 概述
当前阶段为前端 UI/UX 实现，所有接口为伪实现（Mock），仅用于联调与交互占位。

## 认证方式
- 暂无真实鉴权，模拟手机号/密码与验证码逻辑。

---

## 接口列表

### 认证 Auth

#### [POST] /api/auth/login
**描述:** 登录（伪接口）

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |
| password | string | 是 | 密码 |

**响应:**
```json
{ "code": 0, "data": { "token": "mock" } }
```

#### [POST] /api/auth/sms
**描述:** 发送短信验证码（伪接口）

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |

**响应:**
```json
{ "code": 0, "data": { "sms": "123456" } }
```

#### [POST] /api/auth/register
**描述:** 注册（伪接口）

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |
| sms | string | 是 | 短信验证码 |
| password | string | 是 | 密码 |

**响应:**
```json
{ "code": 0, "data": { "token": "mock" } }
```

---

### 检索 Search

#### [POST] /api/search
**描述:** 以图片检索专利与商标（伪接口）

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| imageBase64 | string | 是 | 图片 Base64 |
| config | object | 是 | 检索配置 |

**响应:**
```json
{ "code": 0, "data": { "patents": [], "trademarks": [] } }
```

---

### 充值 Recharge

#### [POST] /api/recharge
**描述:** 充值积分（伪接口）

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| packageId | string | 是 | 充值套餐ID |

**响应:**
```json
{ "code": 0, "data": { "balance": 0, "totalRecharged": 0 } }
```

---

### 历史 History

#### [GET] /api/history
**描述:** 获取历史记录（伪接口）

**响应:**
```json
{ "code": 0, "data": [] }
```

#### [POST] /api/history/clear
**描述:** 清空历史记录（伪接口）

**响应:**
```json
{ "code": 0, "data": true }
```
