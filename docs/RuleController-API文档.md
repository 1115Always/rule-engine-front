# 规则管理接口文档

## 基础信息

- **Base URL:** `http://localhost:8080/api/rule`
- **Content-Type:** `application/json`
- **字符编码:** UTF-8

## 通用响应格式

所有接口统一返回以下格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- `code`: 响应状态码（200表示成功，其他表示失败）
- `message`: 响应消息
- `data`: 响应数据（根据具体接口而定）

---

## 1. 分页查询规则

### 接口信息

- **请求方式:** `GET`
- **请求路径:** `/api/rule/page`
- **描述:** 分页查询规则列表，支持按规则名、规则包名、场景名筛选（模糊匹配）

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| ruleName | String | 否 | - | 规则名（模糊匹配） |
| packageName | String | 否 | - | 规则包名（模糊匹配） |
| sceneName | String | 否 | - | 场景名（模糊匹配） |
| page | Long | 否 | 1 | 页码 |
| pageSize | Long | 否 | 20 | 每页条数 |

### 请求示例

```http
GET /api/rule/page?ruleName=示例&page=1&pageSize=10
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "current": 1,
    "size": 10,
    "total": 100,
    "pages": 10,
    "records": [
      {
        "id": 1,
        "rulePackageId": 1,
        "ruleName": "示例规则",
        "description": "这是一个示例规则",
        "actionType": "PRINT",
        "actionParam": "规则执行",
        "conditionRelation": "AND",
        "status": "ACTIVE",
        "version": 1,
        "createdAt": "2026-02-10T09:00:00",
        "updatedAt": "2026-02-10T09:00:00",
        "packageName": "示例规则包",
        "sceneNames": ["场景1", "场景2"]
      }
    ]
  }
}
```

---

## 2. 创建规则

### 接口信息

- **请求方式:** `POST`
- **请求路径:** `/api/rule/create`
- **描述:** 创建新规则及其条件

### 请求体

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| rulePackageId | Long | 是 | 规则包ID |
| ruleName | String | 是 | 规则名称 |
| description | String | 否 | 规则描述 |
| actionType | String | 是 | 动作类型 |
| actionParam | String | 是 | 动作参数（JSON格式） |
| conditionRelation | String | 否 | 条件关系表达式（如：c1 AND c2） |
| status | String | 否 | 状态（默认：ACTIVE） |
| version | Integer | 否 | 版本号（默认：1） |
| conditions | Array | 否 | 规则条件列表 |

### RuleConditionDTO（规则条件）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| conditionName | String | 否 | 条件名称 |
| conditionKey | String | 是 | 条件key（如：c1, c2） |
| conditionType | String | 是 | 条件类型（EXACT, RANGE, EVAL） |
| fieldName | String | 否 | 字段名 |
| operator | String | 否 | 操作符（=, >, <, >=, <=, !=等） |
| conditionValue | String | 否 | 条件值 |
| expression | String | 否 | 表达式（用于EVAL类型） |
| sortOrder | Integer | 否 | 排序顺序（默认：0） |

### 请求示例

```http
POST /api/rule/create
Content-Type: application/json

{
  "rulePackageId": 1,
  "ruleName": "示例规则",
  "description": "这是一个示例规则",
  "actionType": "PRINT",
  "actionParam": "规则执行",
  "conditionRelation": "c1 AND c2",
  "status": "ACTIVE",
  "version": 1,
  "conditions": [
    {
      "conditionKey": "c1",
      "conditionType": "EXACT",
      "fieldName": "age",
      "operator": ">",
      "conditionValue": "18",
      "sortOrder": 0
    },
    {
      "conditionKey": "c2",
      "conditionType": "EXACT",
      "fieldName": "name",
      "operator": "!=",
      "conditionValue": "",
      "sortOrder": 1
    }
  ]
}
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "rulePackageId": 1,
    "ruleName": "示例规则",
    "description": "这是一个示例规则",
    "actionType": "PRINT",
    "actionParam": "规则执行",
    "conditionRelation": "c1 AND c2",
    "status": "ACTIVE",
    "version": 1,
    "createdAt": "2026-02-10T09:00:00",
    "updatedAt": "2026-02-10T09:00:00"
  }
}
```

---

## 3. 根据ID查询规则详情

### 接口信息

- **请求方式:** `GET`
- **请求路径:** `/api/rule/{id}`
- **描述:** 根据规则主键查询规则详情，包含规则及规则条件详情

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 规则主键ID |

### 请求示例

```http
GET /api/rule/1
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "rulePackageId": 1,
    "ruleName": "示例规则",
    "description": "这是一个示例规则",
    "actionType": "PRINT",
    "actionParam": "规则执行",
    "conditionRelation": "c1 AND c2",
    "status": "ACTIVE",
    "version": 1,
    "createdAt": "2026-02-10T09:00:00",
    "updatedAt": "2026-02-10T09:00:00",
    "conditions": [
      {
        "id": 1,
        "ruleId": 1,
        "conditionName": "年龄大于18",
        "conditionKey": "c1",
        "conditionType": "EXACT",
        "fieldName": "age",
        "operator": ">",
        "conditionValue": "18",
        "expression": null,
        "sortOrder": 0,
        "createdAt": "2026-02-10T09:00:00"
      },
      {
        "id": 2,
        "ruleId": 1,
        "conditionName": "名称非空",
        "conditionKey": "c2",
        "conditionType": "EXACT",
        "fieldName": "name",
        "operator": "!=",
        "conditionValue": "",
        "expression": null,
        "sortOrder": 1,
        "createdAt": "2026-02-10T09:00:00"
      }
    ]
  }
}
```

