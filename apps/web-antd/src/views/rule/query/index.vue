<script setup lang="ts">
import { ref } from 'vue';

import RuleManageList from '../manage/rule-manage-list.vue';
import RuleFormModal from '../create/rule-form-modal.vue';

const ruleManageListRef = ref<InstanceType<typeof RuleManageList> | null>(null);
const ruleFormModalRef = ref<InstanceType<typeof RuleFormModal> | null>(null);

// 打开编辑规则对话框
const handleEditRule = (record: any) => {
  ruleFormModalRef.value?.open('view', {
    id: record.rulePackageId,
    name: record.packageName,
  }, record.id);
};

// 规则操作成功后刷新列表
const handleRuleSuccess = () => {
  ruleManageListRef.value?.loadData();
};
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <RuleManageList
      ref="ruleManageListRef"
      style="height: 665px"
      :show-search="true"
      @edit="handleEditRule"
    />
    <RuleFormModal ref="ruleFormModalRef" @success="handleRuleSuccess" />
  </div>
</template>
