<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Button, Card, Input, Select, Textarea, Tag, Spin, Empty } from 'ant-design-vue';

import { IconifyIcon } from '@vben/icons';

import { useAccessStore } from '@vben/stores';

import { requestClient, baseRequestClient } from '#/api/request';

// HTTP 方法选项
const methodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'PATCH', label: 'PATCH' },
];

// 请求配置
const method = ref<string>('GET');
const url = ref<string>('');
const headers = ref<{ key: string; value: string }[]>([
  { key: 'Content-Type', value: 'application/json' },
]);
const body = ref<string>('');
const bodyType = ref<string>('json');
const params = ref<{ key: string; value: string }[]>([]);

// 当前标签页
const activeTab = ref<string>('headers');

// 响应数据
const loading = ref(false);
const responseStatus = ref<number | null>(null);
const responseHeaders = ref<Record<string, string>>({});
const responseBody = ref<string>('');
const responseTime = ref<number | null>(null);
const error = ref<string>('');

// URL 模板类型
interface UrlTemplate {
  label: string;
  value: string;
  method: string;
  body?: any | null;
  params?: Record<string, string>;
}

// 常用 URL 模板（含示例数据）
const urlTemplates: UrlTemplate[] = [
  {
    label: '规则匹配',
    value: '/rule/match',
    method: 'POST',
    body: {
      transactionId: 'TXN_RULE8_HIT_001',
      timestamp: 1707000000000,
      scene: 'IN_TRANSFER',
      fact: {
        city: 'BJ',
        level: 'VIP',
        age: 35,
        score: 20,
        userStatus: 'NORMAL',
        dayLoginCount: 8,
        openDate: '2025-06-01 10:00:00',
        userId: '10003',
      },
    },
  },
  {
    label: '指标数据推送',
    value: '/metric/admin/process',
    method: 'POST',
    body: {
      "@type": 'org.always.rule.metric.dynamic.entity.Transaction',
      txId: 'TX001',
      userId: 'U1001',
      amount: 150.5,
      type: 'PURCHASE',
      channel: 'SUCCESS',
      txTime: '2026-03-20T10:30:00',
    },
  },
  {
    label: '指标结果查询',
    value: '/metric/admin/query',
    method: 'GET',
    params: {
      metricName: 'TransactionCount',
      dimensionKey: 'SUCCESS',
      windowSize: '1h',
    },
  },
];

// 方法颜色映射
const methodColorMap: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
};

// 是否显示请求体
const showBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(method.value));

// bodyType 选项
const bodyTypeOptions = [
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
];

// 添加请求头
const addHeader = () => {
  headers.value.push({ key: '', value: '' });
};

// 删除请求头
const removeHeader = (index: number) => {
  headers.value.splice(index, 1);
};

// 格式化 JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(body.value);
    body.value = JSON.stringify(parsed, null, 2);
  } catch (e) {
    // 忽略解析错误
  }
};

