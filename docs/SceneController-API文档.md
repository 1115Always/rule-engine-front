# 场景管理接口文档

## 基础信息

- **Base URL:** `http://localhost:8080/api/scene`
- **Content-Type:** `application/json`
- **字符编码:** UTF-8

## 通用响应格式

所有接口直接返回数据数组，不包装在Result对象中。

---

## 1. 查询场景列表

### 接口信息

- **请求方式:** `GET`
- **请求路径:** `/api/scene/list`
- **描述:** 查询所有激活状态的场景列表，按场景编码排序

### 请求参数

无请求参数。

### 请求示例

```http
GET /api/scene/list
```

### 响应示例

```json
[
  {
    "sceneCode": "IN_TRANSFER",
    "sceneName": "转账场景"
  },
  {
    "sceneCode": "USER_REGISTER",
    "sceneName": "用户注册场景"
  },
  {
    "sceneCode": "PAYMENT",
    "sceneName": "支付场景"
  },
  {
    "sceneCode": "WITHDRAW",
    "sceneName": "提现场景"
  }
]
```

### 空结果示例

```json
[]
```

---

## 响应字段说明

### SceneSimpleDTO（场景简化信息）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| sceneCode | String | 场景编码（唯一标识） |
| sceneName | String | 场景名称 |

---

## 注意事项

1. **状态过滤**: 接口只返回ACTIVE状态的场景
2. **排序规则**: 返回结果按场景编码（sceneCode）升序排列
3. **场景编码唯一性**: 每个场景编码在系统中是唯一的
4. **缓存使用**: 场景信息会进行缓存，用于规则引擎的场景识别
5. **规则关联**: 场景通过规则包与规则关联，一个场景可以包含多个规则包的规则
6. **简化的响应**: 响应只包含场景编码和场景名称，不包含其他详细信息

---

## 业务流程说明

### 场景查询流程

1. **查询数据库**: 从场景表中查询所有ACTIVE状态的场景
2. **筛选字段**: 只查询sceneCode和sceneName两个字段
3. **排序**: 按sceneCode升序排列
4. **转换**: 将实体转换为SceneSimpleDTO
5. **返回**: 直接返回数组，不包装在Result中

---

## 常见场景编码说明

| 场景编码 | 场景名称 | 说明 |
|----------|----------|------|
| IN_TRANSFER | 转账场景 | 账户转账相关业务 |
| USER_REGISTER | 用户注册场景 | 新用户注册相关业务 |
| PAYMENT | 支付场景 | 支付相关业务 |
| WITHDRAW | 提现场景 | 提现相关业务 |
| LOAN_APPLY | 贷款申请场景 | 贷款申请相关业务 |
| RISK_CONTROL | 风控场景 | 风险控制相关业务 |
| CUSTOMER_SERVICE | 客服场景 | 客服相关业务 |

---

## 使用场景

### 场景1: 获取所有可用场景
用于前端下拉选择框，让用户选择业务场景。

```http
GET /api/scene/list
```

### 场景2: 场景编码验证
用于验证用户输入的场景编码是否有效。

```http
GET /api/scene/list
```
然后在客户端比对返回的场景编码列表。

### 场景3: 场景筛选
在规则筛查时，需要先获取场景列表，让用户选择场景。

```http
GET /api/scene/list
```

---

## 与其他接口的关系

### 与规则筛查接口的关系

场景列表接口通常与规则筛查接口配合使用：

1. **第一步**: 调用 `/api/scene/list` 获取所有可用场景
2. **第二步**: 用户选择场景
3. **第三步**: 调用 `/api/rule/match` 时将选择的scene编码传入

### 与规则包查询接口的关系

规则包查询接口返回的数据中包含`sceneNames`字段，表示该规则包关联的场景名称。这些场景名称应该与场景列表接口返回的`sceneName`一致。

---

## 错误处理

### 服务异常

如果服务出现异常，会返回HTTP错误响应：

```json
{
  "timestamp": "2026-02-10T10:00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "查询场景列表失败",
  "path": "/api/scene/list"
}
```

---

## 性能优化

1. **查询优化**: 只查询必要的字段（sceneCode, sceneName），不查询所有字段
2. **索引使用**: 利用status和sceneCode字段的索引提高查询速度
3. **缓存策略**: 场景列表可以缓存，缓存时间建议设置为5-10分钟
4. **数据量**: 场景数量通常较少（一般不超过100个），全量查询性能影响不大

---

## Postman / HTTP Client 测试

可以使用IntelliJ IDEA的HTTP Client插件或Postman进行测试。

### 测试示例

```http
### 查询所有场景
GET http://localhost:8080/api/scene/list
```

---

## 前端集成示例

### JavaScript/TypeScript 示例

```javascript
// 获取场景列表
async function getSceneList() {
  try {
    const response = await fetch('http://localhost:8080/api/scene/list');
    const scenes = await response.json();
    return scenes;
  } catch (error) {
    console.error('获取场景列表失败:', error);
    return [];
  }
}

// 使用场景列表
async function loadSceneDropdown() {
  const scenes = await getSceneList();
  const select = document.getElementById('sceneSelect');
  
  scenes.forEach(scene => {
    const option = document.createElement('option');
    option.value = scene.sceneCode;
    option.textContent = scene.sceneName;
    select.appendChild(option);
  });
}

// 调用规则筛查
async function matchRules(scene, factData) {
  const response = await fetch('http://localhost:8080/api/rule/match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transactionId: 'TXN_' + Date.now(),
      scene: scene,
      fact: factData
    })
  });
  return await response.json();
}
```

### React 示例

```jsx
import React, { useState, useEffect } from 'react';

function RuleMatchForm() {
  const [scenes, setScenes] = useState([]);
  const [selectedScene, setSelectedScene] = useState('');
  
  useEffect(() => {
    fetch('http://localhost:8080/api/scene/list')
      .then(response => response.json())
      .then(data => setScenes(data))
      .catch(error => console.error('Error:', error));
  }, []);
  
  const handleSceneChange = (event) => {
    setSelectedScene(event.target.value);
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    // 调用规则筛查接口
    // ...
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <select value={selectedScene} onChange={handleSceneChange}>
        <option value="">请选择场景</option>
        {scenes.map(scene => (
          <option key={scene.sceneCode} value={scene.sceneCode}>
            {scene.sceneName}
          </option>
        ))}
      </select>
      <button type="submit">提交</button>
    </form>
  );
}

export default RuleMatchForm;
```

---

## 数据模型关系

```
Scene (场景)
    ↓ (多对多)
RulePackage (规则包)
    ↓ (一对多)
Rule (规则)
```

- 一个场景可以包含多个规则包
- 一个规则包可以属于多个场景
- 规则通过规则包与场景关联

### 关联表说明

**rule_package_scene表**：规则包与场景的关联表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | Long | 主键ID |
| rule_package_id | Long | 规则包ID |
| scene_id | Long | 场景ID |
| created_at | Timestamp | 创建时间 |

- 同一个规则包可以关联多个场景
- 同一个场景可以包含多个规则包