<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { formatDateTime } from '@vben/utils';

import { Button, Card, Input, Select, Space, Table, Tag } from 'ant-design-vue';

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
    title: '命中规则',
    dataIndex: 'matchedRules',
    key: 'matchedRules',
    width: 300,
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
    width: 100,
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
            <template v-if="record.matchedRules?.length">
              <Space wrap>
                <Tag
                  v-for="hit in record.matchedRules"
                  :key="hit.ruleId"
                  color="blue"
                >
                  #{{ hit.ruleId }} {{ hit.ruleName }}
                </Tag>
              </Space>
            </template>
            <span v-else class="text-gray-400">未命中</span>
          </template>
          <template v-else-if="column.key === 'eventTime'">
            {{ record.eventTime ? formatDateTime(record.eventTime) : '-' }}
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ record.createdAt ? formatDateTime(record.createdAt) : '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="handleTrace(record)">
              回溯
            </Button>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>

<style scoped>
.w-full {
  width: 100%;
}
</style>
