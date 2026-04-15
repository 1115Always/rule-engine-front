<script setup lang="ts">
import { ref } from 'vue';

import { Card, Tabs, TabPane } from 'ant-design-vue';

import ListGroup from './group/list-group.vue';
import ListTemplate from './template/list-template.vue';
import ListData from './data/list-data.vue';

const activeTab = ref('data');
</script>

<template>
  <Card>
    <Tabs v-model:activeKey="activeTab">
      <TabPane key="group" tab="分组管理">
        <ListGroup />
      </TabPane>
      <TabPane key="template" tab="模板管理">
        <ListTemplate />
      </TabPane>
      <TabPane key="data" tab="名单数据">
        <ListData />
      </TabPane>
    </Tabs>
  </Card>
</template>
