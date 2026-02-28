<script setup lang="ts">
import { onMounted, ref } from 'vue';

import {
  Button,
  Card,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { queryFieldList, type FieldOption } from '#/api/rule/field';
import { getSceneOptionsApi } from '#/api/rule/scene';

// 表格列定义
const columns = [
  {
    title: '字段编码',
    dataIndex: 'fieldCode',
    key: 'fieldCode',
    width: 150,
  },
  {
    title: '字段名称',
    dataIndex: 'fieldName',
    key: 'fieldName',
    width: 150,
  },
  {
    title: '字段类型',
    dataIndex: 'fieldType',
    key: 'fieldType',
    width: 120,
  },
  {
    title: '数据类型',
    dataIndex: 'dataType',
    key: 'dataType',
    width: 120,
  },
  {
    title: '默认值',
    dataIndex: 'defaultValue',
    key: 'defaultValue',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
];

// 数据源
const dataSource = ref<FieldOption[]>([]);

// 场景选项
const sceneOptions = ref<Array<{ label: string; value: string }>>([]);

// 加载状态
const loading = ref(false);

// 查询参数
const queryParams = ref({
  fieldCode: '',
  fieldName: '',
  sceneCode: '',
});

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await queryFieldList({
      fieldCode: queryParams.value.fieldCode || undefined,
      fieldName: queryParams.value.fieldName || undefined,
      sceneCode: queryParams.value.sceneCode || undefined,
    });
    dataSource.value = response;
  } catch (error) {
    console.error('获取字段列表失败:', error);
    message.error('获取字段列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载场景选项
const loadSceneOptions = async () => {
  try {
    sceneOptions.value = await getSceneOptionsApi();
  } catch (error) {
    console.error('获取场景选项失败:', error);
  }
};

// 搜索
const handleSearch = () => {
  loadData();
};

// 重置搜索
const handleReset = () => {
  queryParams.value = {
    fieldCode: '',
    fieldName: '',
    sceneCode: '',
  };
  loadData();
};

// 获取状态标签颜色
const getStatusColor = (status: string) => {
  return status === 'ACTIVE' ? 'green' : 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  return status === 'ACTIVE' ? '启用' : '禁用';
};

// 组件挂载时加载数据
onMounted(() => {
  loadSceneOptions();
  loadData();
});
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <Card title="字段查询">
      <Space>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">场景:</span>
          <Select
            v-model:value="queryParams.sceneCode"
            :options="sceneOptions"
            placeholder="请选择场景"
            allow-clear
            show-search
            :filter-option="(input: string, option: any) => option.label.toLowerCase().includes(input.toLowerCase())"
            style="width: 160px"
          />
        </div>
        <Input
          v-model:value="queryParams.fieldCode"
          placeholder="字段编码"
          style="width: 200px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="queryParams.fieldName"
          placeholder="字段名称"
          style="width: 200px"
          @press-enter="handleSearch"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </Card>

    <Card title="字段列表">
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :scroll="{ x: 1000 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </Tag>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
