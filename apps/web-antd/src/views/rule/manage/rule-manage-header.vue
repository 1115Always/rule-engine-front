<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { Button, Card, Space, Tag } from 'ant-design-vue';

const route = useRoute();

const props = defineProps<{
  packageName?: string;
  scenes?: string[];
  showBack?: boolean;
}>();

const emit = defineEmits<{
  add: [];
  back?: [];
}>();

// 从props或路由参数获取规则包信息
const packageInfo = computed(() => ({
  name: props.packageName || (route.query.packageName as string) || '',
  scenes: props.scenes || JSON.parse((route.query.scenes as string) || '[]'),
}));

//场显示相关
const MAX_SCENE_LENGTH = 100; // 最大显示长度
const MAX_SCENE_COUNT = 8; // 最多显示场景数

const displayScenes = computed(() => {
  const scenes = packageInfo.value.scenes || [];
  return scenes.slice(0, MAX_SCENE_COUNT);
});

const hasMoreScenes = computed(() => {
  const scenes = packageInfo.value.scenes || [];
  return scenes.length > MAX_SCENE_COUNT;
});

const remainingScenesCount = computed(() => {
  const scenes = packageInfo.value.scenes || [];
  return scenes.length - MAX_SCENE_COUNT;
});

const getScenesDisplayText = () => {
  const scenes = displayScenes.value;
  const text = scenes.join('、');
  return text.length > MAX_SCENE_LENGTH
    ? text.substring(0, MAX_SCENE_LENGTH) + '...'
    : text;
};

const handleBack = () => {
  emit('back');
};

const handleAddRule = () => {
  emit('add');
};
</script>

<template>
  <Card>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-6">
        <div>
          <h2 class="text-xl font-semibold">
            {{ packageInfo.name || '规则包' }}
          </h2>
        </div>

        <div class="flex items-center gap-4 text-sm">
          <div v-if="displayScenes.length > 0" class="flex items-center gap-2">
            <span class="text-gray-500">规则场景:</span>
            <div class="flex max-w-xs flex-wrap gap-1">
              <Tag
                v-for="scene in displayScenes"
                :key="scene"
                color="blue"
                class="text-xs"
              >
                {{ scene }}
              </Tag>
              <Tag v-if="hasMoreScenes" color="blue" class="text-xs">
                +{{ remainingScenesCount }}
              </Tag>
            </div>
          </div>
        </div>
      </div>

      <Space>
        <Button type="primary" @click="handleAddRule">
          <IconifyIcon icon="ant-design:plus-outlined" />
          新建规则
        </Button>
        <Button @click="handleBack">返回</Button>
      </Space>
    </div>
  </Card>
</template>
