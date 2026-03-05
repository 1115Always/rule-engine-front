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
import { getFieldOptions, queryFieldList, type FieldOption } from '#/api/rule/field';
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
  fieldCode: string;
  operator: string;
  conditionValue: string;
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

// 当前规则状态（用于控制只读模式）
const currentRuleStatus = ref<string>('');

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

// 是否只读模式（ACTIVE 状态时为只读）
const isReadonly = computed(() => currentRuleStatus.value === 'ACTIVE');

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

// 可用的条件key列表（按升序排列）
const availableConditionKeys = computed(() =>
  [...conditions.value]
    .sort((a, b) => {
      const numA = parseInt(a.conditionKey.substring(1), 10);
      const numB = parseInt(b.conditionKey.substring(1), 10);
      return numA - numB;
    })
    .map((c) => c.conditionKey),
);

// 按条件代码升序排列的条件列表（用于界面展示）
const sortedConditions = computed(() =>
  [...conditions.value].sort((a, b) => {
    const numA = parseInt(a.conditionKey.substring(1), 10);
    const numB = parseInt(b.conditionKey.substring(1), 10);
    return numA - numB;
  }),
);

// 根据逻辑关系类型自动生成条件关系表达式
const generatedConditionRelation = computed(() => {
  if (conditions.value.length === 0) {
    return '';
  }

  // 按条件代码升序排列
  const conditionKeys = availableConditionKeys.value;

  if (logicRelationType.value === 'ALL_AND') {
    return conditionKeys.join(' && ');
  }

  if (logicRelationType.value === 'ALL_OR') {
    return conditionKeys.join(' || ');
  }

  // 自定义模式：返回用户输入的表达式
  return customExpression.value.trim();
});

