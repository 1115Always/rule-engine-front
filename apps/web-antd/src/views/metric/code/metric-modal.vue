<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  RadioButton,
  RadioGroup,
  Select,
  SelectOption,
} from 'ant-design-vue';

import {
  createMetricApi,
  type FilterCondition,
  type FilterRules,
  type MetricCode,
  listEntitiesApi,
  OPERATOR_LABELS,
  OPERATORS_BY_KIND,
  parseFieldSchema,
  updateMetricApi,
} from '#/api/rule/metric';

type ModalMode = 'create' | 'edit' | 'view';
type FilterMode = 'builder' | 'expression';

const emit = defineEmits<{
  success: [];
}>();

const AGG_TYPES = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'LAST', 'LIST', 'SET'];
/** 需要 valueExpr 的聚合类型（LIST/SET 也需要，后端的 SET 同样取 value） */
const NEEDS_VALUE = new Set(['SUM', 'AVG', 'MAX', 'MIN', 'LAST', 'LIST', 'SET']);

const modalMode = ref<ModalMode>('create');
const currentId = ref<string>('');
const filterMode = ref<FilterMode>('builder');
const entityList = ref<Array<{ entityCode: string; entityName: string; fieldSchema: string }>>([]);

const formModel = reactive({
  metricName: '',
  entityCode: undefined as string | undefined,
  dimensionExpr: '',
  aggType: 'COUNT',
  valueExpr: '',
  timeWindow: '1d',
  maxSize: '' as string,
  filterExpr: '',
  filterLogic: 'AND' as 'AND' | 'OR',
  conditions: [] as FilterCondition[],
  enabled: 1,
});

const isView = computed(() => modalMode.value === 'view');
const currentFields = computed(() => {
  const entity = entityList.value.find((item) => item.entityCode === formModel.entityCode);
  return parseFieldSchema(entity?.fieldSchema);
});

/** 字段类型 → 操作符分组，与后端白名单保持一致 */
function fieldKindOf(fieldName: string): 'boolean' | 'number' | 'string' {
  const field = currentFields.value.find((item) => item.fieldName === fieldName);
  const type = (field?.fieldType ?? '').trim().toLowerCase();
  if (type === 'boolean' || type === 'bool') {
    return 'boolean';
  }
  if (
    [
      'int',
      'integer',
      'long',
      'short',
      'byte',
      'double',
      'float',
      'bigdecimal',
      'biginteger',
    ].includes(type)
  ) {
    return 'number';
  }
  return 'string';
}

function operatorsOf(fieldName: string): string[] {
  if (!fieldName) {
    return OPERATORS_BY_KIND.string ?? [];
  }
  return OPERATORS_BY_KIND[fieldKindOf(fieldName)] ?? [];
}

function addCondition() {
  formModel.conditions.push({ field: '', op: '', value: '' });
}

function removeCondition(index: number) {
  formModel.conditions.splice(index, 1);
}

/** 换字段后，原操作符可能对新字段类型不合法 */
function onFieldChange(condition: FilterCondition) {
  const options = operatorsOf(condition.field);
  if (!options.includes(condition.op)) {
    condition.op = options[0] ?? '';
  }
  condition.value = '';
}

async function loadEntities() {
  if (entityList.value.length > 0) {
    return;
  }
  try {
    entityList.value = await listEntitiesApi();
  } catch (error) {
    console.error('加载实体列表失败:', error);
  }
}

/** 解析回填用的结构化条件，失败时返回 null 由调用方落到表达式模式 */
function parseRules(json: string): FilterRules | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed && Array.isArray(parsed.conditions)) {
      return {
        logic: parsed.logic === 'OR' ? 'OR' : 'AND',
        conditions: (parsed.conditions as Array<Record<string, unknown>>).map((item) => ({
          field: String(item?.field ?? ''),
          op: String(item?.op ?? ''),
          value:
            item?.value === null || item?.value === undefined
              ? ''
              : String(item.value),
        })),
      };
    }
  } catch {
    // 落回表达式模式
  }
  return null;
}

