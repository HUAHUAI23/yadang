# 日志与 Trace 链路指南（Pino）

更新时间：`2026-03-02`

## 1. 目标

本项目已将支付链路日志统一为 `pino`，并通过 `traceId` 贯穿：

1. API 路由层
2. 领域服务层
3. 支付网关层（Alipay SDK 调用）
4. 后端调度任务（Croner）

最终效果：同一笔请求/任务可通过同一个 `traceId` 在日志系统中串联检索。

## 2. 代码入口

1. 统一 logger 与上下文：`lib/server/logger.ts`
2. 响应头透传：`lib/server/response.ts`（自动写入 `x-trace-id`）
3. API 入口接入：`app/api/alipay/*`、`app/api/recharge/*`、`app/api/payment/config`、`app/api/transactions`
4. 支付网关日志：`lib/server/payment/alipay.ts`
5. 调度任务日志：`lib/server/payment/scheduler.ts`

## 3. 使用规范

## 3.1 API 层

在 route handler 使用 `withRequestTrace(request, handler)` 包裹，系统会：

1. 优先读取请求头 `x-trace-id`
2. 其次读取 `x-request-id`
3. 其次解析 `traceparent`
4. 若都不存在，自动生成 UUID traceId

## 3.2 服务/网关层

直接使用 `childLogger(...)` 获取子 logger；`traceId` 由 AsyncLocalStorage 自动注入，无需手工每次传参。

## 3.3 响应层

`jsonOk/jsonError` 会自动在响应头写入 `x-trace-id`。  
文本响应（如支付宝 notify）需要手工调用 `bindTraceToHeaders(...)`。

## 4. 日志字段建议

统一字段建议：

1. `traceId`
2. `domain`（如 `payment`）
3. `component`（如 `scheduler`、`alipay-gateway`）
4. `event` 或 message（如 `payment.job.start`）
5. 关键业务键（`outTradeNo`、`orderId`、`tradeNo`）

## 5. 环境变量

新增：

- `LOG_LEVEL`：`fatal|error|warn|info|debug|trace|silent`（默认 `info`）

示例：

```env
LOG_LEVEL="info"
```

## 6. 官方参考（最新实践）

1. Pino 官方文档（API、mixin、transport）  
   <https://github.com/pinojs/pino/blob/main/docs/api.md>
2. Pino 传输层文档（推荐通过 transport 进行日志处理）  
   <https://github.com/pinojs/pino/blob/main/docs/transports.md>
3. Pino 官方仓库（发布说明）  
   <https://github.com/pinojs/pino/releases>
4. Node.js AsyncLocalStorage 文档（请求上下文透传）  
   <https://nodejs.org/api/async_context.html#class-asynclocalstorage>

