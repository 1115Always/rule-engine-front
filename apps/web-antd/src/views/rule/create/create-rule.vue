<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Button, Input, message, Select } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

const route = useRoute();
const router = useRouter();

// 从路由参数获取规则包信息
const packageInfo = {
  id: route.query.packageId as string,
  name: route.query.packageName as string,
};

// 表单数据
const formModel = reactive({
  ruleId: '',
  ruleName: '',
  description: '',
  actionType: 'PRINT',
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

// 条件类型选项
const conditionTypeOptions = [
  { label: '精确匹配', value: 'EXACT' },
  { label: '范围匹配', value: 'RANGE' },
  { label: '表达式求值', value: 'EVAL' },
];

// 操作符选项
const operatorOptions = [
  { label: '=', value: '=' },
  { label: '!=', value: '!=' },
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '>=', value: '>=' },
  { label: '<=', value: '<=' },
];

// 表单配置
const [Form] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      fieldName: 'ruleId',
      label: '规则标识',
      component: 'Input',
      componentProps: {
        placeholder: '请输入规则标识（唯一）',
      },
      rules: '请输入规则标识',
    },
    {
      fieldName: 'ruleName',
      label: '规则名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入规则名称',
      },
      rules: '请输入规则名称',
    },
    {
      fieldName: 'description',
      label: '规则描述',
      component: 'Input.TextArea',
      componentProps: {
        placeholder: '请输入规则描述',
        rows: 3,
      },
    },
    {
      fieldName: 'actionType',
      label: '动作类型',
      component: 'Select',
      componentProps: {
        options: [
          { label: '打印', value: 'PRINT' },
          { label: '日志', value: 'LOG' },
          { label: '通知', value: 'NOTIFY' },
        ],
      },
      rules: '请选择动作类型',
    },
    {
      fieldName: 'actionParam',
      label: '动作参数',
      component: 'Input.TextArea',
      componentProps: {
        placeholder: '请输入动作参数（JSON格式）',
        rows: 3,
      },
      rules: '请输入动作参数',
    },
    {
      fieldName: 'conditionRelation',
      label: '条件关系表达式',
      component: 'Input',
      componentProps: {
        placeholder: '如：c1 AND c2 OR c3',
      },
    },
  ],
});

// 条件列表
const conditions = ref<ConditionItem[]>([]);

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

// 返回上一页
const handleBack = () => {
  router.back();
};

// 保存规则
const handleSave = async () => {
  try {
    // 验证表单
    await Form.value.validate();

    // 验证条件
    if (conditions.value.length === 0) {
      message.error('请至少添加一个条件');
      return;
    }

    // 构建请求数据
    const requestData = {
      ...formModel,
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
    } catch (apiError) {
      message.error('规则创建失败，请稍后重试');
      throw apiError;
    }

    // 返回规则包管理页面
    router.back();
  } catch (error) {
    console.error('创建规则失败:', error);
    message.error('创建规则失败，请检查输入信息');
  }
};
</script>

<template>
  <div class="p-4">
    <!-- 返回按钮 -->
    <div class="mb-4">
      <Button @click="handleBack" type="primary">返回</Button>
    </div>

    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold">新建规则</h1>
      <div class="mt-2 text-sm text-gray-600">
        规则包：{{ packageInfo.name || '未知' }} (ID:
        {{ packageInfo.id || '-' }})
      </div>
    </div>

    <!-- 规则基本信息 -->
    <a-card title="规则基本信息" class="mb-6">
      <Form />
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
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">{{
                condition.conditionKey
              }}</span>
              <Input
                v-model:value="condition.conditionName"
                placeholder="请输入条件名称"
                style="width: 200px"
              />
            </div>
            <Button
              danger
              @click="removeCondition(index)"
              v-if="conditions.length > 1"
            >
              删除
            </Button>
          </div>

          <div class="grid grid-cols-4 gap-4">
            <div class="flex flex-col">
              <div class="mb-1 text-sm text-gray-600">条件类型</div>
              <Select
                v-model:value="condition.conditionType"
                :options="conditionTypeOptions"
                style="width: 100%"
              />
            </div>
            <div class="flex flex-col">
              <div class="mb-1 text-sm text-gray-600">字段名</div>
              <Input
                v-model:value="condition.fieldName"
                placeholder="请输入字段名"
              />
            </div>
            <div class="flex flex-col">
              <div class="mb-1 text-sm text-gray-600">操作符</div>
              <Select
                v-model:value="condition.operator"
                :options="operatorOptions"
                style="width: 100%"
              />
            </div>
            <div class="flex flex-col">
              <div class="mb-1 text-sm text-gray-600">条件值</div>
              <Input
                v-model:value="condition.conditionValue"
                placeholder="请输入条件值"
              />
            </div>
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
    </a-card>

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-3">
      <Button @click="handleBack">取消</Button>
      <Button type="primary" @click="handleSave">保存规则</Button>
    </div>
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
