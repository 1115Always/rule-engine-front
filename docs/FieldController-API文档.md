# 规则字段接口文档

## 基础信息

- **Base URL:** `http://localhost:8080/api/field`
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

## 1. 查询字段列表

### 接口信息

- **请求方式:** `GET`
- **请求路径:** `/api/field/query`
- **描述:** 根据字段编码和字段名称查询字段列表，支持模糊匹配

### 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| fieldCode | String | 否 | - | 字段编码（模糊匹配） |
| fieldName | String | 否 | - | 字段名称（模糊匹配） |

### 请求示例

```http
GET /api/field/query?fieldCode=age&fieldName=年龄
```

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "fieldCode": "age",
      "fieldName": "年龄",
      "description": "用户年龄字段",
      "fieldType": "USER",
      "dataType": "INTEGER",
      "defaultValue": "18",
      "status": "ACTIVE"
    },
    {
      "id": 2,
      "fieldCode": "name",
      "fieldName": "姓名",
      "description": "用户姓名字段",
      "fieldType": "USER",
      "dataType": "STRING",
      "defaultValue": "",
      "status": "ACTIVE"
    }
  ]
}
```

### 空结果示例

```json
{
  "code": 200,
  "message": "success",
  "data": []
}
```

---

## 字段DTO说明

### FieldDTO

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | Long | 字段ID（主键） |
| fieldCode | String | 字段编码（唯一标识） |
| fieldName | String | 字段名称 |
| description | String | 字段描述 |
| fieldType | String | 字段类型（如：USER, TRANSACTION等） |
| dataType | String | 数据类型（STRING, INTEGER, DATE等） |
| defaultValue | String | 默认值 |
| status | String | 状态（ACTIVE, INACTIVE） |

---

## 枚举值说明

### 字段类型 (fieldType)

| 值 | 说明 |
|----|------|
| USER | 用户字段 |
| TRANSACTION | 交易字段 |
| PRODUCT | 产品字段 |
| 其他 | 自定义字段类型 |

### 数据类型 (dataType)

| 值 | 说明 |
|----|------|
| STRING | 字符串 |
| INTEGER | 整数 |
| LONG | 长整数 |
| DOUBLE | 双精度浮点数 |
| DATE | 日期 |
| DATETIME | 日期时间 |
| BOOLEAN | 布尔值 |

### 状态 (status)

| 值 | 说明 |
|----|------|
| ACTIVE | 激活状态 |
| INACTIVE | 未激活状态 |

---

## 注意事项

1. **模糊匹配**: `fieldCode` 和 `fieldName` 参数都支持模糊匹配
2. **参数可选**: 所有查询参数都是可选的，不传参数则返回所有字段
3. **状态过滤**: 默认只返回ACTIVE状态的字段
4. **排序**: 返回结果按字段编码排序
5. **缓存**: 字段信息会进行缓存，提高查询性能

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 500 | 业务错误（具体错误信息见message字段） |

---

## 使用场景

### 场景1: 查询所有字段
```http
GET /api/field/query
```

### 场景2: 根据字段编码查询
```http
GET /api/field/query?fieldCode=age
```

### 场景3: 根据字段名称模糊查询
```http
GET /api/field/query?fieldName=用户
```

### 场景4: 组合查询
```http
GET /api/field/query?fieldCode=user&fieldName=年龄
```

---

## Postman / HTTP Client 测试

可以使用IntelliJ IDEA的HTTP Client插件或Postman进行测试。

### 测试示例

```http
### 查询所有字段
GET http://localhost:8080/api/field/query

### 根据字段编码查询
GET http://localhost:8080/api/field/query?fieldCode=age

### 根据字段名称查询
GET http://localhost:8080/api/field/query?fieldName=年龄