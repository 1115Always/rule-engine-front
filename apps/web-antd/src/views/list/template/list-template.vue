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
  Select,
  Table,
  Tag,
  Space,
  message,
} from 'ant-design-vue';

import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  pageListTemplate,
  previewExpression,
  updateTemplate,
  type CreateListTemplateDTO,
  type ListTemplateDTO,
} from '#/api/list/list-template';
import { listAllGroup } from '#/api/list/list-group';
import { ListTypeOptions, ListLevelOptions } from '#/api/list/list-template';
import { queryFieldList } from '#/api/rule/field';

const emit = defineEmits<{
  edit: [record: ListTemplateDTO];
}>();

// 表格列定义
const columns = [
  { title: '模板名称', dataIndex: 'templateName', key: 'templateName', width: 180 },
  { title: '分组', dataIndex: 'groupName', key: 'groupName', width: 120 },
  { title: '名单类型', dataIndex: 'listType', key: 'listType', width: 100 },
  { title: '名单级别', dataIndex: 'listLevel', key: 'listLevel', width: 100 },
  { title: '关联字段', dataIndex: 'fieldCode', key: 'fieldCode', width: 120 },
  { title: 'Redis Key预览', dataIndex: 'redisKeyPreview', key: 'redisKeyPreview', width: 300, ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '操作', key: 'action', width: 200 },
];

// 数据源
const dataSource = ref<ListTemplateDTO[]>([]);
const total = ref(0);
const loading = ref(false);

// 搜索
const searchName = ref('');
const pagination = ref({ current: 1, pageSize: 10 });

// 弹窗
const modalVisible = ref(false);
const modalTitle = ref('创建模板');
const modalLoading = ref(false);
const formRef = ref();
const editingId = ref<number | null>(null);

// 分组选项
const groupOptions = ref<Array<{ label: string; value: number }>>([]);

// 字段选项
const fieldOptions = ref<Array<{ label: string; value: number }>>([]);

const formState = ref<CreateListTemplateDTO>({
  templateName: '',
  groupId: 0,
  listType: 'ACCOUNT',
  listLevel: 'BLACK',
  fieldId: 0,
  description: '',
});

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const result = await pageListTemplate(
      pagination.value.current,
      pagination.value.pageSize,
      searchName.value || undefined
    );
    dataSource.value = result.records;
    total.value = result.total;
  } catch (error) {
    console.error('获取模板列表失败:', error);
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

// 加载字段选项
const loadFieldOptions = async () => {
  try {
    const fields = await queryFieldList();
    fieldOptions.value = fields
      .filter((f) => f.status === 'ACTIVE')
      .map((f) => ({ label: `${f.fieldName}（${f.fieldCode}）`, value: Number(f.id) }));
  } catch (error) {
    console.error('获取字段列表失败:', error);
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
  modalTitle.value = '创建模板';
  formState.value = {
    templateName: '',
    groupId: 0,
    listType: 'ACCOUNT',
    listLevel: 'BLACK',
    fieldId: 0,
    description: '',
  };
  modalVisible.value = true;
};

// 打开编辑弹窗
const handleEdit = async (record: ListTemplateDTO) => {
  editingId.value = record.id!;
  modalTitle.value = '编辑模板';
  modalLoading.value = true;
  try {
    const result = await getTemplateById(record.id!);
    formState.value = {
      templateName: result.templateName,
      groupId: result.groupId,
      listType: result.listType,
      listLevel: result.listLevel,
      fieldId: result.fieldId,
      description: result.description || '',
    };
    modalVisible.value = true;
  } catch (error) {
    console.error('获取模板详情失败:', error);
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
      await updateTemplate({ id: editingId.value, ...formState.value });
      message.success('更新成功');
    } else {
      await createTemplate(formState.value);
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
const handleDelete = (record: ListTemplateDTO) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除模板"${record.templateName}"吗？`,
    onOk: async () => {
      try {
        await deleteTemplate(record.id!);
        message.success('删除成功');
        loadData();
      } catch (error) {
        console.error('删除失败:', error);
      }
    },
  });
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

// 组件挂载
onMounted(() => {
  loadData();
  loadGroupOptions();
  loadFieldOptions();
});

defineExpose({ loadData });
</script>

<template>
  <Card title="名单模板">
    <!-- 搜索区域 -->
    <div class="mb-4 flex items-center gap-4">
      <Input
        v-model:value="searchName"
        placeholder="模板名称"
        class="w-48"
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
      <Button type="primary" @click="handleCreate">创建模板</Button>
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
        <FormItem label="模板名称" name="templateName" :rules="[{ required: true, message: '请输入模板名称' }]">
          <Input v-model:value="formState.templateName" placeholder="请输入模板名称" />
        </FormItem>
        <FormItem label="名单分组" name="groupId" :rules="[{ required: true, message: '请选择名单分组' }]">
          <Select v-model:value="formState.groupId" :options="groupOptions" placeholder="请选择名单分组" />
        </FormItem>
        <FormItem label="名单类型" name="listType" :rules="[{ required: true, message: '请选择名单类型' }]">
          <Select v-model:value="formState.listType" :options="ListTypeOptions" placeholder="请选择名单类型" />
        </FormItem>
        <FormItem label="名单级别" name="listLevel" :rules="[{ required: true, message: '请选择名单级别' }]">
          <Select v-model:value="formState.listLevel" :options="ListLevelOptions" placeholder="请选择名单级别" />
        </FormItem>
        <FormItem label="关联字段" name="fieldId" :rules="[{ required: true, message: '请选择关联字段' }]">
          <Select v-model:value="formState.fieldId" :options="fieldOptions" placeholder="请选择关联字段（名单中存储的值类型）" show-search :filter-option="(input: string, option: any) => option.label?.toLowerCase().includes(input.toLowerCase())" />
        </FormItem>
        <FormItem label="描述" name="description">
          <Input v-model:value="formState.description" placeholder="请输入描述" />
        </FormItem>
      </Form>
    </Modal>
  </Card>
</template>
