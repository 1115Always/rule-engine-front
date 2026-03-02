<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getActionOptions } from "#/api/rule/action";
import { deleteRuleApi, getRulesApi, updateRuleStatusApi } from "#/api/rule/rule";
import { getSceneOptionsApi } from "#/api/rule/scene";

const emit = defineEmits<{
  edit: [record: any];
  search?: [params: { ruleName?: string; packageName?: string; sceneCode?: string }];
}>();

const props = defineProps<{
  packageName?: string;
  ruleName?: string;
  sceneCode?: string;
  showSearch?: boolean;
}>();

const route = useRoute();

// 内部查询参数
const searchParams = ref({
  ruleName: '',
  packageName: '',
  sceneCode: '',
});

// 从props或路由参数获取规则包名称
const packageInfo = computed(() => ({
  name: props.packageName || (route.query.packageName as string) || '',
}));

//表格列定义
const columns = [
  {
    title: '规则名称',
    dataIndex: 'ruleName',
    key: 'ruleName',
    width: 200,
  },
  {
    title: '规则包',
    dataIndex: 'packageName',
    key: 'packageName',
    width: 120,
  },
  {
    title: '动作类型',
    dataIndex: 'actionType',
    key: 'actionType',
    width: 120,
  },

  {
    title: '规则描述',
    dataIndex: 'description',
    key: 'description',
    width: 200,
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 144,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 144,
  },
  {
    title: '操作',
    key: 'action',
    width: 240,
  },
];

// 数据源
const dataSource = ref<any[]>([]);
const ruleListResponse = ref<any>(null);

// 动作类型选项映射（用于翻译）
const actionTypeMap = ref<Map<string, string>>(new Map());

// 场景选项
const sceneOptions = ref<Array<{ label: string; value: string }>>([]);

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 加载状态
const loading = ref(false);

// 分页变化处理
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  loadData();
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const response = await getRulesApi({
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
      packageName: searchParams.value.packageName || packageInfo.value.name || undefined,
      ruleName: searchParams.value.ruleName || undefined,
      sceneCode: searchParams.value.sceneCode || undefined,
    });

    ruleListResponse.value = response;
    dataSource.value = response.records;
    pagination.value.total = response.total;
    pagination.value.current = response.current;
    pagination.value.pageSize = response.size;
  } catch (error) {
    console.error('获取规则列表失败:', error);
    // 错误提示由全局拦截器统一处理，无需在此重复提示
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.value.current = 1;
  loadData();
};

// 重置搜索
const handleReset = () => {
  searchParams.value = {
    ruleName: '',
    packageName: '',
    sceneCode: '',
  };
  pagination.value.current = 1;
  loadData();
};

// 编辑规则（点击查看也进入编辑模式）
const handleEdit = (record: any) => {
  emit('edit', record);
};

// 删除规则
const handleDelete = (record: any) => {
  // 校验：ACTIVE 状态不允许删除
  if (record.status === 'ACTIVE') {
    message.warning('规则处于上线状态，请先下线后再删除');
    return;
  }

  Modal.confirm({
    title: '确认删除',
    content: `确定要删除规则"${record.ruleName}"吗？`,
    onOk: async () => {
      try {
        await deleteRuleApi(record.id);
        message.success('删除成功');
        // 删除成功后刷新列表
        loadData();
      } catch (error) {
        console.error('删除规则失败:', error);
        // 错误提示由全局拦截器统一处理，无需在此重复提示
      }
    },
  });
};

// 切换规则状态（上线/下线）
const handleToggleStatus = async (record: any) => {
  const isActive = record.status === 'ACTIVE';
  const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
  const actionText = isActive ? '下线' : '上线';

  try {
    await updateRuleStatusApi(record.id, newStatus);
    message.success(`${actionText}成功`);
    // 刷新列表
    loadData();
  } catch (error) {
    console.error(`${actionText}失败:`, error);
    // 错误提示由全局拦截器统一处理，无需在此重复提示
  }
};

// 格式化日期时间
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return '-';
  // 兼容 ISO 8601 格式 (2026-02-27T13:46:35.713492) 和带微秒的格式
  return dateTimeStr.replace('T', ' ').replace(/\.\d+$/, '');
};

