/**
 * 名单模板 API
 */
import { requestClient } from '../request';
import type { PageResult } from './list-group';

export interface ListTemplateDTO {
  id?: number;
  templateName: string;
  groupId: number;
  groupName?: string;
  listType: string;
  listLevel: string;
  fieldId: number;
  fieldCode?: string;
  description?: string;
  redisKeyPreview?: string;
  status?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface CreateListTemplateDTO {
  templateName: string;
  groupId: number;
  listType: string;
  listLevel: string;
  fieldId: number;
  description?: string;
}

export interface UpdateListTemplateDTO {
  id: number;
  templateName: string;
  description?: string;
  status?: string;
}

// 名单类型枚举
export const ListTypeOptions = [
  { label: '账户', value: 'ACCOUNT' },
  { label: '客户', value: 'CUSTOMER' },
  { label: '设备', value: 'DEVICE' },
  { label: 'IP', value: 'IP' },
];

// 名单级别枚举
export const ListLevelOptions = [
  { label: '黑名单', value: 'BLACK' },
  { label: '白名单', value: 'WHITE' },
  { label: '灰名单', value: 'GRAY' },
];

/**
 * 分页查询模板
 */
export async function pageListTemplate(
  page?: number,
  pageSize?: number,
  templateName?: string
) {
  const params: Record<string, any> = {};
  if (page) params.page = page;
  if (pageSize) params.pageSize = pageSize;
  if (templateName) params.templateName = templateName;

  return requestClient.get<PageResult<ListTemplateDTO>>('/api/list-template/page', {
    params,
  });
}

/**
 * 根据ID查询模板
 */
export async function getTemplateById(id: number) {
  return requestClient.get<ListTemplateDTO>(`/api/list-template/${id}`);
}

/**
 * 创建模板
 */
export async function createTemplate(data: CreateListTemplateDTO) {
  return requestClient.post<ListTemplateDTO>('/api/list-template/create', data);
}

/**
 * 更新模板
 */
export async function updateTemplate(data: UpdateListTemplateDTO) {
  return requestClient.put<ListTemplateDTO>('/api/list-template/update', data);
}

/**
 * 删除模板
 */
export async function deleteTemplate(id: number) {
  return requestClient.delete<void>(`/api/list-template/${id}`);
}

/**
 * 预览表达式
 */
export async function previewExpression(id: number) {
  return requestClient.get<string>('/api/list-template/preview', {
    params: { id },
  });
}
