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

import {
  Button,
  Input,
  message,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

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

// 逻辑关系类型
type LogicRelationType = 'ALL_AND' | 'ALL_OR' | 'CUSTOM';

// 表单数据
const formModel = reactive({
  ruleName: '',
  description: '',
  actionType: [] as string[],
  actionParam: '',
  conditionRelation: '',
});

// 逻辑关系类型选择
const logicRelationType = ref<LogicRelationType>('ALL_AND');

// 自定义表达式输入
const customExpression = ref('');

// 表达式输入框引用
const expressionInputRef = ref<any>(null);

// 逻辑关系类型选项
const logicRelationTypeOptions = [
  { label: '全且（所有条件都满足）', value: 'ALL_AND' },
  { label: '全或（任一条件满足）', value: 'ALL_OR' },
  { label: '自定义（支持复杂表达式）', value: 'CUSTOM' },
];

// 可用的条件key列表
const availableConditionKeys = computed(() =>
  conditions.value.map((c) => c.conditionKey),
);

// 根据逻辑关系类型自动生成条件关系表达式
const generatedConditionRelation = computed(() => {
  if (conditions.value.length === 0) {
    return '';
  }

  const conditionKeys = conditions.value.map((c) => c.conditionKey);

  if (logicRelationType.value === 'ALL_AND') {
    return conditionKeys.join(' AND ');
  }

  if (logicRelationType.value === 'ALL_OR') {
    return conditionKeys.join(' OR ');
  }

  // 自定义模式：返回用户输入的表达式
  return customExpression.value.trim();
});

// 解析表达式中的所有token
const parseExpressionTokens = (expr: string): string[] => {
  if (!expr) return [];
  // 匹配条件key(c1, c2等)、AND、OR、括号
  const tokenRegex = /(c\d+|AND|OR|\(|\))/g;
  const tokens: string[] = [];
  let match;
  while ((match = tokenRegex.exec(expr)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
};

// 校验自定义逻辑关系表达式
const validateCustomLogic = (): { valid: boolean; message: string; errorPos?: number } => {
  const expr = customExpression.value.trim();

  if (!expr) {
    return { valid: false, message: '请输入条件关系表达式' };
  }

  const validKeys = availableConditionKeys.value;
  const tokens = parseExpressionTokens(expr);

  if (tokens.length === 0) {
    return { valid: false, message: '表达式格式错误，请检查输入' };
  }

  // 检查所有条件key是否有效
  for (const token of tokens) {
    if (token.startsWith('c') && !validKeys.includes(token)) {
      return {
        valid: false,
        message: `条件 "${token}" 不存在，当前可用条件: ${validKeys.join(', ') || '无'}`,
      };
    }
  }

  // 使用栈来验证括号匹配和语法
  let parenCount = 0;
  let expectCondition = true; // 期望下一个是条件或左括号

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;

    if (token === '(') {
      parenCount++;
      if (!expectCondition) {
        return { valid: false, message: '括号前需要操作符(AND/OR)' };
      }
      // 左括号后需要条件或另一个左括号
      expectCondition = true;
    } else if (token === ')') {
      parenCount--;
      if (parenCount < 0) {
        return { valid: false, message: '括号不匹配，存在多余的右括号' };
      }
      if (expectCondition) {
        return { valid: false, message: '括号内不能为空' };
      }
      // 右括号后可以跟操作符或右括号
      expectCondition = false;
    } else if (token === 'AND' || token === 'OR') {
      if (expectCondition) {
        return { valid: false, message: `操作符 "${token}" 前缺少条件` };
      }
      expectCondition = true;
    } else {
      // 条件key
      if (!expectCondition) {
        return { valid: false, message: `条件 "${token}" 前缺少操作符(AND/OR)` };
      }
      expectCondition = false;
    }
  }

  // 检查括号是否匹配
  if (parenCount !== 0) {
    return { valid: false, message: '括号不匹配，存在未闭合的左括号' };
  }

  // 检查是否以条件或右括号结尾
  if (expectCondition) {
    return { valid: false, message: '表达式不能以操作符结尾' };
  }

  // 检查是否所有条件都被使用
  const usedKeys = new Set(tokens.filter((t) => t.startsWith('c')));
  const unusedKeys = validKeys.filter((k) => !usedKeys.has(k));
  if (unusedKeys.length > 0) {
    return {
      valid: false,
      message: `以下条件未被使用: ${unusedKeys.join(', ')}，请将所有条件添加到表达式中`,
    };
  }

  return { valid: true, message: '' };
};

// 插入文本到表达式输入框
const insertToExpression = (text: string) => {
  const input = expressionInputRef.value?.$el?.querySelector('textarea') || expressionInputRef.value?.resizableTextArea?.textArea;

  if (input) {
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = customExpression.value;

    // 在光标位置插入文本
    customExpression.value = value.substring(0, start) + text + value.substring(end);

    // 更新光标位置
    nextTick(() => {
      const newCursorPos = start + text.length;
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    });
  } else {
    // 如果无法获取输入框，直接追加
    customExpression.value += text;
  }
};

// 快速插入条件
const insertCondition = (key: string) => {
  insertToExpression(key);
};

// 快速插入操作符
const insertOperator = (op: string) => {
  insertToExpression(` ${op} `);
};

// 快速插入括号
const insertParenthesis = (paren: string) => {
  insertToExpression(paren);
};

// 清空表达式
const clearExpression = () => {
  customExpression.value = '';
};

// 快速生成模板表达式
const quickGenerateTemplate = (type: 'all_and' | 'all_or' | 'grouped') => {
  const keys = availableConditionKeys.value;
  if (keys.length === 0) {
    message.warning('请先添加条件');
    return;
  }

  if (type === 'all_and') {
    customExpression.value = keys.join(' AND ');
  } else if (type === 'all_or') {
    customExpression.value = keys.join(' OR ');
  } else if (type === 'grouped') {
    // 分组模式：每两个条件一组
    const groups: string[] = [];
    for (let i = 0; i < keys.length; i += 2) {
      const groupKeys = keys.slice(i, i + 2);
      if (groupKeys.length === 1) {
        groups.push(groupKeys[0]);
      } else {
        groups.push(`(${groupKeys.join(' AND ')})`);
      }
    }
    customExpression.value = groups.join(' OR ');
  }
};

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

// 解析条件关系表达式，推断逻辑关系类型
const parseConditionRelation = (expression: string) => {
  if (!expression || expression.trim() === '') {
    return { type: 'ALL_AND' as LogicRelationType };
  }

  // 检查是否有括号（复杂表达式）
  const hasParentheses = expression.includes('(') || expression.includes(')');

  if (!hasParentheses) {
    // 简单表达式，检查是否全且或全或
    const parts = expression.split(/\s+/).filter((p) => p.trim());
    const conditionKeys = parts.filter((p) => p.startsWith('c'));
    const operators = parts.filter((p) => p === 'AND' || p === 'OR');

    // 检查是否全是 AND
    if (operators.length > 0 && operators.every((op) => op === 'AND')) {
      const expectedKeys = conditionKeys.map((_, i) => `c${i + 1}`);
      if (JSON.stringify(conditionKeys) === JSON.stringify(expectedKeys)) {
        return { type: 'ALL_AND' as LogicRelationType };
      }
    }

    // 检查是否全是 OR
    if (operators.length > 0 && operators.every((op) => op === 'OR')) {
      const expectedKeys = conditionKeys.map((_, i) => `c${i + 1}`);
      if (JSON.stringify(conditionKeys) === JSON.stringify(expectedKeys)) {
        return { type: 'ALL_OR' as LogicRelationType };
      }
    }
  }

  // 复杂表达式或自定义表达式
  return { type: 'CUSTOM' as LogicRelationType };
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

    // 解析条件关系表达式，推断逻辑关系类型
    const parsed = parseConditionRelation(formModel.conditionRelation);
    logicRelationType.value = parsed.type;
    // 如果是自定义模式，设置自定义表达式
    if (parsed.type === 'CUSTOM') {
      customExpression.value = formModel.conditionRelation;
    } else {
      customExpression.value = '';
    }

    // 更新表单值
    nextTick(() => {
      formApiRef.value?.setValues?.({
        ruleName: formModel.ruleName,
        description: formModel.description,
        actionType: formModel.actionType,
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
  logicRelationType.value = 'ALL_AND';
  customExpression.value = '';

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

  // 验证自定义逻辑关系
  if (logicRelationType.value === 'CUSTOM') {
    const validation = validateCustomLogic();
    if (!validation.valid) {
      message.error(validation.message);
      throw new Error(validation.message);
    }
  }

  const conditionRelation = generatedConditionRelation.value;

  const requestData = {
    rulePackageId: packageInfo.value.id, // 直接使用字符串，避免大整数精度丢失
    ruleName: values.ruleName,
    description: values.description || '',
    actionType: values.actionType?.join(',') || '',
    actionParam: '',
    conditionRelation,
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
    // 错误消息已由全局响应拦截器处理，无需重复显示
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

  // 验证自定义逻辑关系
  if (logicRelationType.value === 'CUSTOM') {
    const validation = validateCustomLogic();
    if (!validation.valid) {
      message.error(validation.message);
      throw new Error(validation.message);
    }
  }

  const conditionRelation = generatedConditionRelation.value;

  const requestData = {
    id: currentRuleId.value,
    ruleName: values.ruleName,
    description: values.description || '',
    actionType: values.actionType?.join(',') || '',
    actionParam: '',
    conditionRelation,
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
    // 错误消息已由全局响应拦截器处理，无需重复显示
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

      <!-- 逻辑关系配置 -->
      <div v-if="conditions.length > 0" class="mb-6">
        <div class="mb-4 font-medium">逻辑关系</div>
        <div class="rounded-lg border p-4">
          <div class="mb-4">
            <label class="mb-2 block text-sm text-gray-600">关系类型</label>
            <Select
              v-model:value="logicRelationType"
              :options="logicRelationTypeOptions"
              class="w-full"
              :disabled="isReadonly"
            />
          </div>

          <!-- 自动生成的表达式预览 -->
          <div v-if="logicRelationType !== 'CUSTOM'" class="mb-2">
            <label class="mb-2 block text-sm text-gray-600">生成的表达式</label>
            <div class="rounded bg-gray-50 p-3 font-mono text-sm">
              {{ generatedConditionRelation || '-' }}
            </div>
          </div>

          <!-- 自定义表达式配置 -->
          <div v-else>
            <!-- 快捷模板 -->
            <div class="mb-4">
              <label class="mb-2 block text-sm text-gray-600">快捷模板</label>
              <Space wrap>
                <Button
                  size="small"
                  :disabled="isReadonly"
                  @click="quickGenerateTemplate('all_and')"
                >
                  全且
                </Button>
                <Button
                  size="small"
                  :disabled="isReadonly"
                  @click="quickGenerateTemplate('all_or')"
                >
                  全或
                </Button>
                <Button
                  size="small"
                  :disabled="isReadonly"
                  @click="quickGenerateTemplate('grouped')"
                >
                  分组模式
                </Button>
                <Button
                  size="small"
                  danger
                  :disabled="isReadonly || !customExpression"
                  @click="clearExpression"
                >
                  清空
                </Button>
              </Space>
            </div>

            <!-- 表达式输入 -->
            <div class="mb-4">
              <label class="mb-2 block text-sm text-gray-600"
                >表达式输入
                <span class="font-normal text-gray-400"
                  >（支持括号嵌套，如: (c1 AND c2) OR (c3 AND c4)）</span
                ></label
              >
              <Input.TextArea
                ref="expressionInputRef"
                v-model:value="customExpression"
                placeholder="请输入条件关系表达式，如：(c1 AND c2) OR c3"
                :rows="3"
                :disabled="isReadonly"
                class="font-mono"
              />
            </div>

            <!-- 快捷插入按钮 -->
            <div class="mb-4">
              <label class="mb-2 block text-sm text-gray-600">快捷插入</label>
              <div class="space-y-2">
                <!-- 条件按钮 -->
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs text-gray-500">条件:</span>
                  <Space :size="4" wrap>
                    <Tag
                      v-for="key in availableConditionKeys"
                      :key="key"
                      color="blue"
                      style="cursor: pointer"
                      @click="insertCondition(key)"
                    >
                      {{ key }}
                    </Tag>
                  </Space>
                </div>
                <!-- 操作符和括号 -->
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs text-gray-500">操作符:</span>
                  <Space :size="4">
                    <Tag
                      color="green"
                      style="cursor: pointer"
                      @click="insertOperator('AND')"
                    >
                      AND
                    </Tag>
                    <Tag
                      color="orange"
                      style="cursor: pointer"
                      @click="insertOperator('OR')"
                    >
                      OR
                    </Tag>
                  </Space>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs text-gray-500">括号:</span>
                  <Space :size="4">
                    <Tag
                      color="purple"
                      style="cursor: pointer"
                      @click="insertParenthesis('(')"
                    >
                      (
                    </Tag>
                    <Tag
                      color="purple"
                      style="cursor: pointer"
                      @click="insertParenthesis(')')"
                    >
                      )
                    </Tag>
                  </Space>
                </div>
              </div>
            </div>

            <!-- 校验提示 -->
            <div class="mb-2">
              <label class="mb-2 block text-sm text-gray-600">校验结果</label>
              <div class="rounded p-3 text-sm" :class="
                validateCustomLogic().valid ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
              ">
                <div v-if="validateCustomLogic().valid">
                  ✓ 表达式格式正确
                </div>
                <div v-else>
                  ✗ {{ validateCustomLogic().message }}
                </div>
              </div>
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
