import { requestClient } from '#/api/request';

interface RulePackage {
  createTime?: string;
  id: number;
  name: string;
  ruleCount?: number;
  scenes: string[];
  status?: 'active' | 'inactive';
  updateTime?: string;
}

interface RulePackageResponse {
  code: number;
  message: string;
  data: {
    current: number;
    pages: number;
    records: Array<{
      createdAt: string;
      description: string;
      id: number;
      packageCode: string;
      packageName: string;
      sceneNames: string[];
      status: string;
      updatedAt: string;
      version: number;
    }>;
    size: number;
    total: number;
  };
}

/**
 * 分页查询规则包列表
 */
export async function getRulePackagesApi(): Promise<RulePackage[]> {
  const response = await requestClient.get<RulePackageResponse>(
    '/rulePackage/page?page=1&pageSize=20',
  );

  if (response.code === 200) {
    return response.data.records.map((record) => ({
      id: record.id,
      name: record.packageName,
      scenes: record.sceneNames,
      ruleCount: 0, // API doesn't provide rule count
      status: record.status.toLowerCase() as 'active' | 'inactive',
      createTime: record.createdAt,
      updateTime: record.updatedAt,
    }));
  }

  throw new Error(response.message || 'Failed to fetch rule packages');
}
