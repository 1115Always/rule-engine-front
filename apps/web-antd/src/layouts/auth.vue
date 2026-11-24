<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { CircleCheckBig, MoonStar, Sun } from '@vben/icons';
import {
  preferences,
  updatePreferences,
  usePreferences,
} from '@vben/preferences';

import { $t } from '#/locales';

const route = useRoute();

const { isDark } = usePreferences();

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const year = new Date().getFullYear();

const features = computed(() =>
  [1, 2, 3].map((index) => ({
    desc: $t(`page.login.feature${index}Desc`),
    title: $t(`page.login.feature${index}Title`),
  })),
);

function toggleTheme() {
  updatePreferences({ theme: { mode: isDark.value ? 'light' : 'dark' } });
}
</script>

<template>
  <div
    class="text-foreground bg-background-deep relative flex min-h-screen w-full"
  >
    <!-- 背景光晕 + 网格 -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="brand-glow bg-primary/20 absolute -left-40 -top-56 size-[620px] rounded-full"
      ></div>
      <div
        class="brand-glow absolute -bottom-64 -right-24 size-[680px] rounded-full bg-[#2563eb]/20"
      ></div>
      <div class="brand-grid absolute inset-0"></div>
    </div>

    <!-- 主题切换 -->
    <button
      :aria-label="isDark ? 'light' : 'dark'"
      class="theme-toggle absolute right-5 top-5 z-20"
      type="button"
      @click="toggleTheme"
    >
      <Sun v-if="isDark" class="size-4" />
      <MoonStar v-else class="size-4" />
    </button>

    <!-- 左侧品牌叙事 -->
    <section
      class="relative z-10 hidden w-1/2 flex-col justify-between px-14 py-12 lg:flex xl:px-20 xl:py-16"
    >
      <div class="flex items-center gap-3">
        <img
          v-if="logo"
          :src="logo"
          alt=""
          class="bg-foreground/5 size-9 rounded-xl object-contain p-1"
        />
        <div>
          <div class="text-foreground text-base font-semibold tracking-wide">
            {{ appName }}
          </div>
          <div
            class="text-muted-foreground text-[11px] uppercase tracking-[0.2em]"
          >
            Rule Engine
          </div>
        </div>
      </div>

      <div class="max-w-xl">
        <h1
          class="text-5xl font-bold leading-[1.12] tracking-tight xl:text-6xl"
        >
          <span class="block text-foreground">{{ $t('page.login.headline') }}</span>
          <span
            class="block bg-gradient-to-r from-foreground/75 via-foreground/50 to-foreground/20 bg-clip-text text-transparent"
          >
            {{ $t('page.login.headlineAccent') }}
          </span>
        </h1>
        <p class="text-muted-foreground mt-5 text-base">
          {{ $t('page.login.subheadline') }}
        </p>

        <ul class="mt-12 space-y-6">
          <li
            v-for="item in features"
            :key="item.title"
            class="flex items-start gap-4"
          >
            <span
              class="text-primary border-foreground/10 bg-foreground/5 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border"
            >
              <CircleCheckBig class="size-4" />
            </span>
            <div>
              <p class="text-foreground/90 text-sm font-medium">
                {{ item.title }}
              </p>
              <p class="text-muted-foreground mt-1 text-sm leading-relaxed">
                {{ item.desc }}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <p class="text-muted-foreground/70 text-xs">© {{ year }} {{ appName }}</p>
    </section>

    <!-- 右侧表单卡片 -->
    <section
      class="border-foreground/10 relative z-10 flex w-full flex-col items-center justify-center px-5 py-10 lg:w-1/2 lg:border-l lg:px-10"
    >
      <div
        class="bg-primary/15 pointer-events-none absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
      ></div>

      <div class="relative mb-8 flex items-center gap-3 lg:hidden">
        <img
          v-if="logo"
          :src="logo"
          alt=""
          class="bg-foreground/5 size-9 rounded-xl object-contain p-1"
        />
        <span class="text-foreground text-base font-semibold">{{ appName }}</span>
      </div>

      <div
        class="login-card relative w-full max-w-[420px] rounded-3xl p-8 sm:p-10"
      >
        <RouterView v-slot="{ Component }">
          <Transition appear mode="out-in" name="slide-right">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </RouterView>
      </div>
    </section>
  </div>
</template>

<style scoped>
.brand-glow {
  filter: blur(120px);
  animation: brand-breathe 12s ease-in-out infinite alternate;
}

.brand-grid {
  background-image:
    linear-gradient(to right, hsl(var(--foreground) / 6%) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--foreground) / 6%) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(
    ellipse 70% 60% at 30% 45%,
    #000 30%,
    transparent 100%
  );
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--card) / 60%);
  border: 1px solid hsl(var(--foreground) / 10%);
  border-radius: 9999px;
  backdrop-filter: blur(12px);
  transition:
    color 0.2s,
    background-color 0.2s;
}

.theme-toggle:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--card) / 90%);
}

.login-card {
  background: hsl(var(--card) / 85%);
  border: 1px solid hsl(var(--foreground) / 10%);
  box-shadow:
    0 40px 90px -40px rgb(0 0 0 / 45%),
    inset 0 1px 0 hsl(var(--foreground) / 8%);
  backdrop-filter: blur(24px);
}

/* 卡片顶部一条渐变高光，避免纯色边框看起来发干 */
.login-card::before {
  position: absolute;
  top: 0;
  right: 15%;
  left: 15%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    hsl(var(--foreground) / 35%),
    transparent
  );
  content: '';
}

/* 登录按钮做高一点，跟输入框视觉重量对齐 */
.login-card :deep([aria-label='login']) {
  height: 2.75rem;
  border-radius: 0.75rem;
  font-size: 0.95rem;
}

@keyframes brand-breathe {
  from {
    opacity: 0.75;
    transform: scale(1);
  }

  to {
    opacity: 1;
    transform: scale(1.08);
  }
}
</style>
