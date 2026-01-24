<script setup lang="ts">
import { IconifyIcon } from '@vben/icons';

import { Card, Space, Tag, Tooltip } from 'ant-design-vue';

defineProps<{ list: any[] }>();
</script>

<template>
  <div class="grid grid-cols-5 gap-4">
    <Card
      v-for="item in list"
      :key="item.id"
      :hoverable="true"
      class="cursor-pointer"
      style="max-width: 280px"
    >
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold">{{ item.name }}</h3>
        </div>

        <div>
          <div class="mb-1 text-xs text-gray-500">规则场景</div>
          <Space :size="4" wrap>
            <Tag v-for="scene in item.scenes" :key="scene" color="blue">
              {{ scene }}
            </Tag>
          </Space>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span class="text-gray-400">规则数：</span>
            <span class="font-medium">{{ item.ruleCount || 0 }}</span>
          </div>
          <div>
            <span class="text-gray-400">状态：</span>
            <Tag
              :color="item.status === 'active' ? 'green' : 'default'"
              size="small"
            >
              {{ item.status === 'active' ? '启用' : '禁用' }}
            </Tag>
          </div>
        </div>

        <div class="text-xs text-gray-400">
          <div>创建时间：{{ item.createTime || '2024-01-01' }}</div>
          <div>更新时间：{{ item.updateTime || '2024-01-01' }}</div>
        </div>
      </div>

      <template #actions>
        <div class="flex items-center justify-around px-2">
          <Tooltip title="查看">
            <IconifyIcon
              icon="ant-design:eye-outlined"
              class="cursor-pointer text-lg hover:text-blue-500"
            />
          </Tooltip>
          <Tooltip title="编辑">
            <IconifyIcon
              icon="ant-design:edit-outlined"
              class="cursor-pointer text-lg hover:text-blue-500"
            />
          </Tooltip>
          <Tooltip title="删除">
            <IconifyIcon
              icon="ant-design:delete-outlined"
              class="cursor-pointer text-lg hover:text-red-500"
            />
          </Tooltip>
          <Tooltip title="导出">
            <IconifyIcon
              icon="ant-design:export-outlined"
              class="cursor-pointer text-lg hover:text-blue-500"
            />
          </Tooltip>
        </div>
      </template>
    </Card>
  </div>
</template>
