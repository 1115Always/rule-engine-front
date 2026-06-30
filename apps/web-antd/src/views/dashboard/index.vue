<script lang="ts" setup>
import { computed } from 'vue';

import { useUserStore } from '@vben/stores';

const userStore = useUserStore();
const realName = computed(() => userStore.userInfo?.realName ?? '—');
const username = computed(() => userStore.userInfo?.username ?? '');

const stats = [
  {
    color: '#1677ff',
    icon: 'lucide:git-branch',
    label: '运行中规则',
    trend: '+3',
    trendType: 'up' as const,
    value: '128',
  },
  {
    color: '#52c41a',
    icon: 'lucide:activity',
    label: '今日匹配量',
    trend: '+12.5%',
    trendType: 'up' as const,
    value: '46,832',
  },
  {
    color: '#faad14',
    icon: 'lucide:alert-triangle',
    label: '今日告警',
    trend: '-8.3%',
    trendType: 'down' as const,
    value: '23',
  },
  {
    color: '#ff4d4f',
    icon: 'lucide:shield-off',
    label: '今日拦截',
    trend: '+2.1%',
    trendType: 'up' as const,
    value: '1,247',
  },
];
</script>

<template>
  <div class="p-6">
    <!-- 欢迎横幅 -->
    <div
      class="mb-6 flex items-center justify-between rounded-lg bg-gradient-to-r from-[#1677ff] to-[#0958d9] px-8 py-7 text-white"
    >
      <div>
        <h1 class="text-2xl font-semibold">
          👋 欢迎回来，{{ realName }}
        </h1>
        <p class="mt-2 text-white/80">
          风控引擎运行正常 · {{ new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
        </p>
      </div>
      <div class="hidden items-center gap-3 md:flex">
        <span class="relative flex h-3 w-3">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
        </span>
        <span class="text-sm text-white/90">服务正常</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-lg border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <div class="mb-3 flex items-center justify-between">
          <span
            class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg text-white"
            :style="{ backgroundColor: stat.color }"
          >
            <span :class="stat.icon" />
          </span>
          <span
            class="text-xs font-medium"
            :class="stat.trendType === 'up' ? 'text-green-600' : 'text-red-500'"
          >
            {{ stat.trend }}
          </span>
        </div>
        <div class="text-2xl font-bold text-gray-800">{{ stat.value }}</div>
        <div class="mt-1 text-xs text-gray-500">{{ stat.label }}</div>
      </div>
    </div>

    <!-- 系统信息 -->
    <div class="max-w-md">
        <h3 class="mb-3 text-base font-medium text-gray-700">系统信息</h3>
        <div class="rounded-lg border border-gray-100 bg-white p-4">
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">引擎版本</span>
              <span class="font-medium text-gray-800">v2.1.4</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">规则引擎</span>
              <span class="font-medium text-green-600">● 运行中</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">指标引擎</span>
              <span class="font-medium text-green-600">● 运行中</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">登录用户</span>
              <span class="font-medium text-gray-800">{{ username }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">预计算法</span>
              <span class="font-medium text-gray-800">Aviator 5.4</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">数据源</span>
              <span class="font-medium text-gray-800">H2 / Redis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
/* lucide 图标以 class 方式使用，会自动渲染成 SVG */
</style>
