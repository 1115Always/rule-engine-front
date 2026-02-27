<script setup lang="ts">
import {
  computed,
  onMounted,
  reactive,
  ref,
  watch,
  shallowRef,
  nextTick,
} from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Select } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getActionOptions } from '#/api/rule/action';
import { getFieldOptions } from '#/api/rule/field';
import {
  createRuleApi,
  getRuleDetailApi,
  updateRuleApi,
} from '#/api/rule/rule';

// 条件项类型
interface ConditionItem {
  id: string;
  conditionKey: string;
  conditionName: string;
  conditionType: 'EVAL' | 'EXACT' | 'RANGE';
  fieldName: string;
  operator: string;
  conditionValue: string;
  expression: string;
  sortOrder: number;
}

// 模式类型：create-新增, edit-编辑
type ModalMode = 'create' | 'edit';

const emit = defineEmits<{
  success: [];
}>();

// 规则包信息
const packageInfo = ref({
  id: '',
  name: '',
});

// 当前规则ID（编辑/查看模式使用）
const currentRuleId = ref<number | string | null>(null);

// 当前模式
const modalMode = ref<ModalMode>('create');

// 对话框标题
const modalTitle = computed(() => {
  switch (modalMode.value) {
    case 'create':
      return '新建规则';
    case 'edit':
      return '编辑规则';
    default:
      return '规则';
  }
});

// 是否只读模式（统一为编辑模式，无只读）
const isReadonly = computed(() => false);

// 表单数据
const formModel = reactive({
  ruleName: '',
  description: '',
  actionType: [] as string[],
  actionParam: '',
  conditionRelation: '',
});

// 字段选项
const fieldOptions = ref<any[]>([]);

// 字段选项过滤函数（支持label和value的模糊搜索）
const filterFieldOptions = (input: string, option: any) => {
  const inputLower = input.toLowerCase();
  const labelMatch = option.label?.toLowerCase().includes(inputLower);
  const valueMatch = option.value?.toLowerCase().includes(inputLower);
  return labelMatch || valueMatch;
};

// 操作符选项
const operatorOptions = [
  { label: '等于', value: '=' },
  { label: '不等于', value: '!=' },
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
  { label: '大于等于', value: '>=' },
  { label: '小于等于', value: '<=' },
];

// 条件列表
const conditions = ref<ConditionItem[]>([]);

// 动作类型选项
const actionTypeOptions = ref<any[]>([]);

// 动作类型选项映射（用于翻译）
const actionTypeMap = computed(() => {
  const map = new Map<string, string>();
  actionTypeOptions.value.forEach((item) => {
    map.set(item.value, item.label);
  });
  return map;
});

// 获取动作类型的中文标签
const getActionTypeLabel = (actionTypeValue: string) => {
  if (!actionTypeValue) return [];
  // 支持逗号分隔的多个动作类型
  const values = actionTypeValue.split(',');
  return values.map((val) => actionTypeMap.value.get(val) || val);
};

// 使用 shallowRef 来存储表单实例
const FormRef = shallowRef();
const formApiRef = ref();

// 加载中状态
const loading = ref(false);

// 获取动作类型选项
const loadActionOptions = async () => {
  try {
    actionTypeOptions.value = await getActionOptions();
  } catch (error) {
    console.error('获取动作类型失败:', error);
    message.error('获取动作类型失败');
  }
};

// 获取字段选项
const loadFieldOptions = async (params?: {
  fieldCode?: string;
  fieldName?: string;
}) => {
  try {
    fieldOptions.value = await getFieldOptions(params);
  } catch (error) {
    console.error('获取字段列表失败:', error);
    message.error('获取字段列表失败');
  }
};

