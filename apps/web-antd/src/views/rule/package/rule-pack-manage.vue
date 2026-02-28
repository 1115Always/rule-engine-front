<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Modal, message } from 'ant-design-vue';

import { deleteRulePackageApi, getRulePackagesApi } from '#/api/rule/rule-package';
import { getSceneOptionsApi } from '#/api/rule/scene';

import AddRulePackage from './add-rule-package.vue';
import RulePackManageCard from './rule-pack-manage-card.vue';
import RulePackManageHeader from './rule-pack-manage-header.vue';
import RuleManageHeader from '../manage/rule-manage-header.vue';
import RuleManageList from '../manage/rule-manage-list.vue';
import RuleFormModal from '../create/rule-form-modal.vue';

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

// 规则列表视图状态
const showRuleList = ref(false);
const currentPackage = ref<RulePackage | null>(null);
const ruleManageListRef = ref<InstanceType<typeof RuleManageList> | null>(null);
const ruleFormModalRef = ref<InstanceType<typeof RuleFormModal> | null>(null);

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

// 删除规则包
const onDelete = (rulePackage: RulePackage) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除规则包"${rulePackage.name}"吗？删除后将无法恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deleteRulePackageApi(rulePackage.id);
        message.success('删除成功');
        // 刷新列表
        fetchRulePackages({});
      } catch (error: any) {
        console.error('删除规则包失败:', error);
        message.error(error.message || '删除失败');
      }
    },
  });
};

// 点击卡片，切换到规则列表视图
const onCardClick = (rulePackage: RulePackage) => {
  currentPackage.value = rulePackage;
  showRuleList.value = true;
};

// 返回规则包列表
const onBackToPackageList = () => {
  showRuleList.value = false;
  currentPackage.value = null;
};

// 打开新增规则对话框
const handleAddRule = () => {
  if (!currentPackage.value) return;
  ruleFormModalRef.value?.open('create', {
    id: currentPackage.value.id,
    name: currentPackage.value.name,
  });
};

// 打开编辑规则对话框
const handleEditRule = (record: any) => {
  if (!currentPackage.value) return;
  ruleFormModalRef.value?.open('edit', {
    id: currentPackage.value.id,
    name: currentPackage.value.name,
  }, record.id);
};

// 规则操作成功后刷新列表
const handleRuleSuccess = () => {
  ruleManageListRef.value?.loadData();
};
</script>

<template>
  <div class="p-4">
    <!-- 规则包列表视图 -->
    <div v-if="!showRuleList">
      <RulePackManageHeader
        @add="onAdd"
        @search="onSearch"
        :scene-options="sceneOptions"
      />

      <RulePackManageCard :list="rulePackages" @edit="onEdit" @delete="onDelete" @click="onCardClick" />

      <AddRulePackage ref="addRulePackageRef" @success="onCreateSuccess" />
    </div>

    <!-- 规则列表视图 -->
    <div v-else class="flex flex-col gap-4">
      <RuleManageHeader
        :package-name="currentPackage?.name"
        :scenes="currentPackage?.scenes"
        @add="handleAddRule"
        @back="onBackToPackageList"
      />
      <RuleManageList
        ref="ruleManageListRef"
        style="height: 665px"
        :package-name="currentPackage?.name || ''"
        :show-search="false"
        @edit="handleEditRule"
      />
      <RuleFormModal ref="ruleFormModalRef" @success="handleRuleSuccess" />
    </div>
  </div>
</template>
