# 规则包管理接口文档

## 基础信息

- **Base URL:** `http://localhost:8080/api/rulePackage`
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

## 1. 分页查询规则包

### 接口信息

- **请求方式:** `GET`
- **请求路径:** `/api/rulePackage/page`
- **描述:** 分页查询规则包列表，支持按规则包名筛选（模糊匹配）

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| packageName | String | 否 | - | 规则包名（模糊匹配） |
| page | Long | 否 | 1 | 页码 |
| pageSize | Long | 否 | 20 | 每页条数 |

### 请求示例

```http
GET /api/rulePackage/page?packageName=示例&page=1&pageSize=10
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
        "packageCode": "PACKAGE_001",
        "packageName": "示例规则包",
        "description": "这是一个示例规则包",
        "status": "ACTIVE",
        "version": 1,
        "createdAt": "2026-02-10T09:00:00",
        "updatedAt": "2026-02-10T09:00:00",
        "sceneNames": ["场景1", "场景2"]
      }
    ]
  }
}
```

---

## 2. 创建规则包

### 接口信息

- **请求方式:** `POST`
- **请求路径:** `/api/rulePackage/create`
- **描述:** 创建新规则包，并关联到指定的场景

### 请求体

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| packageCode | String | 是 | 规则包编码（唯一） |
| packageName | String | 是 | 规则包名称 |
| description | String | 否 | 规则包描述 |
| status | String | 否 | 状态（默认：ACTIVE） |
| version | Integer | 否 | 版本号（默认：1） |
| scenes | List<String> | 否 | 场景编码列表 |

### 请求示例

```http
POST /api/rulePackage/create
Content-Type: application/json

{
  "packageCode": "PACKAGE_001",
  "packageName": "用户优惠规则包",
  "description": "包含用户优惠相关的所有规则",
  "status": "ACTIVE",
  "version": 1,
  "scenes": ["IN_TRANSFER", "USER_REGISTER"]
}
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "packageCode": "PACKAGE_001",
    "packageName": "用户优惠规则包",
    "description": "包含用户优惠相关的所有规则",
    "status": "ACTIVE",
    "version": 1,
    "createdAt": "2026-02-10T09:00:00",
    "updatedAt": "2026-02-10T09:00:00"
  }
}
```

### 错误响应示例 - 规则包编码已存在

```json
{
  "code": 500,
  "message": "规则包编码已存在：PACKAGE_001",
  "data": null
}
```

---

## 3. 更新规则包

### 接口信息

- **请求方式:** `PUT`
- **请求路径:** `/api/rulePackage/update`
- **描述:** 更新规则包信息及其场景关联

### 请求体

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 规则包ID（数据库主键） |
| packageName | String | 否 | 规则包名称 |
| description | String | 否 | 规则包描述 |
| status | String | 否 | 状态 |
| scenes | List<String> | 否 | 场景编码列表（如果提供，则替换原有场景关联） |

### 请求示例

```http
PUT /api/rulePackage/update
Content-Type: application/json

{
  "id": 1,
  "packageName": "更新后的规则包名称",
  "description": "更新后的描述",
  "status": "ACTIVE",
  "scenes": ["IN_TRANSFER", "USER_REGISTER", "PAYMENT"]
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

### 错误响应示例 - 规则包不存在

```json
{
  "code": 500,
  "message": "规则包不存在，ID: 999",
  "data": null
}
```

---

## 4. 删除规则包

### 接口信息

- **请求方式:** `DELETE`
- **请求路径:** `/api/rulePackage/{id}`
- **描述:** 删除规则包及其所有关联数据（包括规则、场景关联等）

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 规则包主键ID |

### 请求示例

```http
DELETE /api/rulePackage/1
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

### 错误响应示例 - 规则包不存在

```json
{
  "code": 500,
  "message": "规则包不存在，ID: 999",
  "data": null
}
```

---

## 响应字段说明

### RulePackagePageItemDTO（规则包分页项）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | Long | 规则包ID（主键） |
| packageCode | String | 规则包编码（唯一标识） |
| packageName | String | 规则包名称 |
| description | String | 规则包描述 |
| status | String | 状态（ACTIVE, INACTIVE） |
| version | Integer | 版本号 |
| createdAt | String | 创建时间（ISO 8601格式） |
| updatedAt | String | 更新时间（ISO 8601格式） |
| sceneNames | Array<String> | 关联的场景名称列表 |