// 解析表达式中的所有token
const parseExpressionTokens = (expr: string): string[] => {
  if (!expr) return [];
  // 匹配条件key(c1, c2等)、&&、||、括号
  const tokenRegex = /(c\d+|&&|\|\||\(|\))/g;
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

    if (token === '(') {
      parenCount++;
      if (!expectCondition) {
        return { valid: false, message: '括号前需要操作符(&&/||)' };
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
    } else if (token === '&&' || token === '||') {
      if (expectCondition) {
        return { valid: false, message: `操作符 "${token}" 前缺少条件` };
      }
      expectCondition = true;
    } else {
      // 条件key
      if (!expectCondition) {
        return { valid: false, message: `条件 "${token}" 前缺少操作符(&&/||)` };
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
const quickGenerateTemplate = (type: 'all_and' | 'all_or' | 'custom') => {
  const keys = availableConditionKeys.value;
  if (keys.length === 0) {
    message.warning('请先添加条件');
    return;
  }

  if (type === 'all_and') {
    logicRelationType.value = 'ALL_AND';
    customExpression.value = '';
  } else if (type === 'all_or') {
    logicRelationType.value = 'ALL_OR';
    customExpression.value = '';
  } else if (type === 'custom') {
    logicRelationType.value = 'CUSTOM';
    // 默认生成全且表达式作为基础
    customExpression.value = keys.join(' && ');
  }
};

// 字段选项
const fieldOptions = ref<any[]>([]);

// 字段详细信息（包含优先级）
const fieldDetails = ref<FieldOption[]>([]);

// 字段选项过滤函数（支持label和value的模糊搜索）
const filterFieldOptions = (input: string, option: any) => {
  const inputLower = input.toLowerCase();
  const labelMatch = option.label?.toLowerCase().includes(inputLower);
  const valueMatch = option.value?.toLowerCase().includes(inputLower);
  return labelMatch || valueMatch;
};

// 操作符选项
const operatorOptions = [
  { label: '请选择', value: '' },
  { label: '等于', value: '==' },
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
computed(() => {
  const map = new Map<string, string>();
  actionTypeOptions.value.forEach((item) => {
    map.set(item.value, item.label);
  });
  return map;
});
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
    // 错误提示由全局拦截器统一处理，无需在此重复提示
  }
};

// 获取字段选项
const loadFieldOptions = async (params?: {
  fieldCode?: string;
  fieldName?: string;
}) => {
  try {
    fieldOptions.value = await getFieldOptions(params);
    // 同时加载字段详细信息（包含优先级）
    fieldDetails.value = await queryFieldList(params);
  } catch (error) {
    console.error('获取字段列表失败:', error);
    // 错误提示由全局拦截器统一处理，无需在此重复提示
  }
};

// 获取字段优先级（数字越小优先级越高，默认为10000）
const getFieldPriority = (fieldCode: string): number => {
  const field = fieldDetails.value.find((f) => f.fieldCode === fieldCode);
  return field?.fieldPrior ?? 10000;
};

// ========== 表达式解析和排序相关类型和函数 ==========

// AST 节点类型
interface ASTConditionNode {
  type: 'condition';
  key: string;
}

interface ASTOperatorNode {
  type: 'operator';
  operator: '&&' | '||';
  operands: ASTNode[]; // 支持多个操作数，便于同级别排序
}

interface ASTGroupNode {
  type: 'group';
  child: ASTNode;
}

type ASTNode = ASTConditionNode | ASTOperatorNode | ASTGroupNode;

// 解析表达式为 token 列表
const tokenizeExpression = (expr: string): string[] => {
  if (!expr) return [];
  // 匹配条件key(c1, c2等)、&&、||、括号
  const tokenRegex = /\s*(c\d+|&&|\|\||\(|\))\s*/g;
  const tokens: string[] = [];
  let match;
  while ((match = tokenRegex.exec(expr)) !== null) {
    const token = match[1].trim();
    if (token) {
      tokens.push(token);
    }
  }
  return tokens;
};

// 将 token 列表解析为 AST
const parseTokensToAST = (tokens: string[]): ASTNode => {
  let pos = 0;

  // 解析或表达式 (最低优先级)
  const parseOrExpression = (): ASTNode => {
    const operands: ASTNode[] = [parseAndExpression()];

    while (pos < tokens.length && tokens[pos] === '||') {
      pos++; // 跳过 ||
      operands.push(parseAndExpression());
    }

    if (operands.length === 1) {
      return operands[0];
    }

    return { type: 'operator', operator: '||', operands };
  };

  // 解析与表达式
  const parseAndExpression = (): ASTNode => {
    const operands: ASTNode[] = [parsePrimary()];

    while (pos < tokens.length && tokens[pos] === '&&') {
      pos++; // 跳过 &&
      operands.push(parsePrimary());
    }

    if (operands.length === 1) {
      return operands[0];
    }

    return { type: 'operator', operator: '&&', operands };
  };

  // 解析基本表达式（条件或括号表达式）
  const parsePrimary = (): ASTNode => {
    if (pos >= tokens.length) {
      // 不应该发生，但作为安全措施
      return { type: 'condition', key: 'c0' };
    }

    const token = tokens[pos];

    if (token === '(') {
      pos++; // 跳过 (
      const child = parseOrExpression();
      if (pos < tokens.length && tokens[pos] === ')') {
        pos++; // 跳过 )
      }
      return { type: 'group', child };
    }

    if (token.startsWith('c')) {
      pos++;
      return { type: 'condition', key: token };
    }

    // 不应该到达这里
    pos++;
    return { type: 'condition', key: 'c0' };
  };

  return parseOrExpression();
};

// 获取 AST 节点中所有条件的最高优先级（数字越小优先级越高）
const getHighestPriority = (node: ASTNode): number => {
  switch (node.type) {
    case 'condition': {
      const cond = conditions.value.find((c) => c.conditionKey === node.key);
      return cond ? getFieldPriority(cond.fieldCode) : 10000;
    }
    case 'operator': {
      let minPriority = 10000;
      for (const operand of node.operands) {
        minPriority = Math.min(minPriority, getHighestPriority(operand));
      }
      return minPriority;
    }
    case 'group':
      return getHighestPriority(node.child);
  }
};

// 递归排序 AST 节点
// 排序规则：同级别操作数之间按优先级排序，不改变表达式的嵌套结构
// 规则1：先递归排序所有子节点（内部优先排序）
// 规则2：同级操作数按其内部最高优先级排序（优先级高的排前面）
// 例如：((c1 && c2) || (c3 && c4)) && c5，c1-c5 优先级分别为 5,4,3,2,1
//   - (c1 && c2) 内部排序 -> (c2 && c1)，最高优先级 min(4,5)=4
//   - (c3 && c4) 内部排序 -> (c4 && c3)，最高优先级 min(2,3)=2
//   - 同级 group 比较：(c2 && c1) 和 (c4 && c3) -> (c4 && c3) || (c2 && c1)
//   - 最外层 &&：(c4 && c3) || (c2 && c1) 最高优先级=2，c5 优先级=1
//     c5 优先级更高，结果 -> c5 && ((c4 && c3) || (c2 && c1))
const sortASTNode = (node: ASTNode): ASTNode => {
  switch (node.type) {
    case 'condition':
      // 条件节点无需排序
      return node;

    case 'operator': {
      // 先递归排序所有操作数
      const sortedOperands = node.operands.map((op) => sortASTNode(op));

      // 按操作数的最高优先级排序（优先级数字小的排前面）
      // 无论是 group、condition 还是 operator，统一比较最高优先级
      sortedOperands.sort((a, b) => {
        const priorityA = getHighestPriority(a);
        const priorityB = getHighestPriority(b);
        return priorityA - priorityB;
      });

      return { ...node, operands: sortedOperands };
    }

    case 'group':
      // 递归排序括号内的内容
      return { ...node, child: sortASTNode(node.child) };
  }
};

// 将 AST 转换回表达式字符串
const astToExpression = (node: ASTNode): string => {
  switch (node.type) {
    case 'condition':
      return node.key;

    case 'operator': {
      const op = node.operator;
      const parts = node.operands.map((operand) => astToExpression(operand));
      // 注意：括号由 group 节点控制，这里不自动添加括号
      return parts.join(` ${op} `);
    }

    case 'group':
      return `(${astToExpression(node.child)})`;
  }
};

// 根据字段优先级对条件进行排序（优先级高的往前排）
// 并同步更新表达式中的 conditionKey
const sortConditionsByPriority = () => {
  if (conditions.value.length === 0) {
    return;
  }

  // 获取当前表达式
  const expression = generatedConditionRelation.value;
  if (!expression) {
    // 如果没有表达式（全且/全或模式），按简单排序处理
    sortConditionsSimple();
    return;
  }

  // 解析表达式为 AST
  const tokens = tokenizeExpression(expression);
  if (tokens.length === 0) {
    sortConditionsSimple();
    return;
  }

  const ast = parseTokensToAST(tokens);

  // 递归排序 AST
  const sortedAst = sortASTNode(ast);

  // 从排序后的 AST 重建表达式
  const sortedExpression = astToExpression(sortedAst);

  // 更新自定义表达式
  if (logicRelationType.value === 'CUSTOM') {
    customExpression.value = sortedExpression;
  }

  // 更新条件列表的 sortOrder（基于表达式中的出现顺序）
  updateConditionSortOrder(sortedExpression);
};

// 简单排序（用于全且/全或模式）
// 只改变表达式中的条件顺序，不改变 c1, c2 等与条件信息的对应关系
const sortConditionsSimple = () => {
  // 按字段优先级排序（优先级数字小的在前）
  const sortedConditions = [...conditions.value].sort((a, b) => {
    const priorityA = getFieldPriority(a.fieldCode);
    const priorityB = getFieldPriority(b.fieldCode);
    return priorityA - priorityB;
  });

  // 获取排序后的条件 key 列表
  const sortedKeys = sortedConditions.map((cond) => cond.conditionKey);

  // 更新条件的 sortOrder
  sortedConditions.forEach((cond, index) => {
    const originalCond = conditions.value.find((c) => c.conditionKey === cond.conditionKey);
    if (originalCond) {
      originalCond.sortOrder = index;
    }
  });

  // 根据当前逻辑关系类型生成新的表达式
  const operator = logicRelationType.value === 'ALL_OR' ? '||' : '&&';
  const newExpression = sortedKeys.join(` ${operator} `);

  // 切换到自定义模式并设置新的表达式
  logicRelationType.value = 'CUSTOM';
  customExpression.value = newExpression;
};

// 更新条件的 sortOrder（基于表达式中的出现顺序）
// 注意：不再重新分配 conditionKey，因为排序后的表达式已经是正确的
const updateConditionSortOrder = (expression: string) => {
  // 从表达式中提取条件 key 的出现顺序
  const tokens = tokenizeExpression(expression);
  const keyOrder: string[] = [];
  const seenKeys = new Set<string>();

  for (const token of tokens) {
    if (token.startsWith('c') && !seenKeys.has(token)) {
      keyOrder.push(token);
      seenKeys.add(token);
    }
  }

  // 创建 key 到排序顺序的映射
  const keyToOrder = new Map<string, number>();
  keyOrder.forEach((key, index) => {
    keyToOrder.set(key, index);
  });

  // 更新条件的 sortOrder（不重新分配 conditionKey）
  conditions.value.forEach((cond) => {
    cond.sortOrder = keyToOrder.get(cond.conditionKey) ?? conditions.value.length;
  });
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
    const operators = parts.filter((p) => p === '&&' || p === '||');

    // 检查是否全是 &&
    if (operators.length > 0 && operators.every((op) => op === '&&')) {
      const expectedKeys = conditionKeys.map((_, i) => `c${i + 1}`);
      if (JSON.stringify(conditionKeys) === JSON.stringify(expectedKeys)) {
        return { type: 'ALL_AND' as LogicRelationType };
      }
    }

    // 检查是否全是 ||
    if (operators.length > 0 && operators.every((op) => op === '||')) {
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
    // 保存规则状态（ACTIVE 状态时为只读）
    currentRuleStatus.value = detail.status || '';
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
        fieldCode: item.fieldCode || '',
        operator: item.operator || '',
        conditionValue: item.conditionValue || '',
        sortOrder: item.sortOrder || index,
      }));
    } else {
      conditions.value = [];
    }

    // 解析条件关系表达式，推断逻辑关系类型
    // 特殊情况：如果只有一个条件，默认为全且
    if (conditions.value.length === 1) {
      logicRelationType.value = 'ALL_AND';
      customExpression.value = '';
    } else {
      const parsed = parseConditionRelation(formModel.conditionRelation);
      logicRelationType.value = parsed.type;
      // 如果是自定义模式，设置自定义表达式
      if (parsed.type === 'CUSTOM') {
        customExpression.value = formModel.conditionRelation;
      } else {
        customExpression.value = '';
      }
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
    // 错误提示由全局拦截器统一处理，无需在此重复提示
  } finally {
    loading.value = false;
  }
};

