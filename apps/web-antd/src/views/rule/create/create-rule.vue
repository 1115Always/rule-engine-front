<script setup lang="ts">
import { onMounted, reactive, ref, watch, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Button, Input, message, Select } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getActionOptions } from '#/api/rule/action';

const route = useRoute();
const router = useRouter();

// 从路由参数获取规则包信息
const packageInfo = {
  id: route.query.packageId as string,
  name: route.query.packageName as string,
};

// 表单数据
const formModel = reactive({
  ruleName: '',
  description: '',
  actionType: [] as string[],
  actionParam: '',
  conditionRelation: '',
  conditions: [] as ConditionItem[],
});

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

// 字段选项
const fieldOptions = [
  { label: '用户ID', value: '1' },
  { label: '用户名', value: '2' },
  { label: '年龄', value: '3' },
  { label: '性别', value: '4' },
  { label: '部门', value: '5' },
  { label: '职位', value: '6' },
];

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

// 使用 shallowRef 来存储表单实例
const FormRef = shallowRef();

// 获取动作类型选项
const loadActionOptions = async () => {
  try {
    actionTypeOptions.value = await getActionOptions();
  } catch (error) {
    console.error('获取动作类型失败:', error);
    message.error('获取动作类型失败');
  }
};

// 组件挂载时加载动作类型选项
onMounted(() => {
  loadActionOptions();
});

// 返回上一页
const handleBack = () => {
  router.back();
};

// 保存规则
const handleSave = async (values: any) => {
  // 验证条件
  if (conditions.value.length === 0) {
    message.error('请至少添加一个条件');
    throw new Error('请至少添加一个条件');
  }

  // 构建请求数据
  const requestData = {
    ...values,
    rulePackageId: Number.parseInt(packageInfo.id),
    conditions: conditions.value.map((item) => ({
      conditionKey: item.conditionKey,
      conditionName: item.conditionName,
      conditionType: item.conditionType,
      fieldName: item.fieldName,
      operator: item.operator,
      conditionValue: item.conditionValue,
      expression: item.expression,
      sortOrder: item.sortOrder,
    })),
  };

  // TODO: 调用API创建规则
  // console.log('创建规则请求数据:', requestData);

  // 模拟API调用
  try {
    // 这里应该调用实际的API
    // await createRule(requestData);

    message.success('规则创建成功');
    // 返回规则包管理页面
    router.back();
  } catch (apiError) {
    message.error('规则创建失败，请稍后重试');
    throw apiError;
  }
};

// 表单配置
const formApiRef = ref();

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
    handleSubmit: handleSave,
    schema: [
      {
        fieldName: 'ruleName',
        label: '规则名称',
        component: 'Input',
        componentProps: {
          placeholder: '请输入规则名称',
        },
        rules: '请输入规则名称',
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
        },
        rules: '请选择动作类型',
        formItemClass: 'col-span-1',
      },
      {
        fieldName: 'description',
        label: '规则描述',
        component: 'Textarea',
        componentProps: {
          placeholder: '请输入规则描述',
          rows: 3,
        },
        formItemClass: 'col-span-2',
      },
      {
        fieldName: 'conditionRelation',
        label: '条件关系表达式',
        component: 'Input',
        componentProps: {
          placeholder: '如：c1 AND c2 OR c3',
        },
        formItemClass: 'col-span-2',
      },
    ],
  });

  FormRef.value = Form;
  formApiRef.value = formApi;
};

// 初始化表单
initializeForm();

// 监听动作类型选项变化，重新初始化表单
watch(() => actionTypeOptions.value, () => {
  initializeForm();
}, { immediate: true });

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
</script>

<template>
  <div class="p-4">
    <!-- 规则基本信息 -->
    <a-card title="规则基本信息" class="mb-6">
      <component :is="FormRef" v-if="FormRef" />
    </a-card>

    <!-- 规则条件 -->
    <a-card title="规则条件" class="mb-6">
      <div class="mb-4">
        <Button type="primary" @click="addCondition" block> + 添加条件 </Button>
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
            <div class="flex flex-1 min-w-[200px] items-center gap-2">
              <label class="shrink-0 text-sm text-gray-600">{{ `条件${condition.conditionKey}` }}</label>
              <Input
                v-model:value="condition.conditionName"
                placeholder="请输入条件名称"
                class="flex-1"
              />
            </div>
            <div class="flex flex-1 min-w-[150px] items-center gap-2">
              <label class="shrink-0 text-sm text-gray-600">字段</label>
              <Select
                v-model:value="condition.fieldName"
                :options="fieldOptions"
                class="flex-1"
              />
            </div>
            <div class="flex flex-1 min-w-[100px] items-center gap-2">
              <label class="shrink-0 text-sm text-gray-600">操作符</label>
              <Select
                v-model:value="condition.operator"
                :options="operatorOptions"
                class="flex-1"
              />
            </div>
            <div class="flex flex-1 min-w-[200px] items-center gap-2">
              <label class="shrink-0 text-sm text-gray-600">条件值</label>
              <Input
                v-model:value="condition.conditionValue"
                placeholder="请输入条件值"
                class="flex-1"
              />
            </div>
            <Button danger @click="removeCondition(index)"> 删除 </Button>
          </div>

          <div v-if="condition.conditionType === 'EVAL'" class="mt-4">
            <div class="mb-1 text-sm text-gray-600">表达式</div>
            <Input
              v-model:value="condition.expression"
              placeholder="请输入表达式"
            />
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-3 pt-4">
        <Button @click="handleBack">取消</Button>
        <Button @click="() => { formApiRef.value?.resetForm?.(); conditions = []; }">重置</Button>
        <Button type="primary" @click="() => FormRef.value?.submit()">保存规则</Button>
      </div>
    </a-card>

  </div>
</template>

<style scoped>
.ant-card {
  box-shadow:
    0 1px 2px 0 rgb(0 0 0 / 3%),
    0 1px 6px -1px rgb(0 0 0 / 2%),
    0 2px 4px 0 rgb(0 0 0 / 2%);
}
</style>
