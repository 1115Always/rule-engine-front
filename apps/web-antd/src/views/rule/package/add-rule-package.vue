<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, Select, message } from 'ant-design-vue';

import { getSceneOptionsApi } from '#/api/rule/scene';
import { createRulePackageApi } from '#/api/rule/rule-package';

const emit = defineEmits<{
  success: [];
}>();

const formModel = reactive({
  name: '',
  scenes: [],
});

const sceneOptions = ref<Array<{ label: string; value: string }>>([]);

// 获取场景选项
const fetchSceneOptions = async () => {
  try {
    sceneOptions.value = await getSceneOptionsApi();
  } catch (error) {
    console.error('获取场景选项失败:', error);
  }
};

onMounted(() => {
  fetchSceneOptions();
});

/**
 * Modal（vben5 官方）
 */
const [Modal, modalApi] = useVbenModal({
  title: '新建规则包',
  async onConfirm() {
    try {
      // 生成规则包编码（使用时间戳）
      const packageCode = `PACKAGE_${Date.now()}`;
      
      await createRulePackageApi({
        packageCode,
        packageName: formModel.name,
        description: `规则包: ${formModel.name}`,
        status: 'ACTIVE',
        version: 1,
        scenes: formModel.scenes
      });
      
      message.success('规则包创建成功');
      emit('success');
      await modalApi.close();
      formModel.name = '';
      formModel.scenes = [];
    } catch (error: any) {
      console.error('创建规则包失败:', error);
      message.error(error.message || '创建规则包失败');
    }
  },
  onCancel() {
    formModel.name = '';
    formModel.scenes = [];
    modalApi.close();
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
          :options="sceneOptions"
          mode="multiple"
          placeholder="请选择规则场景"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