// 执行优先级排序（支持全且、全或、自定义三种模式）
const executePrioritySort = () => {
  if (conditions.value.length === 0) {
    message.warning('请先添加条件');
    return;
  }

  // 检查是否有字段设置了优先级
  const hasPriority = conditions.value.some(
    (cond) => getFieldPriority(cond.fieldCode) < 10000,
  );
  if (!hasPriority) {
    message.warning('所有字段均未设置优先级，无法排序');
    return;
  }

  // 根据逻辑关系类型执行不同的排序逻辑
  if (logicRelationType.value === 'ALL_AND' || logicRelationType.value === 'ALL_OR') {
    // 全且/全或模式：按优先级排序条件列表，然后重新生成表达式
    sortConditionsSimple();
    message.success('优先级排序完成');
  } else {
    // 自定义模式：解析表达式并递归排序
    sortConditionsByPriority();
    message.success('优先级排序完成');
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
  currentRuleStatus.value = '';
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

  // 验证条件必填项
  for (const cond of conditions.value) {
    if (!cond.conditionName?.trim()) {
      message.error(`条件 ${cond.conditionKey} 的条件名称为必填项`);
      throw new Error('条件名称验证失败');
    }
    if (!cond.fieldCode?.trim()) {
      message.error(`条件 ${cond.conditionKey} 的字段为必填项`);
      throw new Error('条件字段验证失败');
    }
    // 如果操作符不为空，则条件值必填
    if (cond.operator?.trim() && !cond.conditionValue?.trim()) {
      message.error(`条件 ${cond.conditionKey} 的操作符已选择，条件值为必填项`);
      throw new Error('条件值验证失败');
    }
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
    status: 'INACTIVE',
    version: 1,
    conditions: conditions.value.map((item) => ({
      conditionKey: item.conditionKey,
      conditionName: item.conditionName || '',
      fieldCode: item.fieldCode || '',
      operator: item.operator || '',
      conditionValue: item.conditionValue || '',
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

  // 验证条件必填项
  for (const cond of conditions.value) {
    if (!cond.conditionName?.trim()) {
      message.error(`条件 ${cond.conditionKey} 的条件名称为必填项`);
      throw new Error('条件名称验证失败');
    }
    if (!cond.fieldCode?.trim()) {
      message.error(`条件 ${cond.conditionKey} 的字段为必填项`);
      throw new Error('条件字段验证失败');
    }
    // 如果操作符不为空，则条件值必填
    if (cond.operator?.trim() && !cond.conditionValue?.trim()) {
      message.error(`条件 ${cond.conditionKey} 的操作符已选择，条件值为必填项`);
      throw new Error('条件值验证失败');
    }
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
      fieldCode: item.fieldCode || '',
      operator: item.operator || '',
      conditionValue: item.conditionValue || '',
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

// 监听只读状态变化，更新表单和Modal
watch(
  () => isReadonly.value,
  (readonly) => {
    // 更新Modal的确认按钮显示
    modalApi.setState({ showConfirmButton: !readonly });

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
  const conditionKey = `c${conditions.value.length + 1}`;
  const newCondition: ConditionItem = {
    id: Date.now().toString(),
    conditionKey,
    conditionName: `条件${conditionKey}`,
    fieldCode: '',
    operator: '',
    conditionValue: '',
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
  // 执行表单验证，validate() 返回 { valid: boolean, errors: ... }
  const { valid } = await formApiRef.value?.validate?.();
  if (!valid) {
    // 验证失败，不执行提交
    return;
  }
  // 验证通过，获取表单值并提交
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

      <!-- 逻辑关系配置 -->
      <div class="mb-6">
        <div class="mb-4 font-medium">逻辑关系</div>
        <div class="rounded-lg border p-4">
          <!-- 快捷模板 -->
          <div class="mb-4">
            <label class="mb-2 block text-sm text-gray-600">快捷模板</label>
            <Space wrap>
              <Button
                size="small"
                :type="logicRelationType === 'ALL_AND' ? 'primary' : 'default'"
                :disabled="isReadonly"
                @click="quickGenerateTemplate('all_and')"
              >
                全且
              </Button>
              <Button
                size="small"
                :type="logicRelationType === 'ALL_OR' ? 'primary' : 'default'"
                :disabled="isReadonly"
                @click="quickGenerateTemplate('all_or')"
              >
                全或
              </Button>
              <Button
                size="small"
                :type="logicRelationType === 'CUSTOM' ? 'primary' : 'default'"
                :disabled="isReadonly"
                @click="quickGenerateTemplate('custom')"
              >
                自定义
              </Button>
              <Button
                v-if="logicRelationType === 'CUSTOM'"
                size="small"
                danger
                :disabled="isReadonly || !customExpression"
                @click="clearExpression"
              >
                清空
              </Button>
              <Button
                v-if="conditions.length > 0 && !isReadonly"
                size="small"
                :disabled="logicRelationType === 'CUSTOM' && !validateCustomLogic().valid"
                @click="executePrioritySort"
              >
                优先级排序
              </Button>
            </Space>
          </div>

          <!-- 全且/全或模式：显示生成的表达式 -->
          <div v-if="logicRelationType !== 'CUSTOM'" class="mb-2">
            <label class="mb-2 block text-sm text-gray-600">生成的表达式</label>
            <div class="rounded bg-gray-50 p-3 font-mono text-sm">
              {{ generatedConditionRelation || '-' }}
            </div>
          </div>

          <!-- 自定义表达式配置 -->
          <div v-else>

            <!-- 表达式输入 -->
            <div class="mb-4">
              <label class="mb-2 block text-sm text-gray-600"
                >表达式输入
                <span class="font-normal text-gray-400"
                  >（支持括号嵌套，如: (c1 && c2) || (c3 && c4)）</span
                ></label
              >
              <Input.TextArea
                ref="expressionInputRef"
                v-model:value="customExpression"
                placeholder="请输入条件关系表达式，如：(c1 && c2) || c3"
                :rows="3"
                :disabled="isReadonly"
                class="font-mono"
              />
            </div>

            <!-- 快捷插入按钮 -->
            <div v-if="conditions.length > 0" class="mb-4">
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
                      @click="insertOperator('&&')"
                    >
                      &&
                    </Tag>
                    <Tag
                      color="orange"
                      style="cursor: pointer"
                      @click="insertOperator('||')"
                    >
                      ||
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
            <div v-if="conditions.length > 0" class="mb-2">
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
            v-for="(condition, index) in sortedConditions"
            :key="condition.id"
            class="mb-4 rounded-lg border p-4"
          >
            <!-- 使用 flex 布局让 label 和 input 在同一行 -->
            <div class="mb-4 flex flex-wrap items-center gap-4">
              <div class="flex min-w-[200px] flex-1 items-center gap-2">
                <label class="shrink-0 text-sm text-gray-600">
                  {{ condition.conditionKey }}
                  <span class="text-red-500">*</span>
                </label>
                <Input
                  v-model:value="condition.conditionName"
                  placeholder="请输入条件名称"
                  class="flex-1"
                  :class="{ 'border-red-500': !condition.conditionName?.trim() && !isReadonly }"
                  :disabled="isReadonly"
                />
              </div>
              <div class="flex min-w-[150px] flex-1 items-center gap-2">
                <label class="shrink-0 text-sm text-gray-600">
                  字段
                  <span class="text-red-500">*</span>
                </label>
                <Select
                  v-model:value="condition.fieldCode"
                  :options="fieldOptions"
                  show-search
                  :filter-option="filterFieldOptions"
                  class="flex-1"
                  :class="{ 'border-red-500': !condition.fieldCode?.trim() && !isReadonly }"
                  :disabled="isReadonly"
                />
              </div>
              <div class="flex min-w-[100px] flex-1 items-center gap-2">
                <label class="shrink-0 text-sm text-gray-600">操作符</label>
                <Select
                  v-model:value="condition.operator"
                  :options="operatorOptions"
                  class="flex-1"
                  allow-clear
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
              <Button v-if="!isReadonly" danger @click="removeCondition(conditions.findIndex(c => c.id === condition.id))">
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
