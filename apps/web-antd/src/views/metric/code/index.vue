<script setup lang="ts">
import { onMounted, ref } from 'vue';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  buildAllApi,
  deleteMetricApi,
  getEntityOptionsApi,
  listMetricsApi,
  type MetricCode,
  publishMetricApi,
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
    title: '所属实体',
    dataIndex: 'entityCode',
    key: 'entityCode',
    width: 160,
  },
  {
    title: 'DSL 代码',
    dataIndex: 'dslCode',
    key: 'dslCode',
    ellipsis: true,
  },
  {
    title: 'Redis Pattern',
    dataIndex: 'redisPattern',
    key: 'redisPattern',
    width: 200,
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
  },
  {
    title: '编译错误',
    dataIndex: 'compileError',
    key: 'compileError',
    width: 160,
    ellipsis: true,
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
const entityOptions = ref<Array<{ label: string; value: string }>>([]);
const queryParams = ref({ metricName: '', entityCode: '' });

const metricModalRef = ref<InstanceType<typeof MetricModal> | null>(null);

const loadData = async () => {
  loading.value = true;
  try {
    const entityCode = queryParams.value.entityCode || undefined;
    const list = await listMetricsApi(entityCode);
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

const loadEntityOptions = async () => {
  try {
    entityOptions.value = await getEntityOptionsApi();
  } catch {
    console.error('获取实体选项失败');
  }
};

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  queryParams.value = { metricName: '', entityCode: '' };
  loadData();
};

const handleAdd = () => {
  metricModalRef.value?.open('create');
};

const handleEdit = (record: MetricCode) => {
  metricModalRef.value?.open('edit', record);
};

const handleDelete = (record: MetricCode) => {
  if (record.status === 'PUBLISHED') {
    message.warning('已发布的指标不能删除，请先下线');
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
    const result = await validateMetricApi(record.metricName);
    if (result.success) {
      message.success('验证通过');
    } else {
      message.error(`验证失败: ${result.error}`);
    }
    loadData();
  } catch {
    console.error('验证失败');
  }
};

const handlePublish = (record: MetricCode) => {
  if (record.status !== 'VALIDATED') {
    message.warning('只有验证通过的指标才能发布');
    return;
  }
  Modal.confirm({
    title: '确认发布',
    content: `确定发布指标「${record.metricName}」吗？`,
    async onOk() {
      await publishMetricApi(record.metricName);
      message.success('发布成功');
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
    case 'PUBLISHED': {
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
    case 'PUBLISHED': {
      return '已发布';
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
  loadEntityOptions();
  loadData();
});
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <Card title="指标查询">
      <Space>
        <div class="flex items-center gap-2">
          <span class="whitespace-nowrap text-sm text-gray-500">实体:</span>
          <Select
            v-model:value="queryParams.entityCode"
            :options="entityOptions"
            allow-clear
            placeholder="请选择实体"
            show-search
            :filter-option="
              (input: string, option: any) =>
                option.label.toLowerCase().includes(input.toLowerCase())
            "
            style="width: 200px"
          />
        </div>
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
        :scroll="{ x: 1400 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </Tag>
          </template>
          <template v-if="column.key === 'compileError'">
            <Tooltip v-if="record.compileError" :title="record.compileError">
              <span class="text-red-500">{{ record.compileError }}</span>
            </Tooltip>
            <span v-else class="text-gray-400">-</span>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button size="small" type="link" @click="handleEdit(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="handleValidate(record)">
                验证
              </Button>
              <Button
                :disabled="record.status !== 'VALIDATED'"
                size="small"
                type="link"
                @click="handlePublish(record)"
              >
                发布
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
      :entity-options="entityOptions"
      @success="handleModalSuccess"
    />
  </div>
</template>
