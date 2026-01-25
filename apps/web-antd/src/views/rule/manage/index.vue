<script setup lang="ts">
import RuleManageHeader from './rule-manage-header.vue';
import RuleManageList from './rule-manage-list.vue';
</script>

<template>
  <div class="flex flex-col gap-4 p-4">
    <RuleManageHeader />
    <RuleManageList style="height: 665px" />
  </div>
</template>
