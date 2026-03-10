<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, message, Select } from 'ant-design-vue';

import {
  createMetricApi,
  type MetricCode,
  updateMetricApi,
} from '#/api/rule/metric';

type ModalMode = 'create' | 'edit';

const props = defineProps<{
  entityOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  success: [];
}>();

const modalMode = ref<ModalMode>('create');
const currentId = ref<string>('');

const formModel = reactive({
  metricName: '',
  entityCode: '',
  dslCode: '',
  redisPattern: '',
  enabled: 1,
});

const [Modal, modalApi] = useVbenModal({
  title: '新增指标',
  async onConfirm() {
    if (!formModel.metricName.trim()) {
      message.warning('请输入指标名称');
      return;
    }
    if (!formModel.entityCode) {
      message.warning('请选择所属实体');
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
          entityCode: formModel.entityCode,
          dslCode: formModel.dslCode.trim(),
          redisPattern: formModel.redisPattern.trim(),
          enabled: formModel.enabled,
        });
        message.success('指标创建成功');
      } else {
        await updateMetricApi(currentId.value, {
          metricName: formModel.metricName.trim(),
          entityCode: formModel.entityCode,
          dslCode: formModel.dslCode.trim(),
          redisPattern: formModel.redisPattern.trim(),
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
  formModel.entityCode = '';
  formModel.dslCode = '';
  formModel.redisPattern = '';
  formModel.enabled = 1;
};

defineExpose({
  open: (mode: ModalMode, record?: MetricCode) => {
    resetForm();
    modalMode.value = mode;
    if (mode === 'edit' && record) {
      currentId.value = record.id;
      formModel.metricName = record.metricName;
      formModel.entityCode = record.entityCode;
      formModel.dslCode = record.dslCode;
      formModel.redisPattern = record.redisPattern || '';
      formModel.enabled = record.enabled;
    }
    modalApi.setState({ title: mode === 'create' ? '新增指标' : '编辑指标' });
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
      <FormItem label="指标名称" name="metricName" required>
        <Input
          v-model:value="formModel.metricName"
          :disabled="modalMode === 'edit'"
          placeholder="请输入指标名称，如 txn_count_24h"
        />
      </FormItem>
      <FormItem label="所属实体" name="entityCode" required>
        <Select
          v-model:value="formModel.entityCode"
          :options="entityOptions"
          allow-clear
          placeholder="请选择所属实体"
          show-search
          :filter-option="
            (input: string, option: any) =>
              option.label.toLowerCase().includes(input.toLowerCase())
          "
        />
      </FormItem>
      <FormItem label="DSL 代码" name="dslCode" required>
        <Input.TextArea
          v-model:value="formModel.dslCode"
          :rows="6"
          placeholder="请输入指标DSL代码"
          style="font-family: monospace"
        />
      </FormItem>
      <FormItem label="Redis Pattern" name="redisPattern">
        <Input
          v-model:value="formModel.redisPattern"
          placeholder="请输入Redis Key Pattern，如 metric:{entityCode}:{id}"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
