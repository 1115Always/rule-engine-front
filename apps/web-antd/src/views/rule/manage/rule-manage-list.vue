<script setup lang="ts">
import { ref } from 'vue';

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

// 表格列定义
const columns = [
  {
    title: '规则名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '规则类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: 100,
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
    dataIndex: 'createTime',
    key: 'createTime',
    width: 180,
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    key: 'updateTime',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
];

// 模拟数据
const dataSource = ref([
  {
    id: '1',
    name: '规则1',
    type: '过滤规则',
    priority: 1,
    status: 'active',
    description: '这是一个过滤规则的描述信息',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-15 14:30:00',
  },
  {
    id: '2',
    name: '规则2',
    type: '计算规则',
    priority: 2,
    status: 'inactive',
    description: '这是一个计算规则的描述信息',
    createTime: '2024-01-02 11:00:00',
    updateTime: '2024-01-16 15:30:00',
  },
  {
    id: '3',
    name: '规则3',
    type: '校验规则',
    priority: 3,
    status: 'active',
    description: '这是一个校验规则的描述信息',
    createTime: '2024-01-03 12:00:00',
    updateTime: '2024-01-17 16:30:00',
  },
]);

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 3,
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
const loadData = () => {
  loading.value = true;
  // TODO: 调用API获取数据
  setTimeout(() => {
    loading.value = false;
  }, 500);
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
    content: `确定要删除规则"${record.name}"吗？`,
    onOk() {
      // TODO: 调用删除API
      message.success('删除成功');
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
