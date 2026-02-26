import { requestClient } from "#/api/request";

interface RulePackage {
  createTime?: string;
  id: string; // 大整数ID，使用字符串类型避免精度丢失
  name: string;
  ruleCount?: number;
  scenes: string[];
  status?: "active" | "inactive";
  updateTime?: string;
}

interface RulePackageResponse {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
  records: Array<{
    createdAt: string;
    description: string;
    id: string; // 大整数ID，使用字符串类型避免精度丢失
    packageCode: string;
    packageName: string;
    scenes: string[];
    status: string;
    updatedAt: string;
    version: number;
    ruleCount?: number;
  }>;
}

/**
 * 分页查询规则包列表
 * @param params 查询参数
 * @param params.page 页码，默认1
 * @param params.pageSize每页条数，默认20
 * @param params.packageName规则包名（模糊匹配）
 * @param params.scene场景名称
 */
export async function getRulePackagesApi(params?: {
  page?: number;
  pageSize?: number;
  packageName?: string;
  scene?: string;
}): Promise<RulePackage[]> {
  const { page = 1, pageSize = 20, packageName, scene } = params || {};

  //构建查询参数
  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("pageSize", pageSize.toString());

  if (packageName) {
    queryParams.append("packageName", packageName);
  }

  if (scene) {
    queryParams.append("scene", scene);
  }

  const response = await requestClient.get<RulePackageResponse>(
    `/rulePackage/page?${queryParams.toString()}`
  );

  return response.records.map((record) => ({
    id: record.id,
    name: record.packageName,
    scenes: record.scenes,
    ruleCount: record.ruleCount,
    status: record.status.toLowerCase() as "active" | "inactive",
    createTime: record.createdAt,
    updateTime: record.updatedAt
  }));
}

interface CreateRulePackageRequest {
  packageCode: string;
  packageName: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE";
  version?: number;
  scenes?: string[];
}

interface RulePackageCreateResponse {
  id: string; // 大整数ID，使用字符串类型避免精度丢失
  packageCode: string;
  packageName: string;
  description: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建规则包
 * @param data 创建规则包的数据
 */
export async function createRulePackageApi(data: CreateRulePackageRequest): Promise<RulePackageCreateResponse> {
  return await requestClient.post<RulePackageCreateResponse>(
    "/rulePackage/create",
    data
  );
}
