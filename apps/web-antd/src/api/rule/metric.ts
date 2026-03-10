import { requestClient } from '#/api/request';

/** 指标实体 */
export interface MetricEntity {
  id: string;
  entityCode: string;
  entityName: string;
  fieldSchema: string;
  status: string;
  enabled: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/** 指标代码 */
export interface MetricCode {
  id: string;
  metricName: string;
  entityCode: string;
  dslCode: string;
  redisPattern: string;
  status: string;
  compileError?: string;
  enabled: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/** 验证结果 */
export interface CompileResult {
  success: boolean;
  error?: string;
}

/** 查询实体列表 */
export async function listEntitiesApi() {
  return await requestClient.get<MetricEntity[]>('/metric/admin/entities');
}

/** 创建实体 */
export async function createEntityApi(data: Partial<MetricEntity>) {
  return await requestClient.post('/metric/admin/entities', data);
}

/** 更新实体 */
export async function updateEntityApi(id: string, data: Partial<MetricEntity>) {
  return await requestClient.put(`/metric/admin/entities/${id}`, data);
}

/** 删除实体 */
export async function deleteEntityApi(id: string) {
  return await requestClient.delete(`/metric/admin/entities/${id}`);
}

/** 查询指标列表 */
export async function listMetricsApi(entityCode?: string) {
  return await requestClient.get<MetricCode[]>('/metric/admin/codes', {
    params: entityCode ? { entityCode } : undefined,
  });
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
export async function validateMetricApi(metricName: string) {
  return await requestClient.post<CompileResult>(
    `/metric/admin/codes/${metricName}/validate`,
  );
}

/** 发布指标 */
export async function publishMetricApi(metricName: string) {
  return await requestClient.post(`/metric/admin/codes/${metricName}/publish`);
}

/** 全量构建 */
export async function buildAllApi() {
  return await requestClient.post('/metric/admin/build');
}

/** 获取实体选项（用于下拉框） */
export async function getEntityOptionsApi() {
  const list = await listEntitiesApi();
  return list.map((item) => ({
    label: `${item.entityName}（${item.entityCode}）`,
    value: item.entityCode,
  }));
}
