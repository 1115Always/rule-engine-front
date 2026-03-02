import { requestClient } from "#/api/request";

/** 字段选项数据类型 */
export interface FieldOption {
  id: string; // 大整数ID，使用字符串类型避免精度丢失
  fieldCode: string;
  fieldName: string;
  description?: string;
  fieldType: string;
  dataType: string;
  defaultValue?: string;
  status: string;
}

/** 查询字段列表参数 */
export interface QueryFieldParams {
  /** 字段编码（模糊匹配） */
  fieldCode?: string;
  /** 字段名称（模糊匹配） */
  fieldName?: string;
  /** 场景编码（精确匹配），查询该场景关联的字段 */
  sceneCode?: string;
}

/** 创建字段参数 */
export interface CreateFieldParams {
  /** 字段编码 */
  fieldCode: string;
  /** 字段名称 */
  fieldName: string;
  /** 描述 */
  description?: string;
  /** 字段类型 */
  fieldType: string;
  /** 数据类型 */
  dataType: string;
  /** 默认值 */
  defaultValue?: string;
  /** 状态 */
  status?: string;
}

/**
 * 查询字段列表
 * @param params 查询参数
 * @returns 字段列表
 */
export async function queryFieldList(params?: QueryFieldParams) {
  return await requestClient.get<FieldOption[]>('/field/query', {
    params,
  });
}

/**
 * 获取字段选项列表（用于下拉框，只返回激活状态的字段）
 * @returns 字段选项列表 {label: fieldName, value: fieldCode}
 */
export async function getFieldOptions(params?: QueryFieldParams) {
  const list = await queryFieldList(params);
  return list
    .filter((item) => item.status === 'ACTIVE')
    .map((item) => ({
      label: item.fieldName,
      value: item.fieldCode,
    }));
}

/**
 * 创建字段
 * @param data 创建字段参数
 * @returns 创建后的字段
 */
export async function createFieldApi(data: CreateFieldParams) {
  return await requestClient.post<FieldOption>('/field/create', data);
}
