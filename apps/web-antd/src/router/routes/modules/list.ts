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
        name: 'ListIndex',
        path: 'index',
        component: () => import('#/views/list/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:list',
          keepAlive: true,
          title: '名单管理',
        },
      },
    ],
  },
];

export default routes;
