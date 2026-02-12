<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { Button, Card, Space } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();

// 从路由参数获取规则包信息
const packageInfo = computed(() => ({
  id: route.query.packageId as string,
  name: route.query.packageName as string,
}));

const handleBack = () => {
  router.back();
};

const handleAddRule = () => {
  router.push({
    name: 'CreateRule',
    query: {
      packageId: packageInfo.value.id,
      packageName: packageInfo.value.name,
    },
  });
};
</script>

<template>
  <Card>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button @click="handleBack">返回</Button>
        <div>
          <h2 class="text-xl font-semibold">
            {{ packageInfo.name || '规则包' }}
          </h2>
          <div class="mt-1 text-sm text-gray-500">
            规则包ID: {{ packageInfo.id || '-' }}
          </div>
        </div>
      </div>

      <Space>
        <Button type="primary" @click="handleAddRule">
          <IconifyIcon icon="ant-design:plus-outlined" />
          新建规则
        </Button>
      </Space>
    </div>
  </Card>
</template>
