import { requestClient } from '#/api/request';

/**
 * 筛查记录查询参数。
 *
 * ruleStatus 即「在线 / 试运行」的区分条件：ONLINE 看在线筛查记录、TRAINING 看试运行记录；
 * 不传则两者都返回（后端同一张表，靠 rule_status 列区分）。
 */
export interface RuleRecordQuery {
  page?: number;
  pageSize?: number;
  ruleStatus?: string;
  sceneCode?: string;
  serialNo?: string;
  /** 事件时间下界（毫秒，含） */
  startTime?: number;
  /** 事件时间上界（毫秒，含） */
  endTime?: number;
}

/** 记录中命中规则（命中当时的规则名已固化在记录里） */
export interface RuleRecordHit {
  /** 大整数ID，使用字符串类型避免精度丢失 */
  ruleId: string;
  ruleName: string;
}

/** 筛查记录列表项 */
export interface RuleRecordItem {
  /** 大整数ID，使用字符串类型避免精度丢失 */
  id: string;
  serialNo: string;
  sceneCode: string;
  /** ONLINE（在线筛查）/ TRAINING（试运行） */
  ruleStatus: string;
  /** 事件时间（毫秒） */
  eventTime: number;
  createdAt: string;
  matchedRules: RuleRecordHit[];
}

export interface RuleRecordPage {
  current: number;
  size: number;
  total: number;
  pages: number;
  records: RuleRecordItem[];
}

/**
 * 分页查询筛查记录（管理后台）
 *
 * 记录由落库应用消费 Kafka 异步写入，因此刚筛查完的记录会有秒级滞后。
 */
export async function getRuleRecordsApi(
  params?: RuleRecordQuery,
): Promise<RuleRecordPage> {
  const {
    page = 1,
    pageSize = 20,
    ruleStatus,
    sceneCode,
    serialNo,
    startTime,
    endTime,
  } = params || {};

  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('pageSize', pageSize.toString());

  if (ruleStatus) {
    queryParams.append('ruleStatus', ruleStatus);
  }
  if (sceneCode) {
    queryParams.append('sceneCode', sceneCode);
  }
  if (serialNo) {
    queryParams.append('serialNo', serialNo);
  }
  if (startTime !== undefined) {
    queryParams.append('startTime', startTime.toString());
  }
  if (endTime !== undefined) {
    queryParams.append('endTime', endTime.toString());
  }

  return await requestClient.get<RuleRecordPage>(
    `/rule/records?${queryParams.toString()}`,
  );
}
