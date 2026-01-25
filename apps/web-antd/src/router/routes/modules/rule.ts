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
        name: 'Manage',
        path: 'manage',
        component: () => import('#/views/rule/package/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: $t('rule.manage.maintain'),
        },
      },
    ],
  },
];

export default routes;