function validateForm(): null | string {
  if (!formModel.metricName.trim()) {
    return '请输入指标名称';
  }
  if (!formModel.entityCode) {
    return '请选择实体';
  }
  if (!formModel.dimensionExpr.trim()) {
    return '请输入维度表达式，如 city';
  }
  if (!formModel.timeWindow.trim()) {
    return '请输入存储窗口，如 1d、1h、90d';
  }
  if (NEEDS_VALUE.has(formModel.aggType) && !formModel.valueExpr.trim()) {
    return `聚合类型 ${formModel.aggType} 需要填写取值表达式，如 amount`;
  }
  if (formModel.aggType === 'LIST' && !formModel.maxSize) {
    return 'LIST 聚合需要填写条数上限';
  }

  if (filterMode.value === 'builder') {
    for (const [index, condition] of formModel.conditions.entries()) {
      if (!condition.field) {
        return `第 ${index + 1} 个条件未选择字段`;
      }
      if (!condition.op) {
        return `第 ${index + 1} 个条件未选择操作符`;
      }
      if (condition.value === '' || condition.value === undefined) {
        return `第 ${index + 1} 个条件未填写值`;
      }
    }
  } else if (formModel.filterExpr.length > 512) {
    return '过滤表达式不能超过 512 个字符';
  }
  return null;
}

