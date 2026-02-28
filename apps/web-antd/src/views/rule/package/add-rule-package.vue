<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, Select, message } from 'ant-design-vue';

import { getSceneOptionsApi } from '#/api/rule/scene';
import { createRulePackageApi, updateRulePackageApi } from '#/api/rule/rule-package';

const emit = defineEmits<{
  success: [];
}>();

// 模式类型：create-新增, edit-编辑
type ModalMode = 'create' | 'edit';

// 当前模式
const modalMode = ref<ModalMode>('create');

// 当前规则包ID
const currentPackageId = ref<string>('');

// 对话框标题
const modalTitle = computed(() => modalMode.value === 'create' ? '新建规则包' : '编辑规则包');

const formModel = reactive({
  name: '',
  description: '',
  scenes: [] as string[],
});

const sceneOptions = ref<Array<{ label: string; value: string }>>([]);

// 场景名称到编码的映射
const sceneLabelToValueMap = computed(() => {
  const map = new Map<string, string>();
  sceneOptions.value.forEach(option => {
    map.set(option.label, option.value);
  });
  return map;
});

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
  title: modalTitle,
  async onConfirm() {
    try {
      if (modalMode.value === 'create') {
        // 新增模式
        // 生成规则包编码（使用时间戳）
        const packageCode = `PACKAGE_${Date.now()}`;
        
        await createRulePackageApi({
          packageCode,
          packageName: formModel.name,
          description: formModel.description || `规则包: ${formModel.name}`,
          status: 'ACTIVE',
          version: 1,
          scenes: formModel.scenes
        });
        
        message.success('规则包创建成功');
      } else {
        // 编辑模式
        await updateRulePackageApi({
          id: currentPackageId.value,
          packageName: formModel.name,
          description: formModel.description,
          scenes: formModel.scenes
        });
        
        message.success('规则包更新成功');
      }
      
      emit('success');
      await modalApi.close();
      resetForm();
    } catch (error: any) {
      console.error('操作失败:', error);
      message.error(error.message || '操作失败');
    }
  },
  onCancel() {
    resetForm();
    modalApi.close();
  },
});

// 重置表单
const resetForm = () => {
  formModel.name = '';
  formModel.description = '';
  formModel.scenes = [];
  currentPackageId.value = '';
  modalMode.value = 'create';
};

/**
 * 对外暴露打开方法（父组件调用）
 */
defineExpose({
  open: (mode: ModalMode = 'create', rulePackage?: any) => {
    modalMode.value = mode;
    
    if (mode === 'edit' && rulePackage) {
      currentPackageId.value = rulePackage.id;
      formModel.name = rulePackage.name || '';
      formModel.description = rulePackage.description || '';
      // 将场景名称转换为场景编码
      const sceneNames = rulePackage.scenes || [];
      formModel.scenes = sceneNames.map((name: string) => 
        sceneLabelToValueMap.value.get(name) || name
      );
    } else {
      resetForm();
    }
    
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
      <FormItem label="规则包名" name="name">
        <Input v-model:value="formModel.name" placeholder="请输入规则包名" />
      </FormItem>
      <FormItem label="规则描述" name="description">
        <Input v-model:value="formModel.description" placeholder="请输入规则描述" />
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
