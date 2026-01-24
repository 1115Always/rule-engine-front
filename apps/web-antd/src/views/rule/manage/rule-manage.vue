<script setup lang="ts">
import { ref } from 'vue';

import AddRulePackage from './add-rule-package.vue';
import RuleManageCard from './rule-manage-card.vue';
import RuleManageHeader from './rule-manage-header.vue';

interface RulePackage {
  createTime?: string;
  id: number;
  name: string;
  ruleCount?: number;
  scenes: string[];
  status?: 'active' | 'inactive';
  updateTime?: string;
}

const addRulePackageRef = ref();

const rulePackages = ref<RulePackage[]>([
  {
    id: 1,
    name: '转账风控规则',
    scenes: ['单笔转账'],
    ruleCount: 12,
    status: 'active',
    createTime: '2024-01-15',
    updateTime: '2024-01-20',
  },
  {
    id: 2,
    name: '批量转账校验',
    scenes: ['批量转账'],
    ruleCount: 8,
    status: 'active',
    createTime: '2024-01-10',
    updateTime: '2024-01-18',
  },
]);

const onAdd = () => {
  addRulePackageRef.value?.open();
};

const onSubmit = (data: any) => {
  rulePackages.value.push({
    id: Date.now(),
    name: data.name,
    scenes: data.scenes,
  });
};
</script>

<template>
  <div class="p-4">
    <RuleManageHeader @add="onAdd" />

    <RuleManageCard :list="rulePackages" />

    <AddRulePackage ref="addRulePackageRef" @submit="onSubmit" />
  </div>
</template>
