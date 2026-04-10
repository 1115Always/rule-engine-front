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
  fieldPrior?: number;
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
  /** 字段优先级 */
  fieldPrior?: number;
  /** 状态 */
  status?: string;
}

/** 更新字段参数 */
export interface UpdateFieldParams {
  /** 字段ID */
  id: string;
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
  /** 字段优先级 */
  fieldPrior?: number;
  /** 状态 */
  status?: string;
}

/** 字段引用检查结果 */
export interface FieldReferenceCheckResult {
  /** 是否被引用 */
  isReferenced: boolean;
  /** 引用数量 */
  referenceCount: number;
  /** 引用说明 */
  referenceMessage: string;
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

/**
 * 获取字段详情
 * @param id 字段ID
 * @returns 字段详情
 */
export async function getFieldDetail(id: string) {
  return await requestClient.get<FieldOption>(`/field/${id}`);
}

/**
 * 更新字段
 * @param data 更新字段参数
 * @returns 更新后的字段
 */
export async function updateFieldApi(data: UpdateFieldParams) {
  return await requestClient.put<FieldOption>(`/field/${data.id}`, {
    fieldName: data.fieldName,
    description: data.description,
    fieldType: data.fieldType,
    dataType: data.dataType,
    defaultValue: data.defaultValue,
    fieldPrior: data.fieldPrior,
    status: data.status,
  });
}

/**
 * 删除字段
 * @param id 字段ID
 */
export async function deleteFieldApi(id: string) {
  return await requestClient.delete(`/field/${id}`);
}

/**
 * 检查字段是否被规则条件引用
 * @param fieldCode 字段编码
 * @returns 引用检查结果
 */
export async function checkFieldReferenceApi(fieldCode: string) {
  return await requestClient.get<FieldReferenceCheckResult>('/field/check-reference', {
    params: { fieldCode },
  });
}
