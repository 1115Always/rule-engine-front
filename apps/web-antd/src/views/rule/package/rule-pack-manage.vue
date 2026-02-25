<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { getRulePackagesApi } from '#/api/rule/rule-package';

import AddRulePackage from './add-rule-package.vue';
import RulePackManageCard from './rule-pack-manage-card.vue';
import RulePackManageHeader from './rule-pack-manage-header.vue';

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
const rulePackages = ref<RulePackage[]>([]);

const fetchRulePackages = async () => {
  try {
    rulePackages.value = await getRulePackagesApi();
  } catch (error) {
    console.error('Error fetching rule packages:', error);
  }
};

onMounted(() => {
  fetchRulePackages();
});

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
    <RulePackManageHeader @add="onAdd" />

    <RulePackManageCard :list="rulePackages" />

    <AddRulePackage ref="addRulePackageRef" @submit="onSubmit" />
  </div>
</template>
