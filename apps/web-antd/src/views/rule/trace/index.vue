<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { Button, Card, Col, Descriptions, DescriptionsItem, Input, message, Row, Select, Space, Spin, Table, Tag } from 'ant-design-vue';

import { getRulePackagesApi } from '#/api/rule/rule-package';
import { getRulesByPackageApi, traceRuleApi } from '#/api/rule/rule';

// 查询参数
const transactionId = ref('');
const selectedPackageId = ref<string | undefined>(undefined);
const selectedRuleId = ref<string | undefined>(undefined);
const loading = ref(false);

// 规则包和规则列表
const packageList = ref<any[]>([]);
const ruleList = ref<any[]>([]);
const packageLoading = ref(false);
const ruleLoading = ref(false);

// 回溯结果
const traceResult = ref<any>(null);
const originalFact = ref<Record<string, any>>({});
const mergedFact = ref<Record<string, Object>>({});

// 条件表格列定义
const conditionColumns = [
  {
    title: '条件Key',
    dataIndex: 'conditionKey',
    key: 'conditionKey',
    width: 80,
  },
  {
    title: '条件名称',
    dataIndex: 'conditionName',
    key: 'conditionName',
    width: 120,
  },
  {
    title: '条件表达式',
    dataIndex: 'expression',
    key: 'expression',
    width: 200,
  },
  {
    title: '计算结果',
    dataIndex: 'computedExpression',
    key: 'computedExpression',
    width: 150,
  },
  {
    title: '是否命中',
    dataIndex: 'matched',
    key: 'matched',
    width: 80,
  },
];

// Fact差异（合并后新增的字段）
computed(() => {
  const original = originalFact.value || {};
  const merged = mergedFact.value || {};
  const diff: { key: string; original: any; merged: any; isNew: boolean }[] = [];

  const allKeys = new Set([...Object.keys(original), ...Object.keys(merged)]);
  allKeys.forEach((key) => {
    const originalValue = original[key];
    const mergedValue = merged[key];
    const isNew = !(key in original);

    if (isNew || JSON.stringify(originalValue) !== JSON.stringify(mergedValue)) {
      diff.push({
        key,
        original: originalValue,
        merged: mergedValue,
        isNew,
      });
    }
  });

  return diff;
});
// 加载规则包列表
const loadPackageList = async () => {
  packageLoading.value = true;
  try {
    const response = await getRulePackagesApi({ pageSize: 100 });
    packageList.value = response || [];
  } catch (error) {
    console.error('加载规则包列表失败:', error);
  } finally {
    packageLoading.value = false;
  }
};

// 当选择规则包时，加载对应的规则列表
watch(selectedPackageId, async (newPackageId) => {
  if (newPackageId) {
    ruleLoading.value = true;
    selectedRuleId.value = undefined;
    ruleList.value = [];
    try {
      const response = await getRulesByPackageApi(newPackageId);
      ruleList.value = response || [];
    } catch (error) {
      console.error('加载规则列表失败:', error);
    } finally {
      ruleLoading.value = false;
    }
  } else {
    ruleList.value = [];
    selectedRuleId.value = undefined;
  }
});

// 执行规则回溯
const handleTrace = async () => {
  if (!transactionId.value.trim()) {
    message.warning('请输入流水号');
    return;
  }

  if (!selectedRuleId.value) {
    message.warning('请选择要回溯的规则');
    return;
  }

  loading.value = true;
  traceResult.value = null;

  try {
    // 响应格式: { originalFact, mergedFact, traceResult }
    const response = await traceRuleApi({
      transactionId: transactionId.value.trim(),
      ruleId: Number(selectedRuleId.value),
    });

    if (response) {
      traceResult.value = response.traceResult;
      originalFact.value = response.originalFact || {};
      mergedFact.value = response.mergedFact || {};
      message.success('回溯成功');
    } else {
      console.error('回溯失败: 响应为空');
    }
  } catch (error: any) {
    console.error('规则回溯失败:', error);
  } finally {
    loading.value = false;
  }
};

// 清空结果
const handleClear = () => {
  transactionId.value = '';
  selectedPackageId.value = undefined;
  selectedRuleId.value = undefined;
  traceResult.value = null;
  originalFact.value = {};
  mergedFact.value = {};
};

