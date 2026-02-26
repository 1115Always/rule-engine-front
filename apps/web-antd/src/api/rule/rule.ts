import { requestClient } from "#/api/request";

interface RuleListResponse {
  current: number;
  size: number;
  total: number;
  pages: number;
  records: Array<{
    id: string; // 大整数ID，使用字符串类型避免精度丢失
    ruleId: string;
    rulePackageId: string; // 大整数ID，使用字符串类型避免精度丢失
    ruleName: string;
    description: string;
    actionType: string;
    actionParam: string;
    conditionRelation: string;
    status: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    packageName: string;
    packageCode: string;
    sceneNames: string[];
  }>;
}

/**
 * 分页查询规则列表
 * @param params 查询参数
 * @param params.page 页码，默认1
 * @param params.pageSize每页条数，默认20
 * @param params.ruleName规则名（模糊匹配）
 * @param params.packageName规则包名（模糊匹配）
 * @param params.sceneName场名（模糊匹配）
 */
export async function getRulesApi(params?: {
  page?: number;
  pageSize?: number;
  ruleName?: string;
  packageName?: string;
  sceneName?: string;
}): Promise<RuleListResponse> {
  const { page = 1, pageSize = 20, ruleName, packageName, sceneName } = params || {};

  //构建查询参数
  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("pageSize", pageSize.toString());

  if (ruleName) {
    queryParams.append("ruleName", ruleName);
  }

  if (packageName) {
    queryParams.append("packageName", packageName);
  }

  if (sceneName) {
    queryParams.append("sceneName", sceneName);
  }

  const response = await requestClient.get<RuleListResponse>(
    `/rule/page?${queryParams.toString()}`
  );
  
  return response;
}

/**
 *根据ID查询规则详情
 * @param id规则ID
 */
export async function getRuleDetailApi(id: number | string) {
  return await requestClient.get(`/rule/${id}`);
}

/**
 * 创建规则
 * @param data规则数据
 */
export async function createRuleApi(data: any) {
  return await requestClient.post("/rule/create", data);
}

/**
 * 更新规则
 * @param data规数据
 */
export async function updateRuleApi(data: any) {
  return await requestClient.put("/rule/update", data);
}

/**
 * 删除规则
 * @param id规则ID
 */
export async function deleteRuleApi(id: number | string) {
  return await requestClient.delete(`/rule/${id}`);
}