// 加载动作类型选项
const loadActionOptions = async () => {
  try {
    const options = await getActionOptions();
    const map = new Map<string, string>();
    options.forEach((item) => {
      map.set(item.value, item.label);
    });
    actionTypeMap.value = map;
  } catch (error) {
    console.error('获取动作类型选项失败:', error);
  }
};

// 加载场景选项
const loadSceneOptions = async () => {
  try {
    sceneOptions.value = await getSceneOptionsApi();
  } catch (error) {
    console.error('获取场景选项失败:', error);
  }
};

// 获取动作类型的中文标签
const getActionTypeLabel = (actionTypeValue: string) => {
  if (!actionTypeValue) return [];
  // 支持逗号分隔的多个动作类型
  const values = actionTypeValue.split(',');
  return values.map((val) => actionTypeMap.value.get(val) || val);
};

// 获取展示的动作类型（最多3个）
const getDisplayActionTypes = (actionTypeValue: string) => {
  const labels = getActionTypeLabel(actionTypeValue);
  return labels.slice(0, 3);
};

// 获取剩余的动作类型（用于tooltip）
const getRemainingActionTypes = (actionTypeValue: string) => {
  const labels = getActionTypeLabel(actionTypeValue);
  return labels.slice(3);
};

//组件挂载时加载数据
onMounted(() => {
  loadActionOptions();
  loadSceneOptions();
  loadData();
});

// 对外暴露方法
defineExpose({
  loadData,
});
</script>

<template>
  <Card title="规则列表">
    <!-- 搜索区域 -->
    <div v-if="showSearch !== false" class="mb-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">规则名称:</span>
        <input
          v-model="searchParams.ruleName"
          type="text"
          placeholder="请输入规则名称"
          class="h-8 w-40 rounded border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">规则包:</span>
        <input
          v-model="searchParams.packageName"
          type="text"
          placeholder="请输入规则包名称"
          class="h-8 w-40 rounded border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">场景:</span>
        <Select
          v-model:value="searchParams.sceneCode"
          :options="sceneOptions"
          placeholder="请选择场景"
          allow-clear
          show-search
          :filter-option="(input: string, option: any) => option.label.toLowerCase().includes(input.toLowerCase())"
          style="width: 160px"
        />
      </div>
      <div class="flex gap-2">
        <Button type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">
          重置
        </Button>
      </div>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :pagination="pagination"
      :loading="loading"
      :scroll="{ x: 1400 }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'createdAt'">
          {{ formatDateTime(record.createdAt) }}
        </template>
        <template v-else-if="column.key === 'updatedAt'">
          {{ formatDateTime(record.updatedAt) }}
        </template>
        <template v-else-if="column.key === 'ruleName'">
          <Button type="link" size="small" @click="handleEdit(record)">
            {{ record.ruleName }}
          </Button>
        </template>
        <template v-else-if="column.key === 'packageName'">
          <Tag color="green">{{ record.packageName }}</Tag>
        </template>
        <template v-else-if="column.key === 'actionType'">
          <Space :size="4">
            <Tag
              v-for="(label, index) in getDisplayActionTypes(record.actionType)"
              :key="index"
              color="blue"
            >
              {{ label }}
            </Tag>
            <Tooltip
              v-if="getRemainingActionTypes(record.actionType).length > 0"
              :title="getRemainingActionTypes(record.actionType).join(', ')"
            >
              <Tag color="blue">+{{ getRemainingActionTypes(record.actionType).length }}</Tag>
            </Tooltip>
          </Space>
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button
              v-if="record.status === 'ACTIVE'"
              type="primary"
              danger
              size="small"
              @click="handleToggleStatus(record)"
            >
              <IconifyIcon icon="ant-design:arrow-down-outlined" />
              下线
            </Button>
            <Button
              v-else
              type="primary"
              size="small"
              @click="handleToggleStatus(record)"
            >
              <IconifyIcon icon="ant-design:arrow-up-outlined" />
              上线
            </Button>
            <Button
              type="primary"
              danger
              size="small"
              @click="handleDelete(record)"
            >
              <IconifyIcon icon="ant-design:delete-outlined" />
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>
  </Card>
</template>