// 初始化加载规则包列表
onMounted(() => {
  loadPackageList();
});
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <!-- 操作区域 -->
    <Card title="规则回溯" size="small">
      <Row :gutter="16">
        <Col :span="6">
          <div class="flex items-center gap-2">
            <span class="text-nowrap">流水号:</span>
            <Input
              v-model:value="transactionId"
              placeholder="请输入match接口流水号"
              allow-clear
            />
          </div>
        </Col>
        <Col :span="6">
          <div class="flex items-center gap-2">
            <span class="text-nowrap">规则包:</span>
            <Select
              v-model:value="selectedPackageId"
              :loading="packageLoading"
              :options="packageList.map((p: any) => ({ value: String(p.id), label: p.name }))"
              placeholder="请选择规则包"
              allow-clear
              class="w-full"
            />
          </div>
        </Col>
        <Col :span="6">
          <div class="flex items-center gap-2">
            <span class="text-nowrap">规则:</span>
            <Select
              v-model:value="selectedRuleId"
              :loading="ruleLoading"
              :options="ruleList.map((r: any) => ({ value: String(r.id), label: r.ruleName }))"
              placeholder="请选择规则"
              allow-clear
              class="w-full"
              :disabled="!selectedPackageId"
            />
          </div>
        </Col>
        <Col :span="6">
          <Space>
            <Button type="primary" :loading="loading" @click="handleTrace">
              开始回溯
            </Button>
            <Button @click="handleClear">清空</Button>
          </Space>
        </Col>
      </Row>
    </Card>

    <!-- 回溯结果 -->
    <Spin :spinning="loading">
      <template v-if="traceResult">
        <!-- Fact数据展示 -->
        <Card title="Fact数据" size="small" class="mb-4">
          <Row :gutter="16">
            <Col :span="12">
              <Card size="small" title="原始Fact" class="h-full">
                <Descriptions :column="1" size="small">
                  <DescriptionsItem
                    v-for="(value, key) in originalFact"
                    :key="key"
                    :label="String(key)"
                  >
                    {{ JSON.stringify(value) }}
                  </DescriptionsItem>
                </Descriptions>
              </Card>
            </Col>
            <Col :span="12">
              <Card size="small" title="合并后Fact（含函数调用结果）" class="h-full">
                <Descriptions :column="1" size="small">
                  <DescriptionsItem
                    v-for="(value, key) in mergedFact"
                    :key="key"
                    :label="String(key)"
                  >
                    <Space>
                      {{ JSON.stringify(value) }}
                      <Tag v-if="!(key in originalFact)" color="green">新增</Tag>
                    </Space>
                  </DescriptionsItem>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Card>

        <!-- 条件评估结果 -->
        <Card title="规则回溯结果" size="small">
          <div class="mb-4">
            <Space>
              <span class="font-medium">规则名称: {{ traceResult.ruleName }}</span>
              <Tag :color="traceResult.matched ? 'success' : 'error'">
                {{ traceResult.matched ? '命中' : '未命中' }}
              </Tag>
            </Space>
          </div>

          <div v-if="traceResult.conditionRelation" class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <span class="font-medium text-gray-600 dark:text-gray-300">条件关系: </span>
            <code class="ml-2 px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm">{{ traceResult.conditionRelation }}</code>
          </div>

          <Table
            :columns="conditionColumns"
            :data-source="traceResult.conditions"
            :pagination="false"
            size="small"
            :row-key="(record: any, idx: number) => `condition-${idx}`"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'matched'">
                <Tag :color="record.matched ? 'success' : 'error'">
                  {{ record.matched ? '命中' : '未命中' }}
                </Tag>
              </template>
              <template v-else-if="column.dataIndex === 'computedExpression'">
                <span>{{ record.computedExpression || '-' }}</span>
              </template>
            </template>
          </Table>

          <div v-if="traceResult.conditions?.some((c: any) => c.remark)" class="mt-4 text-gray-500 text-sm">
            <strong>备注:</strong>
            <ul class="list-disc list-inside">
              <li v-for="(c, i) in traceResult.conditions" :key="i">
                <template v-if="c.remark">
                  {{ c.conditionName }}: {{ c.remark }}
                </template>
              </li>
            </ul>
          </div>
        </Card>
      </template>

      <Card v-else size="small" class="text-center text-gray-400 py-16">
        请输入流水号并选择规则后点击"开始回溯"
      </Card>
    </Spin>
  </div>
</template>

<style scoped>
.w-full {
  width: 100%;
}
.h-full {
  height: 100%;
}
</style>
