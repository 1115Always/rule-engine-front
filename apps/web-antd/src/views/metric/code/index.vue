<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  buildAllApi,
  deleteMetricApi,
  getMetricApi,
  listMetricsApi,
  type MetricCode,
  onlineMetricApi,
  offlineMetricApi,
  validateMetricApi,
} from '#/api/rule/metric';

import MetricModal from './metric-modal.vue';

const columns = [
  {
    title: '指标名称',
    dataIndex: 'metricName',
    key: 'metricName',
    width: 200,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 260,
    fixed: 'right' as const,
  },
];

const dataSource = ref<MetricCode[]>([]);
const loading = ref(false);
const queryParams = ref({ metricName: '' });

const metricModalRef = ref<InstanceType<typeof MetricModal> | null>(null);

const loadData = async () => {
  loading.value = true;
  try {
    const list = await listMetricsApi();
    dataSource.value = list.filter((item) => {
      const matchName =
        !queryParams.value.metricName ||
        item.metricName
          .toLowerCase()
          .includes(queryParams.value.metricName.toLowerCase());
      return matchName;
    });
  } catch {
    console.error('获取指标列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  queryParams.value = { metricName: '' };
  loadData();
};

const handleAdd = () => {
  metricModalRef.value?.open('create');
};

const handleEdit = async (record: MetricCode) => {
  try {
    const detail = await getMetricApi(Number(record.id));
    metricModalRef.value?.open('edit', detail);
  } catch {
    message.error('获取指标详情失败');
  }
};

const handleDelete = (record: MetricCode) => {
  if (record.status === 'ONLINE') {
    message.warning('已上线的指标不能删除，请先下线');
    return;
  }
  Modal.confirm({
    title: '确认删除',
    content: `确定删除指标「${record.metricName}」吗？`,
    async onOk() {
      await deleteMetricApi(record.id);
      message.success('删除成功');
      loadData();
    },
  });
};

const handleValidate = async (record: MetricCode) => {
  try {
    await validateMetricApi(record.id);
    message.success('验证通过');
    loadData();
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || '验证失败';
    message.error(`验证失败: ${errorMsg}`);
  }
};

const handleOnline = (record: MetricCode) => {
  if (record.status !== 'VALIDATED') {
    message.warning('只有验证通过的指标才能上线');
    return;
  }
  Modal.confirm({
    title: '确认上线',
    content: `确定上线指标「${record.metricName}」吗？`,
    async onOk() {
      await onlineMetricApi(record.id);
      message.success('上线成功');
      loadData();
    },
  });
};

const handleOffline = (record: MetricCode) => {
  if (record.status !== 'ONLINE') {
    message.warning('只有已上线的指标才能下线');
    return;
  }
  Modal.confirm({
    title: '确认下线',
    content: `确定下线指标「${record.metricName}」吗？下线后需要重新全量构建才能生效。`,
    async onOk() {
      await offlineMetricApi(record.id);
      message.success('下线成功');
      loadData();
    },
  });
};

const handleBuildAll = () => {
  Modal.confirm({
    title: '全量构建',
    content: '确定执行全量构建吗？将重新编译所有已发布的指标。',
    async onOk() {
      await buildAllApi();
      message.success('全量构建完成');
    },
  });
};

const handleModalSuccess = () => {
  loadData();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ONLINE': {
      return 'green';
    }
    case 'VALIDATED': {
      return 'blue';
    }
    case 'DEVELOPING': {
      return 'orange';
    }
    default: {
      return 'default';
    }
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'ONLINE': {
      return '已上线';
    }
    case 'VALIDATED': {
      return '已验证';
    }
    case 'DEVELOPING': {
      return '开发中';
    }
    default: {
      return status;
    }
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <Card title="指标查询">
      <Space>
        <Input
          v-model:value="queryParams.metricName"
          placeholder="指标名称"
          style="width: 200px"
          @press-enter="handleSearch"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
        <Button type="primary" @click="handleAdd">新增指标</Button>
        <Button @click="handleBuildAll">全量构建</Button>
      </Space>
    </Card>

    <Card title="指标列表">
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :scroll="{ x: 1000 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createdAt'">
            {{ formatDateTime(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'updatedAt'">
            {{ formatDateTime(record.updatedAt) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'action'">
            <Space>
              <Button size="small" type="link" @click="handleEdit(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="handleValidate(record)">
                验证
              </Button>
              <Button
                v-if="record.status === 'VALIDATED'"
                size="small"
                type="link"
                @click="handleOnline(record)"
              >
                上线
              </Button>
              <Button
                v-else-if="record.status === 'ONLINE'"
                danger
                size="small"
                type="link"
                @click="handleOffline(record)"
              >
                下线
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="handleDelete(record)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <MetricModal
      ref="metricModalRef"
      @success="handleModalSuccess"
    />
  </div>
</template>
