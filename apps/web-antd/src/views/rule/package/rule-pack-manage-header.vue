<script setup lang="ts">
import { Button } from 'ant-design-vue';
import { watch, shallowRef } from 'vue';

import { useVbenForm } from '#/adapter/form';

interface Props {
  sceneOptions?: Array<{ label: string; value: string }>;
}

const props = defineProps<Props>();
const emit = defineEmits(['add', 'search']);

// 使用 shallowRef 来存储表单实例
const FormRef = shallowRef();

// 初始化表单
const initializeForm = () => {
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
          options: props.sceneOptions || [],
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

  FormRef.value = Form;
};

// 初始化表单
initializeForm();

// 监听props变化，重新初始化表单
watch(() => props.sceneOptions, () => {
  initializeForm();
}, { immediate: true });

async function handleSearch(values: any) {
  emit('search', values);
}
</script>

<template>
  <div class="mb-4 flex items-start justify-start">
    <component :is="FormRef" v-if="FormRef" />

    <div class="ml-4 flex gap-2">
      <Button type="primary" @click="emit('add')">新建规则包</Button>
    </div>
  </div>
</template>
