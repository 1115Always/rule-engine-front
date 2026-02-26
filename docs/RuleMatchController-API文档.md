# 规则筛查接口文档

## 基础信息

- **Base URL:** `http://localhost:8080/api/rule`
- **Content-Type:** `application/json`
- **字符编码:** UTF-8

## 通用响应格式

所有接口返回格式根据具体接口而定，见各接口说明。

---

## 1. 规则筛查接口

### 接口信息

- **请求方式:** `POST`
- **请求路径:** `/api/rule/match`
- **描述:** 根据场景和业务数据进行规则匹配，返回匹配的规则列表

### 请求体

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| transactionId | String | 是 | 流水号（唯一标识本次请求） |
| timestamp | Long | 否 | 时间戳（毫秒，默认当前时间） |
| scene | String | 是 | 场景编码 |
| fact | Map | 是 | 业务数据对象（K-V形式） |

### 请求示例

```http
POST /api/rule/match
Content-Type: application/json

{
  "transactionId": "TXN20250204001",
  "timestamp": 1707000000000,
  "scene": "IN_TRANSFER",
  "fact": {
    "city": "BJ",
    "age": 25,
    "level": "VIP",
    "openDate": "2025-12-01 00:32:22"
  }
}
```

### 成功响应示例

```json
{
  "transactionId": "TXN20250204001",
  "timestamp": 1707000000000,
  "code": 0,
  "message": "success",
  "matchedRules": [
    {
      "ruleId": 1,
      "ruleName": "北京成年VIP用户",
      "actionType": "PRINT",
      "actionParam": "{\"message\":\"匹配规则1\"}"
    },
    {
      "ruleId": 2,
      "ruleName": "年轻用户优惠",
      "actionType": "DISCOUNT",
      "actionParam": "{\"rate\":0.8}"
    }
  ]
}
```

### 无匹配结果响应示例

```json
{
  "transactionId": "TXN20250204001",
  "timestamp": 1707000000000,
  "code": 0,
  "message": "success",
  "matchedRules": []
}
```

### 错误响应示例 - 请求体为空

```json
{
  "transactionId": null,
  "timestamp": 1707000000000,
  "code": 1,
  "message": "请求体不能为空",
  "matchedRules": null
}
```

### 错误响应示例 - 流水号为空

```json
{
  "transactionId": "",
  "timestamp": 1707000000000,
  "code": 1,
  "message": "流水号不能为空",
  "matchedRules": null
}
```

### 错误响应示例 - 场景编码为空

```json
{
  "transactionId": "TXN20250204001",
  "timestamp": 1707000000000,
  "code": 1,
  "message": "场景编码不能为空",
  "matchedRules": null
}
```

### 错误响应示例 - Fact对象为空

```json
{
  "transactionId": "TXN20250204001",
  "timestamp": 1707000000000,
  "code": 1,
  "message": "Fact对象不能为空",
  "matchedRules": null
}
```

### 错误响应示例 - 规则筛查失败

```json
{
  "transactionId": "TXN20250204001",
  "timestamp": 1707000000000,
  "code": 1,
  "message": "规则筛查失败: [具体错误信息]",
  "matchedRules": null
}
```

---

## 2. 健康检查接口

### 接口信息

- **请求方式:** `GET`
- **请求路径:** `/api/rule/health`
- **描述:** 检查服务健康状态和规则缓存状态

### 请求示例

```http
GET /api/rule/health
```

### 成功响应示例 - 缓存已加载

```json
{
  "status": "UP",
  "timestamp": 1707000000000,
  "cacheStatus": "LOADED"
}
```

### 成功响应示例 - 缓存未加载

```json
{
  "status": "UP",
  "timestamp": 1707000000000,
  "cacheStatus": "EMPTY"
}
```

---

## 响应字段说明

### RuleMatchResponse（规则筛查响应）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| transactionId | String | 流水号（与请求一致） |
| timestamp | Long | 时间戳（毫秒） |
| code | Integer | 响应码（0表示成功，1表示失败） |
| message | String | 响应消息 |
| matchedRules | Array | 匹配的规则列表 |

### RuleMatchResult（匹配规则结果）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| ruleId | Long | 规则ID |
| ruleName | String | 规则名称 |
| actionType | String | 动作类型 |
| actionParam | String | 动作参数（JSON字符串） |