### RulePackageEntity（规则包实体）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | Long | 规则包ID（主键） |
| packageCode | String | 规则包编码（唯一标识） |
| packageName | String | 规则包名称 |
| description | String | 规则包描述 |
| status | String | 状态（ACTIVE, INACTIVE） |
| version | Integer | 版本号 |
| createdAt | String | 创建时间（ISO 8601格式） |
| updatedAt | String | 更新时间（ISO 8601格式） |

---

## 枚举值说明

### 规则包状态 (status)

| 值 | 说明 |
|----|------|
| ACTIVE | 激活状态 |
| INACTIVE | 未激活状态 |

---

## 注意事项

1. **规则包编码唯一性**: 创建规则包时，`packageCode` 必须唯一，否则会返回错误
2. **场景关联**: 创建或更新规则包时，如果提供了`scenes`字段，会建立或更新与场景的关联关系
3. **级联删除**: 删除规则包时，会自动删除关联的所有规则和场景关联
4. **版本管理**: 更新规则包时，版本号会自动递增
5. **缓存更新**: 创建、更新、删除规则包后，会自动更新相关场景的规则缓存
6. **规则归属**: 规则必须归属于某个规则包，通过`rulePackageId`字段关联
7. **场景限制**: 一个规则包可以关联多个场景，一个场景也可以包含多个规则包的规则
8. **时间格式**: 日期时间字段使用ISO 8601格式（如：2026-02-10T09:00:00）

---

## 业务流程说明

### 创建规则包流程

1. **参数校验**: 校验规则包编码的唯一性
2. **创建规则包**: 在数据库中创建规则包记录
3. **关联场景**: 如果提供了场景列表，建立规则包与场景的关联关系
4. **更新缓存**: 刷新相关场景的规则缓存

### 更新规则包流程

1. **查询规则包**: 根据ID查询规则包
2. **更新信息**: 更新规则包的基本信息
3. **更新场景关联**: 如果提供了场景列表，替换原有的场景关联
4. **版本递增**: 自动递增版本号
5. **更新缓存**: 刷新相关场景的规则缓存

### 删除规则包流程

1. **查询规则包**: 根据ID查询规则包
2. **级联删除**: 删除规则包及其所有规则、条件、场景关联等
3. **清理缓存**: 清理相关场景的规则缓存

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 500 | 业务错误（具体错误信息见message字段） |

---

## 使用场景

### 场景1: 查询所有规则包
```http
GET /api/rulePackage/page
```

### 场景2: 根据规则包名查询
```http
GET /api/rulePackage/page?packageName=优惠
```

### 场景3: 创建规则包并关联场景
```http
POST /api/rulePackage/create
Content-Type: application/json

{
  "packageCode": "PACKAGE_002",
  "packageName": "风险控制规则包",
  "description": "包含风控相关的所有规则",
  "status": "ACTIVE",
  "scenes": ["IN_TRANSFER", "PAYMENT"]
}
```

### 场景4: 更新规则包场景
```http
PUT /api/rulePackage/update
Content-Type: application/json

{
  "id": 1,
  "scenes": ["IN_TRANSFER", "USER_REGISTER", "PAYMENT", "WITHDRAW"]
}
```

### 场景5: 删除规则包
```http
DELETE /api/rulePackage/1
```

---

## Postman / HTTP Client 测试

可以使用IntelliJ IDEA的HTTP Client插件或Postman进行测试。

### 测试示例

```http
### 分页查询规则包
GET http://localhost:8080/api/rulePackage/page?page=1&pageSize=10

### 创建规则包
POST http://localhost:8080/api/rulePackage/create
Content-Type: application/json

{
  "packageCode": "PACKAGE_001",
  "packageName": "用户优惠规则包",
  "description": "包含用户优惠相关的所有规则",
  "status": "ACTIVE",
  "version": 1,
  "scenes": ["IN_TRANSFER", "USER_REGISTER"]
}

### 更新规则包
PUT http://localhost:8080/api/rulePackage/update
Content-Type: application/json

{
  "id": 1,
  "packageName": "更新后的规则包名称",
  "description": "更新后的描述",
  "status": "ACTIVE",
  "scenes": ["IN_TRANSFER", "USER_REGISTER", "PAYMENT"]
}

### 删除规则包
DELETE http://localhost:8080/api/rulePackage/1
```

---

## 数据模型关系

```
Scene (场景)
    ↓ (多对多)
RulePackage (规则包)
    ↓ (一对多)
Rule (规则)
    ↓ (一对多)
RuleCondition (规则条件)
```

- 一个场景可以包含多个规则包
- 一个规则包可以属于多个场景
- 一个规则包包含多个规则
- 一个规则包含多个条件