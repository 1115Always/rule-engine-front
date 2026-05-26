<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, message } from 'ant-design-vue';

import {
  createMetricApi,
  type MetricCode,
  updateMetricApi,
} from '#/api/rule/metric';

type ModalMode = 'create' | 'edit' | 'view';

const emit = defineEmits<{
  success: [];
}>();

const modalMode = ref<ModalMode>('create');
const currentId = ref<string>('');

const formModel = reactive({
  metricName: '',
  dslCode: '',
  enabled: 1,
});

const [Modal, modalApi] = useVbenModal({
  title: '新增指标',
  async onConfirm() {
    if (!formModel.metricName.trim()) {
      message.warning('请输入指标名称');
      return;
    }
    if (!formModel.dslCode.trim()) {
      message.warning('请输入DSL代码');
      return;
    }

    try {
      if (modalMode.value === 'create') {
        await createMetricApi({
          metricName: formModel.metricName.trim(),
          dslCode: formModel.dslCode.trim(),
          enabled: formModel.enabled,
        });
        message.success('指标创建成功');
      } else {
        await updateMetricApi(currentId.value, {
          metricName: formModel.metricName.trim(),
          dslCode: formModel.dslCode.trim(),
          enabled: formModel.enabled,
        });
        message.success('指标更新成功');
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
  formModel.metricName = '';
  formModel.dslCode = '';
  formModel.enabled = 1;
};

defineExpose({
  open: (mode: ModalMode, record?: MetricCode) => {
    resetForm();
    modalMode.value = mode;
    if ((mode === 'edit' || mode === 'view') && record) {
      currentId.value = record.id;
      formModel.metricName = record.metricName;
      formModel.dslCode = record.dslCode;
      formModel.enabled = record.enabled;
    }
    const titles: Record<ModalMode, string> = {
      create: '新增指标',
      edit: '编辑指标',
      view: '指标详情',
    };
    modalApi.setState({ title: titles[mode] });
    modalApi.open();
  },
});
</script>

<template>
  <Modal :show-confirm-button="modalMode !== 'view'">
    <Form
      :label-col="{ span: 5 }"
      :model="formModel"
      :wrapper-col="{ span: 19 }"
      layout="horizontal"
    >
      <FormItem label="指标名称" name="metricName" required>
        <Input
          v-model:value="formModel.metricName"
          :disabled="modalMode !== 'create'"
          placeholder="请输入指标名称，如 txn_count_24h"
        />
      </FormItem>
      <FormItem label="DSL 代码" name="dslCode" required>
        <Input.TextArea
          v-model:value="formModel.dslCode"
          :rows="6"
          :disabled="modalMode === 'view'"
          placeholder="请输入指标DSL代码"
          style="font-family: monospace"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