### HealthResponse（健康检查响应）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| status | String | 服务状态（UP表示正常） |
| timestamp | Long | 时间戳（毫秒） |
| cacheStatus | String | 缓存状态（LOADED表示已加载，EMPTY表示未加载） |

---

## 枚举值说明

### 动作类型 (actionType)

| 值 | 说明 |
|----|------|
| PRINT | 打印动作 |
| DISCOUNT | 折扣动作 |
| NOTIFICATION | 通知动作 |
| RISK_CHECK | 风险检查 |
| 其他 | 自定义动作类型 |

### 响应码 (code)

| 值 | 说明 |
|----|------|
| 0 | 成功 |
| 1 | 失败 |

### 缓存状态 (cacheStatus)

| 值 | 说明 |
|----|------|
| LOADED | 已加载 |
| EMPTY | 未加载 |

---

## 业务流程说明

### 规则筛查流程

1. **参数校验**: 校验请求参数的完整性
2. **构建Fact对象**: 将传入的fact数据构建为规则引擎可处理的格式
3. **获取规则引擎**: 根据场景编码从缓存中获取对应的规则引擎
4. **执行规则筛查**: 使用规则引擎对Fact进行规则匹配
5. **转换结果**: 将匹配结果转换为响应格式
6. **记录日志**: 记录匹配结果和耗时信息

### 规则匹配逻辑

- 规则引擎会根据fact中的数据与规则的conditions进行匹配
- 只有当所有条件都满足时，规则才会被匹配
- 匹配结果按规则优先级和排序规则返回
- 支持规则展开（一个规则可以展开为多个子规则）

---

## 注意事项

1. **流水号唯一性**: 每次请求的transactionId应该是唯一的，用于追踪和日志记录
2. **时间戳**: timestamp可选，不传则使用当前时间戳
3. **Fact对象**: fact中的字段名需要与规则条件中的fieldName匹配
4. **场景编码**: scene必须是已配置的有效场景，否则返回错误
5. **规则缓存**: 规则引擎会缓存已加载的规则，提高匹配性能
6. **并发处理**: 接口支持并发请求，使用线程安全的缓存机制
7. **日志记录**: 所有匹配操作都会记录详细的日志，包括匹配规则数和耗时
8. **错误处理**: 接口会捕获所有异常并返回友好的错误信息

---

## 性能指标

- **平均响应时间**: < 100ms
- **并发支持**: 支持高并发请求
- **缓存命中率**: > 99%（规则缓存）
- **日志记录**: 记录每次匹配的详细信息

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1 | 业务错误（具体错误信息见message字段） |

---

## 使用场景

### 场景1: 完整的规则筛查请求
```http
POST /api/rule/match
Content-Type: application/json

{
  "transactionId": "TXN20250204001",
  "timestamp": 1707000000000,
  "scene": "IN_TRANSFER",
  "fact": {
    "city": "BJ",
    "age": 25,
    "level": "VIP",
    "amount": 1000.00
  }
}
```

### 场景2: 简化请求（不传时间戳）
```http
POST /api/rule/match
Content-Type: application/json

{
  "transactionId": "TXN20250204002",
  "scene": "USER_REGISTER",
  "fact": {
    "city": "SH",
    "age": 30,
    "level": "NORMAL"
  }
}
```

### 场景3: 健康检查
```http
GET /api/rule/health
```

---

## Postman / HTTP Client 测试

可以使用IntelliJ IDEA的HTTP Client插件或Postman进行测试。

### 测试示例

```http
### 规则筛查测试
POST http://localhost:8080/api/rule/match
Content-Type: application/json

{
  "transactionId": "TXN20250204001",
  "timestamp": 1707000000000,
  "scene": "IN_TRANSFER",
  "fact": {
    "city": "BJ",
    "age": 25,
    "level": "VIP",
    "openDate": "2025-12-01 00:32:22"
  }
}

### 健康检查
GET http://localhost:8080/api/rule/health
```

---

## 日志示例

### 成功匹配日志
```
[RuleMatch] 流水号: TXN20250204001, 场景: IN_TRANSFER, 匹配规则数: 2, 耗时: 15ms
[RuleMatch] 命中规则: [1, 2]
```

### 规则展开日志
```
[RuleMatch] 规则展开: 1 -> 1001
```

### 异常日志
```
[RuleMatch] 处理异常
java.lang.NullPointerException: ...
```