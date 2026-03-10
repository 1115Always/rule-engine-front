<script setup lang="ts">
import { formatDateTime } from "@vben/utils";

import { IconifyIcon } from "@vben/icons";

import { Card, Space, Tag, Tooltip } from "ant-design-vue";

const emit = defineEmits<{
  edit: [rulePackage: any];
  delete: [rulePackage: any];
  click: [rulePackage: any];
}>();

defineProps<{ list: any[] }>();

const MAX_DISPLAY_SCENES = 2; // 最多显示的场景数量

const getDisplayScenes = (scenes: string[]) => {
  if (!scenes || scenes.length <= MAX_DISPLAY_SCENES) {
    return scenes;
  }
  return scenes.slice(0, MAX_DISPLAY_SCENES);
};

const getRemainingScenes = (scenes: string[]) => {
  if (!scenes || scenes.length <= MAX_DISPLAY_SCENES) {
    return [];
  }
  return scenes.slice(MAX_DISPLAY_SCENES);
};

const handleCardClick = (item: any) => {
  emit('click', item);
};

const handleActionClick = (event: MouseEvent, action: string, item: any) => {
  event.stopPropagation();

  if (action === 'edit') {
    emit('edit', item);
    return;
  }

  if (action === 'delete') {
    emit('delete', item);
    return;
  }

  // TODO: 根据action类型执行相应操作
  console.log(action, item);
};
</script>

<template>
  <div class="card-grid">
    <Card
      v-for="item in list"
      :key="item.id"
      :hoverable="true"
      class="card-item"
      @click="handleCardClick(item)"
    >
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold truncate" :title="item.name">{{ item.name }}</h3>
        </div>

        <div>
          <div class="mb-1 text-xs text-gray-500">规则场景</div>
          <Space :size="4" wrap>
            <Tooltip v-for="scene in getDisplayScenes(item.scenes)" :key="scene" :title="scene">
              <Tag color="blue" class="max-w-[100px] truncate">{{ scene }}</Tag>
            </Tooltip>
            <Tooltip v-if="getRemainingScenes(item.scenes).length > 0"
                     :title="getRemainingScenes(item.scenes).join(', ')">
              <Tag color="blue">+{{ getRemainingScenes(item.scenes).length }}</Tag>
            </Tooltip>
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
              {{ item.status === "active" ? "启用" : "禁用" }}
            </Tag>
          </div>
        </div>

        <div class="text-xs text-gray-400">
          <div>创建时间：{{ formatDateTime(item.createTime) }}</div>
          <div>更新时间：{{ formatDateTime(item.updateTime) }}</div>
        </div>
      </div>

      <template #actions>
        <div class="flex items-center justify-around px-2" @click.stop>
          <Tooltip title="编辑">
            <IconifyIcon
              icon="ant-design:edit-outlined"
              class="cursor-pointer text-lg hover:text-blue-500"
              @click="(e) => handleActionClick(e, 'edit', item)"
            />
          </Tooltip>
          <Tooltip title="删除">
            <IconifyIcon
              icon="ant-design:delete-outlined"
              class="cursor-pointer text-lg hover:text-red-500"
              @click="(e) => handleActionClick(e, 'delete', item)"
            />
          </Tooltip>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
/* 响应式卡片网格布局 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/* 卡片样式 */
.card-item {
  cursor: pointer;
  width: 100%;
}

/* 大屏适配 - 2k 分辨率及以上 */
@media (min-width: 1920px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
}

/* 4k 分辨率及以上 */
@media (min-width: 2560px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }
}

/* 小屏适配 */
@media (max-width: 1280px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 640px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
