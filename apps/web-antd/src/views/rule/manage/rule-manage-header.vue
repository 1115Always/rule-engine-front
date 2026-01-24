<script setup lang="ts">
import { Button } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

const emit = defineEmits(['add', 'search']);

const [Form] = useVbenForm({
  compact: true,
  commonConfig: {
    labelWidth: 60,
  },
  handleSubmit: handleSearch,
  layout: 'inline',
  schema: [
    {
      fieldName: 'name',
      label: '规则包名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入规则包名',
      },
    },
    {
      fieldName: 'scenes',
      label: '规则场景',
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: [
          { label: '单笔转账', value: '单笔转账' },
          { label: '批量转账', value: '批量转账' },
          { label: '信用卡还款', value: '信用卡还款' },
        ],
        style: {
          width: '300px',
        },
      },
    },
  ],
  submitButtonOptions: {
    content: '查询',
  },
});

async function handleSearch(values: any) {
  emit('search', values);
}
</script>

<template>
  <div class="mb-4 flex items-start justify-start">
    <Form />

    <div class="ml-4 flex gap-2">
      <Button type="primary" @click="emit('add')">新建规则包</Button>
    </div>
  </div>
</template>
