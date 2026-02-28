<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

import RuleManageHeader from './rule-manage-header.vue';
import RuleManageList from './rule-manage-list.vue';
import RuleFormModal from '../create/rule-form-modal.vue';

const route = useRoute();
const ruleFormModalRef = ref<InstanceType<typeof RuleFormModal> | null>(null);
const ruleManageListRef = ref<InstanceType<typeof RuleManageList> | null>(null);

// 从路由参数获取规则包信息
const packageInfo = computed(() => ({
  id: route.query.packageId as string,
  name: route.query.packageName as string,
}));

// 打开新增规则对话框
const handleAddRule = () => {
  ruleFormModalRef.value?.open('create', {
    id: packageInfo.value.id,
    name: packageInfo.value.name,
  });
};

// 打开编辑规则对话框（查看也使用编辑模式）
const handleEditRule = (record: any) => {
  ruleFormModalRef.value?.open('edit', {
    id: packageInfo.value.id,
    name: packageInfo.value.name,
  }, record.id);
};

// 规则操作成功后刷新列表
const handleSuccess = () => {
  ruleManageListRef.value?.loadData();
};

// 返回上一页
const handleBack = () => {
  window.history.back();
};
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <RuleManageHeader @add="handleAddRule" @back="handleBack" />
    <RuleManageList
      ref="ruleManageListRef"
      style="height: 665px"
      :show-search="false"
      @edit="handleEditRule"
    />
    <RuleFormModal ref="ruleFormModalRef" @success="handleSuccess" />
  </div>
</template>
