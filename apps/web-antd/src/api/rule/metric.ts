import { requestClient } from '#/api/request';

/** 指标代码列表项（查询接口返回） */
export interface MetricCode {
  id: string;
  metricName: string;
  dslCode?: string;
  status: string;
  enabled: number;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/** 查询指标列表 */
export async function listMetricsApi() {
  return await requestClient.get<MetricCode[]>('/metric/admin/codes');
}

/** 获取指标详情 */
export async function getMetricApi(id: string) {
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
export async function validateMetricApi(metricName: string) {
  return await requestClient.post(`/metric/admin/codes/${metricName}/validate`);
}

/** 上线指标 */
export async function onlineMetricApi(metricName: string) {
  return await requestClient.post(`/metric/admin/codes/${metricName}/online`);
}

/** 下线指标 */
export async function offlineMetricApi(metricName: string) {
  return await requestClient.post(`/metric/admin/codes/${metricName}/offline`);
}

/** 全量构建 */
export async function buildAllApi() {
  return await requestClient.post('/metric/admin/build');
}
