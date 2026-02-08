# API 手册

## 概述
当前阶段认证相关接口为真实实现，其余业务接口仍保留 Mock 用于 UI 交互占位。

## 认证方式
- JWT + HttpOnly Cookie，会话由后端签发与校验。

---

## 接口列表

### 认证 Auth

#### [GET] /api/auth/config
**描述:** 获取登录方式配置

**请求参数:**
无

**响应:**
```json
{ "code": 0, "data": { "password": true, "sms": true } }
```

#### [POST] /api/auth/login/password
**描述:** 用户名密码登录

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应:**
```json
{ "code": 0, "data": { "user": {}, "credits": {} } }
```

#### [POST] /api/auth/login/sms
**描述:** 手机短信验证码登录

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |
| sms | string | 是 | 短信验证码 |

**响应:**
```json
{ "code": 0, "data": { "user": {}, "credits": {} } }
```

#### [POST] /api/auth/register
**描述:** 用户名密码注册

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| phone | string | 是 | 手机号 |
| sms | string | 否 | 短信验证码（短信开启时必填） |
| password | string | 是 | 密码 |

**响应:**
```json
{ "code": 0, "data": { "user": {}, "credits": {} } }
```

#### [POST] /api/auth/sms
**描述:** 发送短信验证码

**请求参数:**
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |
| purpose | string | 是 | login / register |

**响应:**
```json
{ "code": 0, "data": { "sent": true } }
```

#### [POST] /api/auth/logout
**描述:** 退出登录

**响应:**
```json
{ "code": 0, "data": { "ok": true } }
```

#### [GET] /api/auth/me
**描述:** 获取当前登录用户

**响应:**
```json
{ "code": 0, "data": { "user": {}, "credits": {} } }
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
