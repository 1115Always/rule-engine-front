<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tag,
  Space,
  message,
  Upload,
} from 'ant-design-vue';

import {
  createList,
  deleteList,
  getListById,
  pageList,
  syncToRedis,
  updateList,
  exportListUrl,
  type CreateListDTO,
  type ListDTO,
  ListTypeOptions,
  ListLevelOptions,
} from '#/api/list/list';
import { listAllGroup } from '#/api/list/list-group';
import ListImport from './list-import.vue';

const emit = defineEmits<{
  edit: [record: ListDTO];
}>();

// 表格列定义
const columns = [
  { title: '分组', dataIndex: 'groupName', key: 'groupName', width: 120 },
  { title: '名单类型', dataIndex: 'listType', key: 'listType', width: 100 },
  { title: '名单值', dataIndex: 'listValue', key: 'listValue', width: 150, ellipsis: true },
  { title: '名单级别', dataIndex: 'listLevel', key: 'listLevel', width: 100 },
  { title: '失效天数', dataIndex: 'expireDays', key: 'expireDays', width: 100 },
  { title: '原因', dataIndex: 'reason', key: 'reason', width: 150, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 150 },
];

// 数据源
const dataSource = ref<ListDTO[]>([]);
const total = ref(0);
const loading = ref(false);

// 搜索
const searchState = ref({
  groupId: undefined as number | undefined,
  listType: '',
  listLevel: '',
  status: '',
  listValue: '',
});
const pagination = ref({ current: 1, pageSize: 10 });

// 分组选项
const groupOptions = ref<Array<{ label: string; value: number }>>([]);

// 弹窗
const modalVisible = ref(false);
const modalTitle = ref('创建名单');
const modalLoading = ref(false);
const formRef = ref();
const editingId = ref<number | null>(null);

// 导入弹窗
const importModalVisible = ref(false);