### 错误响应示例

```json
{
  "code": 500,
  "message": "规则不存在，ID: 999",
  "data": null
}
```

---

## 4. 更新规则

### 接口信息

- **请求方式:** `PUT`
- **请求路径:** `/api/rule/update`
- **描述:** 更新规则信息及其条件
- **注意:** ACTIVE状态的规则不允许修改，需先将状态改为INACTIVE

### 请求体

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 规则ID（数据库主键） |
| ruleName | String | 否 | 规则名称 |
| description | String | 否 | 规则描述 |
| actionType | String | 否 | 动作类型 |
| actionParam | String | 否 | 动作参数（JSON格式） |
| conditionRelation | String | 否 | 条件关系表达式 |
| status | String | 否 | 状态 |
| version | Integer | 否 | 版本号 |
| conditions | Array | 否 | 规则条件列表（如果提供，则替换原有条件） |

### RuleConditionDTO（规则条件）

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| conditionName | String | 否 | 条件名称 |
| conditionKey | String | 是 | 条件key（如：c1, c2） |
| conditionType | String | 是 | 条件类型（EXACT, RANGE, EVAL） |
| fieldName | String | 否 | 字段名 |
| operator | String | 否 | 操作符（=, >, <, >=, <=, !=等） |
| conditionValue | String | 否 | 条件值 |
| expression | String | 否 | 表达式（用于EVAL类型） |
| sortOrder | Integer | 否 | 排序顺序（默认：0） |

### 请求示例

```http
PUT /api/rule/update
Content-Type: application/json

{
  "id": 1,
  "ruleName": "更新后的规则名称",
  "description": "更新后的描述",
  "actionType": "PRINT",
  "actionParam": "更新后的参数",
  "conditionRelation": "c1 OR c2",
  "status": "ACTIVE",
  "conditions": [
    {
      "conditionKey": "c1",
      "conditionType": "EXACT",
      "fieldName": "age",
      "operator": ">",
      "conditionValue": "20",
      "sortOrder": 0
    }
  ]
}
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 错误响应示例

```json
{
  "code": 500,
  "message": "规则状态为ACTIVE，不允许修改。请先将规则状态修改为INACTIVE后再修改规则内容，ID: 1",
  "data": null
}
```

---

## 5. 更新规则状态

### 接口信息

- **请求方式:** `PUT`
- **请求路径:** `/api/rule/updateStatus`
- **描述:** 更新规则状态，状态值必须为 ACTIVE 或 INACTIVE

### 请求体

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 规则ID（数据库主键） |
| status | String | 是 | 状态，必须为 ACTIVE 或 INACTIVE |

### 请求示例

```http
PUT /api/rule/updateStatus
Content-Type: application/json

{
  "id": 1,
  "status": "INACTIVE"
}
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 错误响应示例

```json
{
  "code": 500,
  "message": "规则状态值无效，必须为 ACTIVE 或 INACTIVE",
  "data": null
}
```

---

## 6. 删除规则

### 接口信息

- **请求方式:** `DELETE`
- **请求路径:** `/api/rule/{id}`
- **描述:** 删除规则及其所有条件（级联删除）

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 规则主键ID |

### 请求示例

```http
DELETE /api/rule/1
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 错误响应示例

```json
{
  "code": 500,
  "message": "规则不存在，ID: 999",
  "data": null
}
```

```json
{
  "code": 500,
  "message": "规则状态为ACTIVE，不允许删除。请先将规则状态修改为INACTIVE后再删除，ID: 1",
  "data": null
}
```

---

## 枚举值说明

### 条件类型 (conditionType)

| 值 | 说明 |
|----|------|
| EXACT | 精确匹配 |
| RANGE | 范围匹配 |
| EVAL | 表达式求值 |

### 规则状态 (status)

| 值 | 说明 |
|----|------|
| ACTIVE | 激活状态 |
| INACTIVE | 未激活状态 |

### 操作符 (operator)

| 值 | 说明 |
|----|------|
| = | 等于 |
| != | 不等于 |
| > | 大于 |
| < | 小于 |
| >= | 大于等于 |
| <= | 小于等于 |

---

## 注意事项

1. **规则ID唯一性**: 创建规则时，数据库自动生成唯一ID，无需指定
2. **ACTIVE状态限制**: ACTIVE状态的规则不允许修改或删除，需先将状态改为INACTIVE
3. **级联删除**: 删除规则时，会自动删除关联的所有条件
4. **条件替换**: 更新规则时，如果提供了`conditions`字段，会替换原有条件；如果不提供，则保持不变
5. **版本管理**: 更新规则时，版本号会自动递增，旧版本信息会保存到版本历史表
6. **时间格式**: 日期时间字段使用ISO 8601格式（如：2026-02-10T09:00:00）
7. **条件排序**: 条件按`sortOrder`字段升序排列
8. **缓存更新**: 创建、更新、删除规则后，会自动更新相关场景的规则缓存

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 500 | 业务错误（具体错误信息见message字段） |

---

## Postman / HTTP Client 测试文件

项目中已提供HTTP测试文件，位于：
- `src/main/java/org/always/rule/controller/get-rule-detail.http`

可以使用IntelliJ IDEA的HTTP Client插件或类似工具进行测试。