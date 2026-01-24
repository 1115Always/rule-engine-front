<script setup lang="ts">
import { reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, Select } from 'ant-design-vue';

const emit = defineEmits<{
  submit: [any];
}>();

const formModel = reactive({
  name: '',
  scenes: [],
});

const options = [
  { label: '单笔转账', value: '单笔转账' },
  { label: '批量转账', value: '批量转账' },
  { label: '信用卡还款', value: '信用卡还款' },
];

/**
 * Modal（vben5 官方）
 */
const [Modal, modalApi] = useVbenModal({
  title: '新建规则包',
  async onConfirm() {
    emit('submit', { ...formModel });
    await modalApi.close();
    formModel.name = '';
    formModel.scenes = [];
  },
  onCancel() {
    formModel.name = '';
    formModel.scenes = [];
  },
});

/**
 * 对外暴露打开方法（父组件调用）
 */
defineExpose({
  open: modalApi.open,
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
      <FormItem label="规则包名" name="name">
        <Input v-model:value="formModel.name" placeholder="请输入规则包名" />
      </FormItem>
      <FormItem label="规则场景" name="scenes">
        <Select
          v-model:value="formModel.scenes"
          :options="options"
          mode="multiple"
          placeholder="请选择规则场景"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
