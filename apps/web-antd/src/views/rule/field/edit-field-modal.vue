<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, Select, message, Alert } from 'ant-design-vue';

import { 
  getFieldDetail, 
  updateFieldApi, 
  checkFieldReferenceApi,
  type FieldOption,
  type FieldReferenceCheckResult 
} from '#/api/rule/field';

const emit = defineEmits<{
  success: [];
}>();

// 表单数据
const formModel = reactive({
  id: '',
  fieldCode: '',
  fieldName: '',
  description: '',
  fieldType: 'SIMPLE',
  dataType: 'STRING',
  defaultValue: '',
  fieldPrior: 1,
  status: 'ACTIVE',
});

// 字段类型选项
const fieldTypeOptions = [
  { label: '简单字段', value: 'SIMPLE' },
  { label: '复杂字段', value: 'COMPLEX' },
];

// 数据类型选项
const dataTypeOptions = [
  { label: '字符串', value: 'STRING' },
  { label: '整数', value: 'INTEGER' },
  { label: '小数', value: 'DECIMAL' },
  { label: '布尔', value: 'BOOLEAN' },
  { label: '日期', value: 'DATE' },
  { label: '日期时间', value: 'DATETIME' },
];

// 状态选项
const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '禁用', value: 'INACTIVE' },
];

// 加载状态
const loading = ref(false);

// 字段引用信息
const fieldReference = ref<FieldReferenceCheckResult | null>(null);

/**
 * Modal
 */
const [Modal, modalApi] = useVbenModal({
  title: '编辑字段',
  async onConfirm() {
    // 表单验证
    if (!formModel.fieldName.trim()) {
      message.warning('请输入字段名称');
      return;
    }

    loading.value = true;
    try {
      await updateFieldApi({
        id: formModel.id,
        fieldName: formModel.fieldName.trim(),
        description: formModel.description.trim() || undefined,
        fieldType: formModel.fieldType,
        dataType: formModel.dataType,
        defaultValue: formModel.defaultValue.trim() || undefined,
        fieldPrior: formModel.fieldPrior,
        status: formModel.status,
      });

      message.success('字段更新成功');
      emit('success');
      await modalApi.close();
      resetForm();
    } catch (error: any) {
      console.error('更新字段失败:', error);
      // 错误提示由全局拦截器统一处理
    } finally {
      loading.value = false;
    }
  },
  onCancel() {
    resetForm();
    modalApi.close();
  },
});

// 重置表单
const resetForm = () => {
  formModel.id = '';
  formModel.fieldCode = '';
  formModel.fieldName = '';
  formModel.description = '';
  formModel.fieldType = 'SIMPLE';
  formModel.dataType = 'STRING';
  formModel.defaultValue = '';
  formModel.fieldPrior = 1;
  formModel.status = 'ACTIVE';
  fieldReference.value = null;
};

// 加载字段详情
const loadFieldDetail = async (fieldId: string) => {
  loading.value = true;
  try {
    const field = await getFieldDetail(fieldId);
    formModel.id = field.id;
    formModel.fieldCode = field.fieldCode;
    formModel.fieldName = field.fieldName;
    formModel.description = field.description || '';
    formModel.fieldType = field.fieldType;
    formModel.dataType = field.dataType;
    formModel.defaultValue = field.defaultValue || '';
    formModel.fieldPrior = field.fieldPrior || 1;
    formModel.status = field.status;
    
    // 检查字段是否被规则条件引用
    fieldReference.value = await checkFieldReferenceApi(field.fieldCode);
  } catch (error) {
    console.error('获取字段详情失败:', error);
    message.error('获取字段详情失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 对外暴露打开方法
 */
defineExpose({
  open: async (fieldId: string) => {
    resetForm();
    await loadFieldDetail(fieldId);
    modalApi.open();
  },
});
</script>

<template>
  <Modal>
    <!-- 字段被引用的警告提示 -->
    <Alert
      v-if="fieldReference?.isReferenced"
      type="warning"
      show-icon
      :message="`字段已被规则条件引用（${fieldReference.referenceCount} 处）${fieldReference.referenceMessage}`"
      :description="`只允许修改字段名称，不允许修改其他属性`"
      class="mb-4"
    />
    
    <Form
      :label-col="{ span: 6 }"
      :model="formModel"
      :wrapper-col="{ span: 18 }"
      layout="horizontal"
    >
      <FormItem label="字段编码" name="fieldCode">
        <Input v-model:value="formModel.fieldCode" disabled placeholder="字段编码（不可修改）" />
      </FormItem>
      <FormItem label="字段名称" name="fieldName" required>
        <Input v-model:value="formModel.fieldName" placeholder="请输入字段名称" />
      </FormItem>
      <FormItem label="字段类型" name="fieldType">
        <Select
          v-model:value="formModel.fieldType"
          :options="fieldTypeOptions"
          placeholder="请选择字段类型"
          :disabled="fieldReference?.isReferenced"
        />
      </FormItem>
      <FormItem label="字段优先级" name="fieldPrior">
        <Input
          v-model:value="formModel.fieldPrior"
          type="number"
          placeholder="数字越小优先级越高"
          :min="1"
          :max="5000"
          :disabled="fieldReference?.isReferenced"
        />
      </FormItem>
      <FormItem label="数据类型" name="dataType">
        <Select
          v-model:value="formModel.dataType"
          :options="dataTypeOptions"
          placeholder="请选择数据类型"
          :disabled="fieldReference?.isReferenced"
        />
      </FormItem>
      <FormItem label="默认值" name="defaultValue">
        <Input v-model:value="formModel.defaultValue" placeholder="请输入默认值" />
      </FormItem>
      <FormItem label="状态" name="status">
        <Select
          v-model:value="formModel.status"
          :options="statusOptions"
          placeholder="请选择状态"
          :disabled="fieldReference?.isReferenced"
        />
      </FormItem>
      <FormItem label="描述" name="description">
        <Input v-model:value="formModel.description" placeholder="请输入描述" />
      </FormItem>
    </Form>
  </Modal>
</template>
