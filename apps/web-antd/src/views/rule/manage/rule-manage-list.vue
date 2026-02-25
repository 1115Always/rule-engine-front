<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  message,
  Modal,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { deleteRuleApi, getRulesApi } from "#/api/rule/rule";

const route = useRoute();

// 从路由参数获取规则包信息
const packageInfo = computed(() => ({
  id: route.query.packageId as string,
  name: route.query.packageName as string,
}));

//表格列定义
const columns = [
  {
    title: '规则ID',
    dataIndex: 'ruleId',
    key: 'ruleId',
    width: 150,
  },
  {
    title: '规则名称',
    dataIndex: 'ruleName',
    key: 'ruleName',
    width: 200,
  },
  {
    title: '规则包',
    dataIndex: 'packageName',
    key: 'packageName',
    width: 150,
  },
  {
    title: '动作类型',
    dataIndex: 'actionType',
    key: 'actionType',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '规则描述',
    dataIndex: 'description',
    key: 'description',
    width: 200,
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 144,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 144,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
];

// 数据源
const dataSource = ref<any[]>([]);
const ruleListResponse = ref<any>(null);

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 加载状态
const loading = ref(false);

// 分页变化处理
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  loadData();
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await getRulesApi({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      packageName: packageInfo.value.name
    });

    ruleListResponse.value = response;
    dataSource.value = response.records;
    pagination.value.total = response.total;
    pagination.value.current = response.current;
    pagination.value.pageSize = response.size;
  } catch (error) {
    console.error('获取规则列表失败:', error);
    message.error('获取规则列表失败');
  } finally {
    loading.value = false;
  }
};

// 查看规则
const handleView = (record: any) => {
  // TODO: 打开查看规则详情弹窗
  message.info(`查看规则: ${record.name}`);
};

// 编辑规则
const handleEdit = (record: any) => {
  // TODO: 打开编辑规则弹窗
  message.info(`编辑规则: ${record.name}`);
};

// 删除规则
const handleDelete = (record: any) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除规则"${record.ruleName}"吗？`,
    onOk: async () => {
      try {
        await deleteRuleApi(record.id);
        message.success('删除成功');
        // 删除成功后刷新列表
        loadData();
      } catch (error) {
        console.error('删除规则失败:', error);
        message.error('删除规则失败');
      }
    },
  });
};

// 获取状态标签颜色
const getStatusColor = (status: string) => {
  return status === 'active' ? 'green' : 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  return status === 'active' ? '启用' : '禁用';
};

// 格式化日期时间
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return '-';
  return dateTimeStr.replace('T', ' ');
};

//组件挂载时加载数据
onMounted(() => {
  loadData();
});
</script>

<template>
  <Card title="规则列表">
    <Table
      :columns="columns"
      :data-source="dataSource"
      :pagination="pagination"
      :loading="loading"
      :scroll="{ x: 1200 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <Tag :color="getStatusColor(record.status)">
            {{ getStatusText(record.status) }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDateTime(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'updatedAt'">
          {{ formatDateTime(record.updatedAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleView(record)">
              <IconifyIcon icon="ant-design:eye-outlined" />
              查看
            </Button>
            <Button type="link" size="small" @click="handleEdit(record)">
              <IconifyIcon icon="ant-design:edit-outlined" />
              编辑
            </Button>
            <Button
              type="link"
              danger
              size="small"
              @click="handleDelete(record)"
            >
              <IconifyIcon icon="ant-design:delete-outlined" />
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>
  </Card>
</template>
