<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { getRuleRecordsApi } from '#/api/rule/record';
import { getSceneOptionsApi } from '#/api/rule/scene';

const route = useRoute();
const router = useRouter();

// 规则状态元数据（code 与后端 RuleStatus 对应）
// 这里只可能出现 ONLINE / TRAINING：记录由筛查引擎（加载 ONLINE 规则）
// 与试运行应用（加载 TRAINING 规则）分别发出
const RULE_STATUS_META: Record<string, { label: string; color: string }> = {
  ONLINE: { label: '在线', color: 'success' },
  TRAINING: { label: '试运行', color: 'processing' },
};

const getStatusMeta = (status: string) =>
  RULE_STATUS_META[status] ?? { label: status || '未知', color: 'default' };

const columns = [
  {
    title: '流水号',
    dataIndex: 'serialNo',
    key: 'serialNo',
    width: 200,
  },
  {
    title: '场景',
    dataIndex: 'sceneCode',
    key: 'sceneCode',
    width: 160,
  },
  {
    title: '类型',
    dataIndex: 'ruleStatus',
    key: 'ruleStatus',
    width: 100,
  },
  {
    title: '是否命中规则',
    dataIndex: 'matchedRules',
    key: 'matchedRules',
    width: 120,
  },
  {
    title: '事件时间',
    dataIndex: 'eventTime',
    key: 'eventTime',
    width: 170,
  },
  {
    title: '记录时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 170,
  },
  {
    title: '操作',
    key: 'action',
    width: 140,
  },
];

// 详情弹窗里的命中规则列表：规则编号/名称/所属规则包
const hitColumns = [
  { title: '规则编号', dataIndex: 'ruleId', key: 'ruleId', width: 100 },
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName' },
  {
    title: '所属规则包',
    dataIndex: 'rulePackageName',
    key: 'rulePackageName',
    width: 180,
  },
];

const dataSource = ref<any[]>([]);
const loading = ref(false);
const sceneOptions = ref<Array<{ label: string; value: string }>>([]);

// 初始条件可从路由带上（例如规则列表的「查看试运行结果」跳转过来时带 ruleStatus=TRAINING）
const searchParams = ref({
  ruleStatus: (route.query.ruleStatus as string) || undefined,
  sceneCode: (route.query.sceneCode as string) || undefined,
  serialNo: (route.query.serialNo as string) || '',
});

const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  loadData();
};

const loadData = async () => {
  loading.value = true;
  try {
    const response = await getRuleRecordsApi({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      ruleStatus: searchParams.value.ruleStatus || undefined,
      sceneCode: searchParams.value.sceneCode || undefined,
      serialNo: searchParams.value.serialNo?.trim() || undefined,
    });

    dataSource.value = response.records;
    pagination.value.total = response.total;
    pagination.value.current = response.current;
    pagination.value.pageSize = response.size;
  } catch (error) {
    console.error('获取筛查记录失败:', error);
    // 错误提示由全局拦截器统一处理，无需在此重复提示
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.value.current = 1;
  loadData();
};

const handleReset = () => {
  searchParams.value = {
    ruleStatus: undefined,
    sceneCode: undefined,
    serialNo: '',
  };
  pagination.value.current = 1;
  loadData();
};

// 详情弹窗：列表行数据已含全部展示字段，直接复用，不再单查
const detailOpen = ref(false);
const detail = ref<any>(null);

const handleDetail = (record: any) => {
  detail.value = record;
  detailOpen.value = true;
};

// 跳转到规则回溯页并带上流水号：回溯要选具体规则，故不在本页直接发起
const handleTrace = (record: any) => {
  router.push({ path: '/rule/trace', query: { serialNo: record.serialNo } });
};

const loadSceneOptions = async () => {
  try {
    sceneOptions.value = await getSceneOptionsApi();
  } catch (error) {
    console.error('获取场景选项失败:', error);
  }
};

onMounted(() => {
  loadSceneOptions();
  loadData();
});

defineExpose({
  loadData,
});
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <Card title="筛查记录" size="small">
      <!-- 搜索区域 -->
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-nowrap">类型:</span>
          <Select
            v-model:value="searchParams.ruleStatus"
            :options="[
              { label: '在线', value: 'ONLINE' },
              { label: '试运行', value: 'TRAINING' },
            ]"
            placeholder="全部"
            allow-clear
            style="width: 140px"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-nowrap">场景:</span>
          <Select
            v-model:value="searchParams.sceneCode"
            :options="sceneOptions"
            placeholder="全部"
            allow-clear
            show-search
            option-filter-prop="label"
            style="width: 200px"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-nowrap">流水号:</span>
          <Input
            v-model:value="searchParams.serialNo"
            placeholder="精确匹配"
            allow-clear
            style="width: 220px"
            @press-enter="handleSearch"
          />
        </div>
        <Space>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'ruleStatus'">
            <Tag :color="getStatusMeta(record.ruleStatus).color">
              {{ getStatusMeta(record.ruleStatus).label }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'matchedRules'">
            <Tag v-if="record.matchedRules?.length" color="success">
              命中 {{ record.matchedRules.length }}
            </Tag>
            <Tag v-else>未命中</Tag>
          </template>
          <template v-else-if="column.key === 'eventTime'">
            {{ record.eventTime ? formatDateTime(record.eventTime) : '-' }}
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ record.createdAt ? formatDateTime(record.createdAt) : '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space :size="4">
              <Button type="link" size="small" @click="handleDetail(record)">
                详情
              </Button>
              <Button type="link" size="small" @click="handleTrace(record)">
                回溯
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="detailOpen"
      :footer="null"
      title="流水详情"
      width="760px"
    >
      <template v-if="detail">
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem label="流水号">
            {{ detail.serialNo }}
          </DescriptionsItem>
          <DescriptionsItem label="场景">
            {{ detail.sceneCode }}
          </DescriptionsItem>
          <DescriptionsItem label="类型">
            <Tag :color="getStatusMeta(detail.ruleStatus).color">
              {{ getStatusMeta(detail.ruleStatus).label }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="是否命中">
            <Tag v-if="detail.matchedRules?.length" color="success">
              命中 {{ detail.matchedRules.length }}
            </Tag>
            <Tag v-else>未命中</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="事件时间">
            {{ detail.eventTime ? formatDateTime(detail.eventTime) : '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="记录时间">
            {{ detail.createdAt ? formatDateTime(detail.createdAt) : '-' }}
          </DescriptionsItem>
        </Descriptions>

        <div class="mt-4 mb-2 text-sm font-medium">命中规则</div>
        <Table
          :columns="hitColumns"
          :data-source="detail.matchedRules"
          :locale="{ emptyText: '本次筛查未命中任何规则' }"
          :pagination="false"
          row-key="ruleId"
          size="small"
        >
          <template #bodyCell="{ column, record: hit }">
            <template v-if="column.key === 'ruleId'">#{{ hit.ruleId }}</template>
            <template v-else-if="column.key === 'rulePackageName'">
              {{ hit.rulePackageName || '-' }}
            </template>
          </template>
        </Table>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.w-full {
  width: 100%;
}
</style>