const formState = ref<CreateListDTO>({
  groupId: 0,
  listType: 'ACCOUNT',
  listValue: '',
  listLevel: 'BLACK',
  reason: '',
  expireDays: undefined,
});

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const result = await pageList({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      groupId: searchState.value.groupId,
      listType: searchState.value.listType || undefined,
      listLevel: searchState.value.listLevel || undefined,
      status: searchState.value.status || undefined,
      listValue: searchState.value.listValue || undefined,
    });
    dataSource.value = result.records;
    total.value = result.total;
  } catch (error) {
    console.error('获取名单列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 加载分组选项
const loadGroupOptions = async () => {
  try {
    const groups = await listAllGroup();
    groupOptions.value = groups.map((g) => ({ label: g.groupName, value: g.id! }));
  } catch (error) {
    console.error('获取分组列表失败:', error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.value.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  searchState.value = {
    groupId: undefined,
    listType: '',
    listLevel: '',
    status: '',
    listValue: '',
  };
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
  modalTitle.value = '创建名单';
  formState.value = {
    groupId: 0,
    listType: 'ACCOUNT',
    listValue: '',
    listLevel: 'BLACK',
    reason: '',
    expireDays: undefined,
  };
  modalVisible.value = true;
};

// 打开编辑弹窗
const handleEdit = async (record: ListDTO) => {
  editingId.value = record.id!;
  modalTitle.value = '编辑名单';
  modalLoading.value = true;
  try {
    const result = await getListById(record.id!);
    formState.value = {
      groupId: result.groupId,
      listType: result.listType,
      listValue: result.listValue,
      listLevel: result.listLevel,
      reason: result.reason || '',
      expireDays: result.expireDays,
    };
    modalVisible.value = true;
  } catch (error) {
    console.error('获取名单详情失败:', error);
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
      await updateList({ id: editingId.value, reason: formState.value.reason, expireDays: formState.value.expireDays });
      message.success('更新成功');
    } else {
      await createList(formState.value);
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
const handleDelete = (record: ListDTO) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除名单"${record.listValue}"吗？`,
    onOk: async () => {
      try {
        await deleteList(record.id!);
        message.success('删除成功');
        loadData();
      } catch (error) {
        console.error('删除失败:', error);
      }
    },
  });
};

// 同步到Redis
const handleSyncRedis = async () => {
  try {
    await syncToRedis();
    message.success('同步成功');
  } catch (error) {
    console.error('同步失败:', error);
  }
};

// 导出
const handleExport = () => {
  const url = exportListUrl({
    groupId: searchState.value.groupId,
    listType: searchState.value.listType || undefined,
    listLevel: searchState.value.listLevel || undefined,
    status: searchState.value.status || undefined,
    listValue: searchState.value.listValue || undefined,
  });
  const link = document.createElement('a');
  link.href = url;
  link.download = '名单数据导出.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 导入组件引用
const listImportRef = ref<InstanceType<typeof ListImport>>();

// 打开导入弹窗
const handleOpenImport = () => {
  listImportRef.value?.openImport();
};

// 获取类型标签
const getTypeLabel = (type: string) => {
  return ListTypeOptions.find((t) => t.value === type)?.label || type;
};

// 获取级别标签
const getLevelLabel = (level: string) => {
  return ListLevelOptions.find((l) => l.value === level)?.label || level;
};

// 获取级别颜色
const getLevelColor = (level: string) => {
  switch (level) {
    case 'BLACK': return 'red';
    case 'WHITE': return 'green';
    case 'GRAY': return 'orange';
    default: return 'default';
  }
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'green';
    case 'EXPIRED': return 'red';
    default: return 'default';
  }
};

// 组件挂载
onMounted(() => {
  loadData();
  loadGroupOptions();
});

defineExpose({ loadData });
</script>

<template>
  <div>
    <Card title="名单数据">
    <!-- 搜索区域 -->
    <div class="mb-4 flex flex-wrap items-center gap-4">
      <Select
        v-model:value="searchState.groupId"
        :options="[{ label: '全部分组', value: undefined }, ...groupOptions]"
        placeholder="分组"
        allow-clear
        style="width: 120px"
      />
      <Select
        v-model:value="searchState.listType"
        :options="[{ label: '全部类型', value: '' }, ...ListTypeOptions]"
        placeholder="类型"
        allow-clear
        style="width: 100px"
      />
      <Select
        v-model:value="searchState.listLevel"
        :options="[{ label: '全部级别', value: '' }, ...ListLevelOptions]"
        placeholder="级别"
        allow-clear
        style="width: 100px"
      />
      <Select
        v-model:value="searchState.status"
        :options="[{ label: '全部状态', value: '' }, { label: '生效', value: 'ACTIVE' }, { label: '过期', value: 'EXPIRED' }]"
        placeholder="状态"
        allow-clear
        style="width: 100px"
      />
      <Input
        v-model:value="searchState.listValue"
        placeholder="名单值"
        class="w-40"
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
      <Button type="primary" @click="handleCreate">创建名单</Button>
      <Button @click="handleSyncRedis">同步Redis</Button>
      <Button type="primary" @click="handleOpenImport">批量导入</Button>
      <Button @click="handleExport">导出</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ current: pagination.current, pageSize: pagination.pageSize, total, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
      :scroll="{ x: 1200 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'listType'">
          <Tag color="blue">{{ getTypeLabel(record.listType) }}</Tag>
        </template>
        <template v-else-if="column.key === 'listLevel'">
          <Tag :color="getLevelColor(record.listLevel)">{{ getLevelLabel(record.listLevel) }}</Tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag :color="getStatusColor(record.status)">
            {{ record.status === 'ACTIVE' ? '生效' : '过期' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'expireDays'">
          {{ record.expireDays ? `${record.expireDays}天` : '永久' }}
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
      width="600px"
      @ok="handleSubmit"
    >
      <Form ref="formRef" :model="formState" layout="vertical">
        <FormItem v-if="!editingId" label="名单分组" name="groupId" :rules="[{ required: true, message: '请选择名单分组' }]">
          <Select v-model:value="formState.groupId" :options="groupOptions" placeholder="请选择名单分组" />
        </FormItem>
        <FormItem v-if="!editingId" label="名单类型" name="listType" :rules="[{ required: true, message: '请选择名单类型' }]">
          <Select v-model:value="formState.listType" :options="ListTypeOptions" placeholder="请选择名单类型" />
        </FormItem>
        <FormItem v-if="!editingId" label="名单值" name="listValue" :rules="[{ required: true, message: '请输入名单值' }]">
          <Input v-model:value="formState.listValue" placeholder="请输入名单值" />
        </FormItem>
        <FormItem v-if="!editingId" label="名单级别" name="listLevel" :rules="[{ required: true, message: '请选择名单级别' }]">
          <Select v-model:value="formState.listLevel" :options="ListLevelOptions" placeholder="请选择名单级别" />
        </FormItem>
        <FormItem label="失效天数" name="expireDays">
          <InputNumber v-model:value="formState.expireDays" placeholder="不填则永久有效" :min="1" style="width: 100%" />
        </FormItem>
        <FormItem label="原因" name="reason">
          <Input v-model:value="formState.reason" placeholder="请输入原因" />
        </FormItem>
      </Form>
    </Modal>
  </Card>
  <ListImport ref="listImportRef" />
</div>
</template>
