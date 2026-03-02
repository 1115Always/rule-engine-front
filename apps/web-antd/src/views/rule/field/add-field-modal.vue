<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, Select, message } from 'ant-design-vue';

import { createFieldApi } from '#/api/rule/field';

const emit = defineEmits<{
  success: [];
}>();

// 表单数据
const formModel = reactive({
  fieldCode: '',
  fieldName: '',
  description: '',
  fieldType: 'SYSTEM',
  dataType: 'STRING',
  defaultValue: '',
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

/**
 * Modal
 */
const [Modal, modalApi] = useVbenModal({
  title: '新增字段',
  async onConfirm() {
    // 表单验证
    if (!formModel.fieldCode.trim()) {
      message.warning('请输入字段编码');
      return;
    }
    if (!formModel.fieldName.trim()) {
      message.warning('请输入字段名称');
      return;
    }

    try {
      await createFieldApi({
        fieldCode: formModel.fieldCode.trim(),
        fieldName: formModel.fieldName.trim(),
        description: formModel.description.trim() || undefined,
        fieldType: formModel.fieldType,
        dataType: formModel.dataType,
        defaultValue: formModel.defaultValue.trim() || undefined,
        status: formModel.status,
      });

      message.success('字段创建成功');
      emit('success');
      await modalApi.close();
      resetForm();
    } catch (error: any) {
      console.error('创建字段失败:', error);
      // 错误提示由全局拦截器统一处理，无需在此重复提示
    }
  },
  onCancel() {
    resetForm();
    modalApi.close();
  },
});

// 重置表单
const resetForm = () => {
  formModel.fieldCode = '';
  formModel.fieldName = '';
  formModel.description = '';
  formModel.fieldType = 'SIMPLE',
  formModel.dataType = 'STRING';
  formModel.defaultValue = '';
  formModel.status = 'ACTIVE';
};

/**
 * 对外暴露打开方法
 */
defineExpose({
  open: () => {
    resetForm();
    modalApi.open();
  },
});
</script>

<template>
  <Modal>
    <Form
      :label-col="{ span: 6 }"
      :model="formModel"
      :wrapper-col="{ span: 18 }"
      layout="horizontal"
    >
      <FormItem label="字段编码" name="fieldCode" required>
        <Input v-model:value="formModel.fieldCode" placeholder="请输入字段编码" />
      </FormItem>
      <FormItem label="字段名称" name="fieldName" required>
        <Input v-model:value="formModel.fieldName" placeholder="请输入字段名称" />
      </FormItem>
      <FormItem label="字段类型" name="fieldType">
        <Select
          v-model:value="formModel.fieldType"
          :options="fieldTypeOptions"
          placeholder="请选择字段类型"
        />
      </FormItem>
      <FormItem label="数据类型" name="dataType">
        <Select
          v-model:value="formModel.dataType"
          :options="dataTypeOptions"
          placeholder="请选择数据类型"
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
        />
      </FormItem>
      <FormItem label="描述" name="description">
        <Input v-model:value="formModel.description" placeholder="请输入描述" />
      </FormItem>
    </Form>
  </Modal>
</template>
