<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { getRulePackagesApi } from '#/api/rule/rule-package';
import { getSceneOptionsApi } from '#/api/rule/scene';

import AddRulePackage from './add-rule-package.vue';
import RulePackManageCard from './rule-pack-manage-card.vue';
import RulePackManageHeader from './rule-pack-manage-header.vue';

interface RulePackage {
  createTime?: string;
  id: string; // 大整数ID，使用字符串类型避免精度丢失
  name: string;
  ruleCount?: number;
  scenes: string[];
  status?: 'active' | 'inactive';
  updateTime?: string;
}

const addRulePackageRef = ref();
const rulePackages = ref<RulePackage[]>([]);
const sceneOptions = ref<Array<{ label: string; value: string }>>([]);

const fetchRulePackages = async (params?: { packageName?: string; scene?: string }) => {
  try {
    rulePackages.value = await getRulePackagesApi(params);
  } catch (error) {
    console.error('Error fetching rule packages:', error);
  }
};

//获取场景列表
const fetchSceneList = async () => {
  try {
    sceneOptions.value = await getSceneOptionsApi();
  } catch (error) {
    console.error('获取场景列表失败:', error);
  }
};

onMounted(async () => {
  await fetchSceneList(); //等待获取场景列表完成
  fetchRulePackages({}); //传入空对象，使用默认参数
});

const onAdd = () => {
  addRulePackageRef.value?.open('create');
};

// 编辑规则包
const onEdit = (rulePackage: RulePackage) => {
  addRulePackageRef.value?.open('edit', rulePackage);
};

const onSearch = (data: { name?: string; scenes?: string }) => {
  //调用API进行查询
  fetchRulePackages({
    packageName: data.name,
    scene: data.scenes
  });
};

const onCreateSuccess = () => {
  // 创建成功后刷新规则包列表
  fetchRulePackages({});
};
</script>

<template>
  <div class="p-4">
    <RulePackManageHeader
      @add="onAdd"
      @search="onSearch"
      :scene-options="sceneOptions"
    />

    <RulePackManageCard :list="rulePackages" @edit="onEdit" />

    <AddRulePackage ref="addRulePackageRef" @success="onCreateSuccess" />
  </div>
</template>
