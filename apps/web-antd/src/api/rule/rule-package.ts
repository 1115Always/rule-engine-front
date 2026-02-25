import { requestClient } from "#/api/request";

interface RulePackage {
  createTime?: string;
  id: number;
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
    id: number;
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
 */
export async function getRulePackagesApi(): Promise<RulePackage[]> {
  const response = await requestClient.get<RulePackageResponse>(
    "/rulePackage/page?page=1&pageSize=20"
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
