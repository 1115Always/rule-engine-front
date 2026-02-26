import { requestClient } from "#/api/request";

/** 动作选项数据类型 */
export interface ActionOption {
  value: string;
  label: string;
}

/**
 * 获取所有动作选项列表
 * @returns 动作选项列表
 */
export async function getActionOptions() {
  return await requestClient.get<ActionOption[]>('/action/actionOptions');
}
