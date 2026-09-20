import { requestClient } from '#/api/request';

/** 实体字段定义（metric_entity.field_schema 的元素） */
export interface MetricField {
  fieldName: string;
  fieldType: string;
  cnName?: string;
}

/** 指标实体 */
export interface MetricEntity {
  id: string;
  entityCode: string;
  entityName: string;
  /** 字段定义 JSON 文本，使用前需 JSON.parse 成 MetricField[] */
  fieldSchema: string;
  status: string;
}

/** 单条过滤条件 */
export interface FilterCondition {
  field: string;
  op: string;
  value: string;
}

/** 结构化过滤条件，与后端 MetricFilterRules 对应 */
export interface FilterRules {
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

/** 指标定义 */
export interface MetricCode {
  id: string;
  metricName: string;
  entityCode?: string;
  /** 维度表达式，如 city */
  dimensionExpr?: string;
  /** 最终过滤表达式；运行期以它为准 */
  filterExpr?: string;
  /**
   * 结构化过滤条件 JSON 文本。
   * 有值时前台回填条件构建器；为空表示该指标用手写表达式。
   */
  filterRules?: string;
  /** COUNT/SUM/MAX/MIN/LAST/AVG/LIST/SET */
  aggType?: string;
  valueExpr?: string;
  /** 存储窗口，如 1d、1h、90d */
  timeWindow?: string;
  /** LIST 聚合的条数上限 */
  maxSize?: number;
  status: string;
  enabled: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/** 查询指标列表 */
export async function listMetricsApi() {
  return await requestClient.get<MetricCode[]>('/metric/admin/codes');
}

/** 查询实体列表（含字段定义，供条件构建器使用） */
export async function listEntitiesApi() {
  return await requestClient.get<MetricEntity[]>('/metric/admin/entities');
}

/** 获取指标详情 */
export async function getMetricApi(id: string | number) {
  return await requestClient.get<MetricCode>(`/metric/admin/codes/${id}`);
}

/** 创建指标 */
export async function createMetricApi(data: Partial<MetricCode>) {
  return await requestClient.post('/metric/admin/codes', data);
}

/** 更新指标 */
export async function updateMetricApi(id: string, data: Partial<MetricCode>) {
  return await requestClient.put(`/metric/admin/codes/${id}`, data);
}

/** 删除指标 */
export async function deleteMetricApi(id: string) {
  return await requestClient.delete(`/metric/admin/codes/${id}`);
}

/** 验证指标 */
export async function validateMetricApi(id: string) {
  return await requestClient.post(`/metric/admin/codes/${id}/validate`);
}

/** 上线指标 */
export async function onlineMetricApi(id: string) {
  return await requestClient.post(`/metric/admin/codes/${id}/online`);
}

/** 下线指标 */
export async function offlineMetricApi(id: string) {
  return await requestClient.post(`/metric/admin/codes/${id}/offline`);
}

/** 全量构建 */
export async function buildAllApi() {
  return await requestClient.post('/metric/admin/build');
}

/**
 * 过滤操作符标签，与后端 FilterOperator 枚举一一对应。
 * 新增操作符时两处都要改。
 */
export const OPERATOR_LABELS: Record<string, string> = {
  EQ: '等于',
  NE: '不等于',
  GT: '大于',
  GTE: '大于等于',
  LT: '小于',
  LTE: '小于等于',
  CONTAINS: '包含',
  STARTS_WITH: '以…开头',
  ENDS_WITH: '以…结尾',
};

/**
 * 字段类型可用的操作符，需与后端 FilterExpressionBuilder 的白名单保持一致，
 * 否则前台能选、后端会拒。
 */
export const OPERATORS_BY_KIND: Record<string, string[]> = {
  number: ['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE'],
  boolean: ['EQ', 'NE'],
  string: ['EQ', 'NE', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH'],
};

const NUMERIC_TYPES = new Set([
  'int',
  'integer',
  'long',
  'short',
  'byte',
  'double',
  'float',
  'bigdecimal',
  'biginteger',
]);

/** 把后端字段类型归一到操作符分组 */
export function fieldKind(fieldType?: string): 'boolean' | 'number' | 'string' {
  const type = (fieldType ?? '').trim().toLowerCase();
  if (type === 'boolean' || type === 'bool') {
    return 'boolean';
  }
  if (NUMERIC_TYPES.has(type)) {
    return 'number';
  }
  return 'string';
}

/** 解析实体字段定义，脏数据返回空数组而不是抛错 */
export function parseFieldSchema(fieldSchema?: string): MetricField[] {
  if (!fieldSchema) {
    return [];
  }
  try {
    const parsed = JSON.parse(fieldSchema);
    return Array.isArray(parsed) ? (parsed as MetricField[]) : [];
  } catch {
    return [];
  }
}
