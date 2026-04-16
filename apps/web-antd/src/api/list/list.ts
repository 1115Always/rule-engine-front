/**
 * 名单数据 API
 */
import { requestClient } from '../request';
import { useAppConfig } from '@vben/hooks';
import type { PageResult, ListGroupDTO } from './list-group';
import { ListTypeOptions, ListLevelOptions } from './list-template';
export type { ListTypeOptions, ListLevelOptions };
export { ListTypeOptions, ListLevelOptions };

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

export interface ListDTO {
  id?: number;
  groupId: number;
  groupName?: string;
  listType: string;
  listValue: string;
  listLevel: string;
  reason?: string;
  expireDays?: number;
  status?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface CreateListDTO {
  groupId: number;
  listType: string;
  listValue: string;
  listLevel: string;
  reason?: string;
  expireDays?: number;
}

export interface UpdateListDTO {
  id: number;
  reason?: string;
  expireDays?: number;
  status?: string;
}

export interface ListPageQuery {
  page?: number;
  pageSize?: number;
  groupId?: number;
  listType?: string;
  listLevel?: string;
  status?: string;
  listValue?: string;
}

export interface BatchImportResult {
  total: number;
  success: number;
  covered: string[];
}

/**
 * 分页查询名单
 */
export async function pageList(
  params: ListPageQuery
) {
  return requestClient.get<PageResult<ListDTO>>('/api/list/page', { params });
}

/**
 * 根据ID查询名单
 */
export async function getListById(id: number) {
  return requestClient.get<ListDTO>(`/api/list/${id}`);
}

/**
 * 创建名单
 */
export async function createList(data: CreateListDTO) {
  return requestClient.post<ListDTO>('/api/list/create', data);
}

/**
 * 更新名单
 */
export async function updateList(data: UpdateListDTO) {
  return requestClient.put<ListDTO>('/api/list/update', data);
}

/**
 * 删除名单
 */
export async function deleteList(id: number) {
  return requestClient.delete<void>(`/api/list/${id}`);
}

/**
 * 批量导入
 */
export async function batchImport(
  groupId: number,
  listType: string,
  listLevel: string,
  data: Array<{ listValue: string; expireDays?: number; reason?: string }>
) {
  return requestClient.post<BatchImportResult>('/api/list/import', data, {
    params: { groupId, listType, listLevel },
  });
}

/**
 * 全量同步到 Redis
 */
export async function syncToRedis() {
  return requestClient.post<void>('/api/list/sync-redis');
}

/**
 * 下载导入模板
 */
export function downloadTemplate() {
  return `${apiURL}/api/list/template/download`;
}

/**
 * 导出名单
 */
export function exportListUrl(
  params?: {
    groupId?: number;
    listType?: string;
    listLevel?: string;
    status?: string;
    listValue?: string;
  }
) {
  const searchParams = new URLSearchParams();
  if (params?.groupId) searchParams.append('groupId', String(params.groupId));
  if (params?.listType) searchParams.append('listType', params.listType);
  if (params?.listLevel) searchParams.append('listLevel', params.listLevel);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.listValue) searchParams.append('listValue', params.listValue);
  return `${apiURL}/api/list/export?${searchParams.toString()}`;
}

/**
 * 清理过期名单
 */
export async function cleanupExpired() {
  return requestClient.post<void>('/api/list/cleanup-expired');
}
