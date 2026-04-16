/**
 * 名单分组 API
 */
import { requestClient } from '../request';

export interface ListGroupDTO {
  id?: number;
  groupName: string;
  description?: string;
  status?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface CreateListGroupDTO {
  groupName: string;
  description?: string;
}

export interface UpdateListGroupDTO {
  id: number;
  groupName: string;
  description?: string;
  status?: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 分页查询分组
 */
export async function pageListGroup(
  page?: number,
  pageSize?: number,
  groupName?: string
) {
  const params: Record<string, any> = {};
  if (page) params.page = page;
  if (pageSize) params.pageSize = pageSize;
  if (groupName) params.groupName = groupName;

  return requestClient.get<PageResult<ListGroupDTO>>('/api/list-group/page', {
    params,
  });
}

/**
 * 查询所有分组
 */
export async function listAllGroup() {
  return requestClient.get<ListGroupDTO[]>('/api/list-group/list');
}

/**
 * 根据ID查询分组
 */
export async function getGroupById(id: number) {
  return requestClient.get<ListGroupDTO>(`/api/list-group/${id}`);
}

/**
 * 创建分组
 */
export async function createGroup(data: CreateListGroupDTO) {
  return requestClient.post<ListGroupDTO>('/api/list-group/create', data);
}

/**
 * 更新分组
 */
export async function updateGroup(data: UpdateListGroupDTO) {
  return requestClient.put<ListGroupDTO>('/api/list-group/update', data);
}

/**
 * 删除分组
 */
export async function deleteGroup(id: number) {
  return requestClient.delete<void>(`/api/list-group/${id}`);
}
