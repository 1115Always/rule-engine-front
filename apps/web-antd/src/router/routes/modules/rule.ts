import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('rule.manage.title'),
    },
    name: 'Rule',
    path: '/rule',
    children: [
      {
        name: 'Package',
        path: 'package',
        component: () => import('#/views/rule/package/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: '规则包维护',
        },
      },
      {
        name: 'Manage',
        path: 'manage',
        component: () => import('#/views/rule/manage/index.vue'),
        meta: {
          hideInMenu: true,
          title: '规则维护',
        },
      },
    ],
  },
];

export default routes;
