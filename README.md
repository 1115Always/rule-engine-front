# 风控中心 (Rule Engine Risk Control System)

<div align="center">
  <h1>风控中心</h1>
  <p>基于 Vben Admin 开发的高效灵活的风险控制管理平台</p>
</div>

## 项目简介

风控中心是一款基于 Vue 3、Vite、TypeScript 和 Ant Design Vue 开发的风控管理平台。提供规则管理、规则查询、规则回溯、字段管理等核心功能，帮助企业快速构建和部署风控策略。

## 核心功能

- **规则维护**: 可视化的规则配置与管理，支持规则包的创建、编辑和版本控制
- **规则查询**: 快速检索和查看规则详情，支持多种查询条件
- **规则回溯**: 规则执行历史追溯，便于问题排查和审计
- **字段管理**: 统一管理风控字段，支持字段的增删改查
- **接口测试**: 提供在线接口测试工具，方便规则调试

## 技术栈

- **前端框架**: Vue 3
- **构建工具**: Vite
- **类型语言**: TypeScript
- **UI 组件库**: Ant Design Vue
- **状态管理**: Pinia
- **路由管理**: Vue Router

## 安装与使用

### 环境要求

- Node.js >= 20.12.0
- pnpm >= 10.0.0

### 安装依赖

```bash
# 安装 pnpm
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 开发运行

```bash
# 启动开发服务器
pnpm dev:antd
```

### 构建部署

```bash
# 构建生产环境
pnpm build:antd
```

## 项目结构

```
rule-engine-front/
├── apps/
│   └── web-antd/          # 主应用
├── packages/              # 共享包
│   ├── common-ui/         # 通用UI组件
│   ├── layouts/           # 布局组件
│   ├── locales/           # 国际化
│   └── ...
└── scripts/               # 构建脚本
```

## 浏览器支持

支持现代浏览器，推荐使用 Chrome 80+ 进行开发。

| Edge | Firefox | Chrome | Safari |
| :-: | :-: | :-: | :-: |
| last 2 versions | last 2 versions | last 2 versions | last 2 versions |

## 许可证

[MIT](./LICENSE)
