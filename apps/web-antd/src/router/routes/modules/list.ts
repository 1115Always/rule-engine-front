import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield',
      order: 0,
      title: '名单维护',
    },
    name: 'List',
    path: '/list',
    children: [
      {
        name: 'ListGroup',
        path: 'group',
        component: () => import('#/views/list/group/list-group.vue'),
        meta: {
          icon: 'lucide:folder',
          keepAlive: true,
          title: '分组管理',
        },
      },
      {
        name: 'ListTemplate',
        path: 'template',
        component: () => import('#/views/list/template/list-template.vue'),
        meta: {
          icon: 'lucide:clipboard-list',
          keepAlive: true,
          title: '模板管理',
        },
      },
      {
        name: 'ListData',
        path: 'data',
        component: () => import('#/views/list/data/list-data.vue'),
        meta: {
          icon: 'lucide:list',
          affixTab: true,
          keepAlive: true,
          title: '名单数据',
        },
      },
    ],
  },
];

export default routes;