// 发送请求
const sendRequest = async () => {
  if (!url.value) {
    error.value = '请输入请求 URL';
    return;
  }

  loading.value = true;
  error.value = '';
  responseStatus.value = null;
  responseHeaders.value = {};
  responseBody.value = '';
  responseTime.value = null;

  const startTime = Date.now();

  try {
    // 构建请求头
    const requestHeaders: Record<string, string> = {};
    headers.value.forEach((h) => {
      if (h.key && h.value) {
        requestHeaders[h.key] = h.value;
      }
    });

    // 添加认证头
    const accessStore = useAccessStore();
    if (accessStore.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessStore.accessToken}`;
    }

    // 构建请求配置
    const config: any = {
      method: method.value.toLowerCase(),
      headers: requestHeaders,
    };

    // 添加请求参数（GET 请求）
    if (params.value.length > 0) {
      const queryParams: Record<string, string> = {};
      params.value.forEach((p) => {
        if (p.key && p.value) {
          queryParams[p.key] = p.value;
        }
      });
      config.params = queryParams;
    }

    // 添加请求体
    if (showBody.value && body.value) {
      config.data = bodyType.value === 'json' ? JSON.parse(body.value) : body.value;
    }

    // 使用 baseRequestClient 获取完整响应（包含 code、message、data）
    const response = await baseRequestClient.request(url.value, config);

    // 记录响应
    responseStatus.value = response.status;
    responseHeaders.value = response.headers || {};
    responseBody.value = JSON.stringify(response.data, null, 2);
  } catch (e: any) {
    error.value = e?.message || '请求失败';
    responseStatus.value = e?.response?.status || null;
    if (e?.response?.data) {
      responseBody.value = JSON.stringify(e.response.data, null, 2);
    }
  } finally {
    responseTime.value = Date.now() - startTime;
    loading.value = false;
  }
};

// 清空响应
const clearResponse = () => {
  responseStatus.value = null;
  responseHeaders.value = {};
  responseBody.value = '';
  responseTime.value = null;
  error.value = '';
};

// 应用 URL 模板
const applyTemplate = (template: UrlTemplate) => {
  url.value = template.value;
  method.value = template.method;

  // 如果有示例请求参数，填充到 params
  if (template.params) {
    params.value = Object.entries(template.params).map(([key, value]) => ({ key, value }));
  } else {
    params.value = [];
  }

  // 如果有示例请求体，填充到 body
  if (template.body) {
    body.value = JSON.stringify(template.body, null, 2);
    activeTab.value = 'body';
  } else {
    body.value = '';
    activeTab.value = 'params';
  }
};

// 获取方法标签颜色
const getMethodColor = () => {
  return methodColorMap[method.value] || 'default';
};

// 默认选中"规则匹配"模板
onMounted(() => {
  const matchTemplate = urlTemplates.find((t) => t.label === '规则匹配');
  if (matchTemplate) {
    applyTemplate(matchTemplate);
  }
});
</script>

<template>
  <div class="flex flex-col gap-4 p-4 h-full">
    <!-- 请求配置区域 -->
    <Card title="HTTP 请求测试" :bordered="false" class="flex-shrink-0">
      <!-- 常用模板 -->
      <div class="mb-4">
        <span class="text-gray-500 mr-2">快速选择:</span>
        <Tag
          v-for="template in urlTemplates"
          :key="template.value"
          class="cursor-pointer mb-1"
          @click="applyTemplate(template)"
        >
          {{ template.label }}
        </Tag>
      </div>

      <!-- 请求行 -->
      <div class="flex gap-2 mb-4 items-center">
        <Select
          v-model:value="method"
          :options="methodOptions"
          style="width: 120px"
        />
        <Tag :color="getMethodColor()">{{ method }}</Tag>
        <Input
          v-model:value="url"
          placeholder="请输入请求 URL，如 /rule-package/list"
          class="flex-1"
          @pressEnter="sendRequest"
        />
        <Button type="primary" :loading="loading" @click="sendRequest">
          <IconifyIcon icon="ant-design:send-outlined" class="mr-1" />
          发送
        </Button>
      </div>

      <!-- 标签页切换 -->
      <div class="mb-2">
        <div class="flex gap-4 border-b border-gray-200">
          <div
            :class="['pb-2 cursor-pointer', activeTab === 'params' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500']"
            @click="activeTab = 'params'"
          >
            参数
          </div>
          <div
            :class="['pb-2 cursor-pointer', activeTab === 'headers' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500']"
            @click="activeTab = 'headers'"
          >
            请求头
          </div>
          <div
            :class="['pb-2 cursor-pointer', activeTab === 'body' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500', !showBody ? 'opacity-50 cursor-not-allowed' : '']"
            @click="showBody && (activeTab = 'body')"
          >
            请求体
          </div>
        </div>
      </div>

      <!-- 请求参数内容 -->
      <div v-show="activeTab === 'params'" class="space-y-2">
        <div
          v-for="(param, index) in params"
          :key="index"
          class="flex gap-2 items-center"
        >
          <Input v-model:value="param.key" placeholder="参数名" class="flex-1" />
          <Input v-model:value="param.value" placeholder="参数值" class="flex-1" />
          <Button type="text" danger @click="params.splice(index, 1)">
            <IconifyIcon icon="ant-design:delete-outlined" />
          </Button>
        </div>
        <Button type="dashed" block @click="params.push({ key: '', value: '' })">
          <IconifyIcon icon="ant-design:plus-outlined" class="mr-1" />
          添加参数
        </Button>
      </div>

      <!-- 请求头内容 -->
      <div v-show="activeTab === 'headers'" class="space-y-2">
        <div
          v-for="(header, index) in headers"
          :key="index"
          class="flex gap-2 items-center"
        >
          <Input v-model:value="header.key" placeholder="Header Name" class="flex-1" />
          <Input v-model:value="header.value" placeholder="Header Value" class="flex-1" />
          <Button type="text" danger @click="removeHeader(index)">
            <IconifyIcon icon="ant-design:delete-outlined" />
          </Button>
        </div>
        <Button type="dashed" block @click="addHeader">
          <IconifyIcon icon="ant-design:plus-outlined" class="mr-1" />
          添加请求头
        </Button>
      </div>

      <!-- 请求体内容 -->
      <div v-show="activeTab === 'body' && showBody" class="space-y-2">
        <div class="flex gap-2 mb-2">
          <Select
            v-model:value="bodyType"
            :options="bodyTypeOptions"
            style="width: 120px"
          />
          <Button v-if="bodyType === 'json'" @click="formatJson">格式化 JSON</Button>
        </div>
        <Textarea
          v-model:value="body"
          :placeholder="bodyType === 'json' ? '请输入 JSON 格式的请求体' : '请输入请求体内容'"
          :rows="10"
          class="font-mono"
        />
      </div>
    </Card>

    <!-- 响应区域 -->
    <Card title="响应结果" :bordered="false" class="flex-1 min-h-0">
      <template #extra>
        <div class="flex gap-2 items-center">
          <template v-if="responseStatus !== null">
            <Tag :color="responseStatus >= 200 && responseStatus < 300 ? 'green' : 'red'">
              状态: {{ responseStatus }}
            </Tag>
            <Tag v-if="responseTime !== null" color="blue">
              耗时: {{ responseTime }}ms
            </Tag>
          </template>
          <Button size="small" @click="clearResponse">清空</Button>
        </div>
      </template>

      <Spin :spinning="loading">
        <div v-if="error" class="text-red-500 mb-4">{{ error }}</div>

        <div v-if="responseBody" class="h-full">
          <Textarea
            :value="responseBody"
            :auto-size="{ minRows: 10, maxRows: 25 }"
            read-only
            class="font-mono text-sm"
          />
        </div>

        <Empty v-else-if="!loading" description="发送请求后查看响应结果" />
      </Spin>
    </Card>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>
