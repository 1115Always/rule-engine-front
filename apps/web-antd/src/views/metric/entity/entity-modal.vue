<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
  Textarea,
} from 'ant-design-vue';

import {
  createEntityApi,
  type MetricEntity,
  updateEntityApi,
} from '#/api/rule/metric';

type ModalMode = 'create' | 'edit';

const emit = defineEmits<{
  success: [];
}>();

const modalMode = ref<ModalMode>('create');
const currentId = ref<string>('');

const formModel = reactive({
  entityCode: '',
  entityName: '',
  fieldSchema: '[]',
  status: 'ACTIVE',
  enabled: 1,
});

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'INACTIVE' },
];

// 字段列表（从 fieldSchema JSON 解析）
const fields = ref<Array<{ fieldName: string; fieldType: string; cnName: string }>>([]);

const parseFieldSchema = (schema: string) => {
  try {
    fields.value = JSON.parse(schema || '[]');
  } catch {
    fields.value = [];
  }
};

const syncFieldSchema = () => {
  formModel.fieldSchema = JSON.stringify(fields.value);
};

const addField = () => {
  fields.value.push({ fieldName: '', fieldType: 'String', cnName: '' });
  syncFieldSchema();
};

const removeField = (index: number) => {
  fields.value.splice(index, 1);
  syncFieldSchema();
};

const onFieldChange = () => {
  syncFieldSchema();
};

const fieldTypeOptions = [
  { label: 'String', value: 'String' },
  { label: 'Integer', value: 'Integer' },
  { label: 'Long', value: 'Long' },
  { label: 'Double', value: 'Double' },
  { label: 'BigDecimal', value: 'BigDecimal' },
  { label: 'Boolean', value: 'Boolean' },
  { label: 'Date', value: 'Date' },
];

const [Modal, modalApi] = useVbenModal({
  title: '新增实体',
  async onConfirm() {
    if (!formModel.entityCode.trim()) {
      message.warning('请输入实体编码');
      return;
    }
    if (!formModel.entityName.trim()) {
      message.warning('请输入实体名称');
      return;
    }

    try {
      if (modalMode.value === 'create') {
        await createEntityApi({
          entityCode: formModel.entityCode.trim(),
          entityName: formModel.entityName.trim(),
          fieldSchema: formModel.fieldSchema,
          status: formModel.status,
          enabled: formModel.enabled,
        });
        message.success('实体创建成功');
      } else {
        await updateEntityApi(currentId.value, {
          entityCode: formModel.entityCode.trim(),
          entityName: formModel.entityName.trim(),
          fieldSchema: formModel.fieldSchema,
          status: formModel.status,
          enabled: formModel.enabled,
        });
        message.success('实体更新成功');
      }
      emit('success');
      await modalApi.close();
      resetForm();
    } catch (error: any) {
      console.error('操作失败:', error);
    }
  },
  onCancel() {
    resetForm();
    modalApi.close();
  },
});

const resetForm = () => {
  formModel.entityCode = '';
  formModel.entityName = '';
  formModel.fieldSchema = '[]';
  formModel.status = 'ACTIVE';
  formModel.enabled = 1;
  fields.value = [];
};

defineExpose({
  open: (mode: ModalMode, record?: MetricEntity) => {
    resetForm();
    modalMode.value = mode;
    if (mode === 'edit' && record) {
      currentId.value = record.id;
      formModel.entityCode = record.entityCode;
      formModel.entityName = record.entityName;
      formModel.fieldSchema = record.fieldSchema || '[]';
      formModel.status = record.status;
      formModel.enabled = record.enabled;
      parseFieldSchema(record.fieldSchema);
    }
    modalApi.setState({ title: mode === 'create' ? '新增实体' : '编辑实体' });
    modalApi.open();
  },
});
</script>

<template>
  <Modal>
    <Form
      :label-col="{ span: 5 }"
      :model="formModel"
      :wrapper-col="{ span: 19 }"
      layout="horizontal"
    >
      <FormItem label="实体编码" name="entityCode" required>
        <Input
          v-model:value="formModel.entityCode"
          :disabled="modalMode === 'edit'"
          placeholder="请输入实体编码，如 transaction"
        />
      </FormItem>
      <FormItem label="实体名称" name="entityName" required>
        <Input
          v-model:value="formModel.entityName"
          placeholder="请输入实体名称，如 交易实体"
        />
      </FormItem>
      <FormItem label="状态" name="status">
        <Select
          v-model:value="formModel.status"
          :options="statusOptions"
          placeholder="请选择状态"
        />
      </FormItem>
      <FormItem label="字段列表">
        <div class="flex flex-col gap-2">
          <div
            v-for="(field, index) in fields"
            :key="index"
            class="flex items-center gap-2"
          >
            <Input
              v-model:value="field.fieldName"
              placeholder="字段名"
              style="width: 140px"
              @change="onFieldChange"
            />
            <Select
              v-model:value="field.fieldType"
              :options="fieldTypeOptions"
              placeholder="类型"
              style="width: 130px"
              @change="onFieldChange"
            />
            <Input
              v-model:value="field.cnName"
              placeholder="中文名"
              style="width: 140px"
              @change="onFieldChange"
            />
            <Button danger size="small" type="link" @click="removeField(index)">
              删除
            </Button>
          </div>
          <Button size="small" type="dashed" @click="addField">
            + 添加字段
          </Button>
        </div>
      </FormItem>
    </Form>
  </Modal>
</template>