const [Modal, modalApi] = useVbenModal({
  title: '新增指标',
  // 条件构建器单行需要约 544px，默认宽度会把最后一列挤出可视区
  class: 'w-[860px] max-w-[95vw]',
  async onConfirm() {
    const error = validateForm();
    if (error) {
      message.warning(error);
      return;
    }

    const payload: Partial<MetricCode> = {
      metricName: formModel.metricName.trim(),
      entityCode: formModel.entityCode,
      dimensionExpr: formModel.dimensionExpr.trim(),
      aggType: formModel.aggType,
      timeWindow: formModel.timeWindow.trim(),
      enabled: formModel.enabled,
    };
    if (NEEDS_VALUE.has(formModel.aggType)) {
      payload.valueExpr = formModel.valueExpr.trim();
    }
    if (formModel.aggType === 'LIST') {
      payload.maxSize = Number(formModel.maxSize);
    }

    if (filterMode.value === 'builder') {
      // 提交结构化条件，由后端拼成 filter_expr；空数组表示清空过滤
      payload.filterRules = JSON.stringify({
        logic: formModel.filterLogic,
        conditions: formModel.conditions.map((item) => ({
          field: item.field,
          op: item.op,
          value: item.value,
        })),
      });
    } else {
      // 不提交 filterRules，后端会把 filter_rules 置空并按手写表达式落库
      payload.filterExpr = formModel.filterExpr.trim();
    }

    try {
      if (modalMode.value === 'create') {
        await createMetricApi(payload);
        message.success('指标创建成功');
      } else {
        await updateMetricApi(currentId.value, payload);
        message.success('指标更新成功，状态已重置为开发中');
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
  formModel.entityCode = undefined;
  formModel.dimensionExpr = '';
  formModel.aggType = 'COUNT';
  formModel.valueExpr = '';
  formModel.timeWindow = '1d';
  formModel.maxSize = '';
  formModel.filterExpr = '';
  formModel.filterLogic = 'AND';
  formModel.conditions = [];
  formModel.enabled = 1;
  filterMode.value = 'builder';
};

defineExpose({
  open: async (mode: ModalMode, record?: MetricCode) => {
    resetForm();
    modalMode.value = mode;
    await loadEntities();

    if ((mode === 'edit' || mode === 'view') && record) {
      currentId.value = record.id;
      formModel.metricName = record.metricName;
      formModel.entityCode = record.entityCode;
      formModel.dimensionExpr = record.dimensionExpr ?? '';
      formModel.aggType = record.aggType ?? 'COUNT';
      formModel.valueExpr = record.valueExpr ?? '';
      formModel.timeWindow = record.timeWindow ?? '1d';
      formModel.maxSize = record.maxSize === undefined ? '' : String(record.maxSize);
      formModel.enabled = record.enabled;

      // 有结构化条件就回填构建器，否则落到表达式模式（存量手写指标走这条）
      const rules = record.filterRules ? parseRules(record.filterRules) : null;
      if (rules) {
        filterMode.value = 'builder';
        formModel.filterLogic = rules.logic;
        formModel.conditions = rules.conditions;
      } else {
        filterMode.value = 'expression';
        formModel.filterExpr = record.filterExpr ?? '';
      }
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
  <Modal :show-confirm-button="!isView">
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
          placeholder="请输入指标名称，如 各城市交易笔数统计"
        />
      </FormItem>

      <FormItem label="实体" name="entityCode" required>
        <Select
          v-model:value="formModel.entityCode"
          :disabled="isView"
          placeholder="请选择指标所属实体"
        >
          <SelectOption
            v-for="entity in entityList"
            :key="entity.entityCode"
            :value="entity.entityCode"
          >
            {{ entity.entityName }}（{{ entity.entityCode }}）
          </SelectOption>
        </Select>
      </FormItem>

      <FormItem label="维度表达式" name="dimensionExpr" required>
        <Input
          v-model:value="formModel.dimensionExpr"
          :disabled="isView"
          placeholder="统计维度，如 city、userId"
        />
      </FormItem>

      <FormItem label="聚合类型" name="aggType" required>
        <Select v-model:value="formModel.aggType" :disabled="isView">
          <SelectOption v-for="type in AGG_TYPES" :key="type" :value="type">
            {{ type }}
          </SelectOption>
        </Select>
      </FormItem>

      <FormItem v-if="NEEDS_VALUE.has(formModel.aggType)" label="取值表达式" required>
        <Input
          v-model:value="formModel.valueExpr"
          :disabled="isView"
          placeholder="聚合取值，如 amount、amount * 0.01"
        />
      </FormItem>

      <FormItem v-if="formModel.aggType === 'LIST'" label="条数上限" required>
        <Input
          v-model:value="formModel.maxSize"
          :disabled="isView"
          placeholder="正整数，如 100"
          type="number"
        />
      </FormItem>

      <FormItem label="存储窗口" name="timeWindow" required>
        <Input
          v-model:value="formModel.timeWindow"
          :disabled="isView"
          placeholder="数字+单位，如 1d、1h、90d"
        />
      </FormItem>

      <FormItem label="过滤条件">
        <div class="filter-head">
          <RadioGroup v-model:value="filterMode" :disabled="isView">
            <RadioButton value="builder">条件构建</RadioButton>
            <RadioButton value="expression">手写表达式</RadioButton>
          </RadioGroup>
        </div>

        <template v-if="filterMode === 'builder'">
          <div class="filter-toolbar">
            <span>条件之间</span>
            <Select
              v-model:value="formModel.filterLogic"
              :disabled="isView"
              size="small"
              style="width: 150px"
            >
              <SelectOption value="AND">全部满足（且）</SelectOption>
              <SelectOption value="OR">满足任一（或）</SelectOption>
            </Select>
            <Button
              v-if="!isView"
              size="small"
              type="link"
              @click="addCondition"
            >
              + 添加条件
            </Button>
          </div>

          <!-- 条件行用原生 div：行高与间距完全受控。不用 antd Space，
               它的 display/行高样式会与 scoped 样式竞争，多个条件时上下行重叠 -->
          <div
            v-for="(condition, index) in formModel.conditions"
            :key="index"
            class="condition-row"
          >
            <Select
              v-model:value="condition.field"
              :disabled="isView"
              placeholder="字段"
              size="small"
              style="width: 170px"
              @change="onFieldChange(condition)"
            >
              <SelectOption
                v-for="field in currentFields"
                :key="field.fieldName"
                :value="field.fieldName"
              >
                {{ field.cnName || field.fieldName }}（{{ field.fieldName }}）
              </SelectOption>
            </Select>

            <Select
              v-model:value="condition.op"
              :disabled="isView"
              placeholder="操作符"
              size="small"
              style="width: 120px"
            >
              <SelectOption
                v-for="op in operatorsOf(condition.field)"
                :key="op"
                :value="op"
              >
                {{ OPERATOR_LABELS[op] }}
              </SelectOption>
            </Select>

            <Select
              v-if="fieldKindOf(condition.field) === 'boolean'"
              v-model:value="condition.value"
              :disabled="isView"
              placeholder="值"
              size="small"
              style="width: 110px"
            >
              <SelectOption value="true">是</SelectOption>
              <SelectOption value="false">否</SelectOption>
            </Select>
            <Input
              v-else
              v-model:value="condition.value"
              :disabled="isView"
              :placeholder="
                fieldKindOf(condition.field) === 'number' ? '数值' : '文本'
              "
              size="small"
              style="width: 180px"
            />

            <Button
              v-if="!isView"
              danger
              size="small"
              type="link"
              @click="removeCondition(index)"
            >
              删除
            </Button>
          </div>

          <div v-if="formModel.conditions.length === 0" class="filter-hint">
            未添加条件表示不过滤
          </div>
          <div v-else class="filter-hint">
            保存时由后台拼成表达式；未选择实体的字段无法下拉
          </div>
        </template>

        <template v-else>
          <Input.TextArea
            v-model:value="formModel.filterExpr"
            :disabled="isView"
            :maxlength="512"
            :rows="3"
            placeholder="Aviator 表达式，如 isNum(amount) && amount > 10000"
            style="font-family: monospace"
          />
          <div class="filter-hint">
            手写表达式不会生成结构化条件，下次打开仍停在手写模式
          </div>
        </template>
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.filter-head {
  margin-bottom: 8px;
}

.filter-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.condition-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.filter-hint {
  color: rgb(0 0 0 / 45%);
  font-size: 12px;
}
</style>
