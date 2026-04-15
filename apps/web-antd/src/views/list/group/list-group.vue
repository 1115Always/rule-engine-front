<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Table,
  Tag,
  Space,
  message,
} from 'ant-design-vue';

import {
  createGroup,
  deleteGroup,
  getGroupById,
  pageListGroup,
  updateGroup,
  type CreateListGroupDTO,
  type ListGroupDTO,
} from '#/api/list/list-group';

const emit = defineEmits<{
  edit: [record: ListGroupDTO];
}>();

// 表格列定义
const columns = [
  { title: '分组编码', dataIndex: 'groupCode', key: 'groupCode', width: 150 },
  { title: '分组名称', dataIndex: 'groupName', key: 'groupName', width: 150 },
  { title: '描述', dataIndex: 'description', key: 'description', width: 200, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 150 },
];

// 数据源
const dataSource = ref<ListGroupDTO[]>([]);
const total = ref(0);
const loading = ref(false);

// 搜索
const searchName = ref('');
const pagination = ref({ current: 1, pageSize: 10 });

// 弹窗
const modalVisible = ref(false);
const modalTitle = ref('创建分组');
const modalLoading = ref(false);
const formRef = ref();
const editingId = ref<number | null>(null);

const formState = ref<CreateListGroupDTO>({
  groupCode: '',
  groupName: '',
  description: '',
  sortOrder: 0,
});

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const result = await pageListGroup(
      pagination.value.current,
      pagination.value.pageSize,
      searchName.value || undefined
    );
    dataSource.value = result.records;
    total.value = result.total;
  } catch (error) {
    console.error('获取分组列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.value.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  searchName.value = '';
  pagination.value.current = 1;
  loadData();
};

// 分页变化
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  loadData();
};

// 打开创建弹窗
const handleCreate = () => {
  editingId.value = null;
  modalTitle.value = '创建分组';
  formState.value = { groupCode: '', groupName: '', description: '', sortOrder: 0 };
  modalVisible.value = true;
};

// 打开编辑弹窗
const handleEdit = async (record: ListGroupDTO) => {
  editingId.value = record.id!;
  modalTitle.value = '编辑分组';
  modalLoading.value = true;
  try {
    const result = await getGroupById(record.id!);
    formState.value = {
      groupCode: result.groupCode,
      groupName: result.groupName,
      description: result.description || '',
      sortOrder: result.sortOrder || 0,
    };
    modalVisible.value = true;
  } catch (error) {
    console.error('获取分组详情失败:', error);
  } finally {
    modalLoading.value = false;
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    modalLoading.value = true;
    if (editingId.value) {
      await updateGroup({ id: editingId.value, ...formState.value });
      message.success('更新成功');
    } else {
      await createGroup(formState.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    loadData();
  } catch (error) {
    console.error('提交失败:', error);
  } finally {
    modalLoading.value = false;
  }
};

// 删除
const handleDelete = (record: ListGroupDTO) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分组"${record.groupName}"吗？`,
    onOk: async () => {
      try {
        await deleteGroup(record.id!);
        message.success('删除成功');
        loadData();
      } catch (error) {
        console.error('删除失败:', error);
      }
    },
  });
};

// 组件挂载
onMounted(() => {
  loadData();
});

defineExpose({ loadData });
</script>

<template>
  <Card title="名单分组">
    <!-- 搜索区域 -->
    <div class="mb-4 flex items-center gap-4">
      <Input
        v-model:value="searchName"
        placeholder="分组名称"
        class="w-48"
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
      <Button type="primary" @click="handleCreate">创建分组</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ current: pagination.current, pageSize: pagination.pageSize, total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
      :scroll="{ x: 1000 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <Tag :color="record.status === 'ACTIVE' ? 'green' : 'red'">
            {{ record.status === 'ACTIVE' ? '启用' : '禁用' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'createdAt'">
          {{ formatDateTime(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
            <Button type="link" danger size="small" @click="handleDelete(record)">删除</Button>
          </Space>
        </template>
      </template>
    </Table>

    <!-- 创建/编辑弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="modalLoading"
      @ok="handleSubmit"
    >
      <Form ref="formRef" :model="formState" layout="vertical">
        <FormItem label="分组编码" name="groupCode" :rules="[{ required: true, message: '请输入分组编码' }]">
          <Input v-model:value="formState.groupCode" placeholder="请输入分组编码" />
        </FormItem>
        <FormItem label="分组名称" name="groupName" :rules="[{ required: true, message: '请输入分组名称' }]">
          <Input v-model:value="formState.groupName" placeholder="请输入分组名称" />
        </FormItem>
        <FormItem label="描述" name="description">
          <Input v-model:value="formState.description" placeholder="请输入描述" />
        </FormItem>
        <FormItem label="排序号" name="sortOrder">
          <Input v-model:value="formState.sortOrder" type="number" placeholder="请输入排序号" />
        </FormItem>
      </Form>
    </Modal>
  </Card>
</template>
