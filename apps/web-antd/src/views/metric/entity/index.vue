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
  deleteEntityApi,
  listEntitiesApi,
  type MetricEntity,
} from '#/api/rule/metric';

import EntityModal from './entity-modal.vue';

const columns = [
  {
    title: '实体编码',
    dataIndex: 'entityCode',
    key: 'entityCode',
    width: 200,
  },
  {
    title: '实体名称',
    dataIndex: 'entityName',
    key: 'entityName',
    width: 200,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
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
    width: 180,
    fixed: 'right' as const,
  },
];

const dataSource = ref<MetricEntity[]>([]);
const loading = ref(false);
const queryParams = ref({ entityCode: '', entityName: '' });

const entityModalRef = ref<InstanceType<typeof EntityModal> | null>(null);

const loadData = async () => {
  loading.value = true;
  try {
    const list = await listEntitiesApi();
    dataSource.value = list.filter((item) => {
      const matchCode =
        !queryParams.value.entityCode ||
        item.entityCode
          .toLowerCase()
          .includes(queryParams.value.entityCode.toLowerCase());
      const matchName =
        !queryParams.value.entityName ||
        item.entityName
          .toLowerCase()
          .includes(queryParams.value.entityName.toLowerCase());
      return matchCode && matchName;
    });
  } catch {
    console.error('获取实体列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  queryParams.value = { entityCode: '', entityName: '' };
  loadData();
};

const handleAdd = () => {
  entityModalRef.value?.open('create');
};

const handleEdit = (record: MetricEntity) => {
  entityModalRef.value?.open('edit', record);
};

const handleDelete = (record: MetricEntity) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除实体「${record.entityName}」吗？`,
    async onOk() {
      await deleteEntityApi(record.id);
      message.success('删除成功');
      loadData();
    },
  });
};

const handleModalSuccess = () => {
  loadData();
};

const getStatusColor = (status: string) => {
  return status === 'ACTIVE' ? 'green' : 'default';
};

const getStatusText = (status: string) => {
  return status === 'ACTIVE' ? '启用' : '禁用';
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <Card title="实体查询">
      <Space>
        <Input
          v-model:value="queryParams.entityCode"
          placeholder="实体编码"
          style="width: 200px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="queryParams.entityName"
          placeholder="实体名称"
          style="width: 200px"
          @press-enter="handleSearch"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
        <Button type="primary" @click="handleAdd">新增实体</Button>
      </Space>
    </Card>

    <Card title="实体列表">
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :scroll="{ x: 900 }"
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

    <EntityModal ref="entityModalRef" @success="handleModalSuccess" />
  </div>
</template>