// 获取规则详情
const loadRuleDetail = async (id: number | string) => {
  loading.value = true;
  try {
    const detail = await getRuleDetailApi(id);
    // 填充表单数据
    formModel.ruleName = detail.ruleName || '';
    formModel.description = detail.description || '';
    // 处理动作类型（支持逗号分隔的多个值）
    formModel.actionType = detail.actionType ? detail.actionType.split(',') : [];
    formModel.actionParam = detail.actionParam || '';
    formModel.conditionRelation = detail.conditionRelation || '';

    // 填充条件列表
    if (detail.conditions && detail.conditions.length > 0) {
      conditions.value = detail.conditions.map((item: any, index: number) => ({
        id: `${Date.now()}_${index}`,
        conditionKey: item.conditionKey || `c${index + 1}`,
        conditionName: item.conditionName || '',
        conditionType: item.conditionType || 'EXACT',
        fieldName: item.fieldName || '',
        operator: item.operator || '=',
        conditionValue: item.conditionValue || '',
        expression: item.expression || '',
        sortOrder: item.sortOrder || index,
      }));
    } else {
      conditions.value = [];
    }

    // 更新表单值
    nextTick(() => {
      formApiRef.value?.setValues?.({
        ruleName: formModel.ruleName,
        description: formModel.description,
        actionType: formModel.actionType,
        conditionRelation: formModel.conditionRelation,
      });
    });
  } catch (error) {
    console.error('获取规则详情失败:', error);
    message.error('获取规则详情失败');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  formModel.ruleName = '';
  formModel.description = '';
  formModel.actionType = [];
  formModel.actionParam = '';
  formModel.conditionRelation = '';
  conditions.value = [];
  currentRuleId.value = null;

  nextTick(() => {
    formApiRef.value?.resetForm?.();
  });
};

// 保存规则（新增模式）
const handleCreateSave = async (values: any) => {
  // 验证条件
  if (conditions.value.length === 0) {
    message.error('请至少添加一个条件');
    throw new Error('请至少添加一个条件');
  }

  const requestData = {
    rulePackageId: packageInfo.value.id, // 直接使用字符串，避免大整数精度丢失
    ruleName: values.ruleName,
    description: values.description || '',
    actionType: values.actionType?.join(',') || '',
    actionParam: '',
    conditionRelation: values.conditionRelation || '',
    status: 'ACTIVE',
    version: 1,
    conditions: conditions.value.map((item) => ({
      conditionKey: item.conditionKey,
      conditionName: item.conditionName || '',
      conditionType: item.conditionType,
      fieldName: item.fieldName || '',
      operator: item.operator || '',
      conditionValue: item.conditionValue || '',
      expression: item.expression || '',
      sortOrder: item.sortOrder,
    })),
  };

  try {
    await createRuleApi(requestData);
    message.success('规则创建成功');
    emit('success');
    await modalApi.close();
    resetForm();
  } catch (apiError: any) {
    message.error(apiError.message || '规则创建失败，请稍后重试');
    throw apiError;
  }
};

// 保存规则（编辑模式）
const handleEditSave = async (values: any) => {
  if (!currentRuleId.value) {
    message.error('规则ID不存在');
    return;
  }

  // 验证条件
  if (conditions.value.length === 0) {
    message.error('请至少添加一个条件');
    throw new Error('请至少添加一个条件');
  }

  const requestData = {
    id: currentRuleId.value,
    ruleName: values.ruleName,
    description: values.description || '',
    actionType: values.actionType?.join(',') || '',
    actionParam: '',
    conditionRelation: values.conditionRelation || '',
    conditions: conditions.value.map((item) => ({
      conditionKey: item.conditionKey,
      conditionName: item.conditionName || '',
      conditionType: item.conditionType,
      fieldName: item.fieldName || '',
      operator: item.operator || '',
      conditionValue: item.conditionValue || '',
      expression: item.expression || '',
      sortOrder: item.sortOrder,
    })),
  };

  try {
    await updateRuleApi(requestData);
    message.success('规则更新成功');
    emit('success');
    await modalApi.close();
    resetForm();
  } catch (apiError: any) {
    message.error(apiError.message || '规则更新失败，请稍后重试');
    throw apiError;
  }
};

// 表单提交处理
const handleSubmit = async (values: any) => {
  if (modalMode.value === 'create') {
    await handleCreateSave(values);
  } else if (modalMode.value === 'edit') {
    await handleEditSave(values);
  }
};

// 初始化表单
const initializeForm = () => {
  const [Form, formApi] = useVbenForm({
    layout: 'horizontal',
    wrapperClass: 'grid-cols-2',
    commonConfig: {
      labelWidth: 100,
      componentProps: {
        class: 'w-full',
      },
    },
    showDefaultActions: false,
    handleSubmit: handleSubmit,
    schema: [
      {
        fieldName: 'ruleName',
        label: '规则名称',
        component: 'Input',
        componentProps: {
          placeholder: '请输入规则名称',
          disabled: isReadonly,
        },
        rules: 'required',
        formItemClass: 'col-span-1',
      },
      {
        fieldName: 'actionType',
        label: '动作类型',
        component: 'Select',
        componentProps: {
          mode: 'multiple',
          placeholder: '请选择动作类型',
          options: actionTypeOptions.value,
          class: 'w-full',
          disabled: isReadonly,
        },
        rules: 'required',
        formItemClass: 'col-span-1',
      },
      {
        fieldName: 'description',
        label: '规则描述',
        component: 'Textarea',
        componentProps: {
          placeholder: '请输入规则描述',
          rows: 3,
          disabled: isReadonly,
        },
        formItemClass: 'col-span-2',
      },
      {
        fieldName: 'conditionRelation',
        label: '条件关系表达式',
        component: 'Input',
        componentProps: {
          placeholder: '如：c1 AND c2 OR c3',
          disabled: isReadonly,
        },
        formItemClass: 'col-span-2',
      },
    ],
  });

  FormRef.value = Form;
  formApiRef.value = formApi;
};

// 监听动作类型选项变化，重新初始化表单
watch(
  () => actionTypeOptions.value,
  () => {
    initializeForm();
  },
  { immediate: true },
);

// 监听只读状态变化，更新表单
watch(
  () => isReadonly.value,
  () => {
    initializeForm();
    // 重新设置表单值
    nextTick(() => {
      formApiRef.value?.setValues?.({
        ruleName: formModel.ruleName,
        description: formModel.description,
        actionType: formModel.actionType,
        conditionRelation: formModel.conditionRelation,
      });
    });
  },
);

// 添加条件
const addCondition = () => {
  const newCondition: ConditionItem = {
    id: Date.now().toString(),
    conditionKey: `c${conditions.value.length + 1}`,
    conditionName: '',
    conditionType: 'EXACT',
    fieldName: '',
    operator: '=',
    conditionValue: '',
    expression: '',
    sortOrder: conditions.value.length,
  };
  conditions.value.push(newCondition);
};

// 删除条件
const removeCondition = (index: number) => {
  conditions.value.splice(index, 1);
  // 重新排序
  conditions.value.forEach((item, idx) => {
    item.sortOrder = idx;
    item.conditionKey = `c${idx + 1}`;
  });
};

// 保存按钮点击处理
const handleSaveClick = async () => {
  // 先触发表单验证
  const isValid = await formApiRef.value?.validate?.();
  if (!isValid) {
    return;
  }
  // 获取表单值并提交
  const values = await formApiRef.value?.getValues?.();
  await handleSubmit(values);
};

// Modal配置
const [Modal, modalApi] = useVbenModal({
  title: modalTitle,
  class: 'w-[80vw]',
  async onConfirm() {
    // 编辑/新增模式执行保存
    await handleSaveClick();
  },
  onCancel() {
    modalApi.close();
    resetForm();
  },
});

// 组件挂载时加载数据
onMounted(() => {
  loadActionOptions();
  loadFieldOptions();
});

// 对外暴露方法
const open = (
  mode: ModalMode,
  pkgInfo: { id: string; name: string },
  ruleId?: number | string,
) => {
  modalMode.value = mode;
  packageInfo.value = pkgInfo;

  if (ruleId !== undefined && ruleId !== null) {
    currentRuleId.value = ruleId;
    loadRuleDetail(ruleId);
  } else {
    currentRuleId.value = null;
    resetForm();
  }

  modalApi.open();
};

defineExpose({
  open,
});
</script>

<template>
  <Modal>
    <div v-if="loading" class="py-8 text-center">加载中...</div>
    <div v-else>
      <!-- 规则基本信息 -->
      <div class="mb-6">
        <div class="mb-4 font-medium">规则基本信息</div>
        <component :is="FormRef" v-if="FormRef" />
      </div>

      <!-- 规则条件 -->
      <div class="mb-6">
        <div class="mb-4 font-medium">规则条件</div>
        <div v-if="!isReadonly" class="mb-4">
          <Button type="primary" @click="addCondition" block>
            + 添加条件
          </Button>
        </div>

        <div
          v-if="conditions.length === 0"
          class="py-8 text-center text-gray-500"
        >
          暂无条件，请点击上方按钮添加条件
        </div>

        <div v-else>
          <div
            v-for="(condition, index) in conditions"
            :key="condition.id"
            class="mb-4 rounded-lg border p-4"
          >
            <!-- 使用 flex 布局让 label 和 input 在同一行 -->
            <div class="mb-4 flex flex-wrap items-center gap-4">
              <div class="flex min-w-[200px] flex-1 items-center gap-2">
                <label class="shrink-0 text-sm text-gray-600">{{
                  `条件${condition.conditionKey}`
                }}</label>
                <Input
                  v-model:value="condition.conditionName"
                  placeholder="请输入条件名称"
                  class="flex-1"
                  :disabled="isReadonly"
                />
              </div>
              <div class="flex min-w-[150px] flex-1 items-center gap-2">
                <label class="shrink-0 text-sm text-gray-600">字段</label>
                <Select
                  v-model:value="condition.fieldName"
                  :options="fieldOptions"
                  show-search
                  :filter-option="filterFieldOptions"
                  class="flex-1"
                  :disabled="isReadonly"
                />
              </div>
              <div class="flex min-w-[100px] flex-1 items-center gap-2">
                <label class="shrink-0 text-sm text-gray-600">操作符</label>
                <Select
                  v-model:value="condition.operator"
                  :options="operatorOptions"
                  class="flex-1"
                  :disabled="isReadonly"
                />
              </div>
              <div class="flex min-w-[200px] flex-1 items-center gap-2">
                <label class="shrink-0 text-sm text-gray-600">条件值</label>
                <Input
                  v-model:value="condition.conditionValue"
                  placeholder="请输入条件值"
                  class="flex-1"
                  :disabled="isReadonly"
                />
              </div>
              <Button v-if="!isReadonly" danger @click="removeCondition(index)">
                删除
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.ant-card) {
  box-shadow:
    0 1px 2px 0 rgb(0 0 0 / 3%),
    0 1px 6px -1px rgb(0 0 0 / 2%),
    0 2px 4px 0 rgb(0 0 0 / 2%);
}
</style>
