import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: '规则管理',
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
          title: '规则维护',
        },
      },
      {
        name: 'Manage',
        path: 'manage',
        redirect: '/rule/package',
        meta: {
          hideInMenu: true,
          title: '规则维护',
        },
      },
      {
        name: 'RuleQuery',
        path: 'query',
        component: () => import('#/views/rule/query/index.vue'),
        meta: {
          icon: 'lucide:search',
          title: '规则查询',
        },
      },
      {
        name: 'Field',
        path: 'field',
        component: () => import('#/views/rule/field/index.vue'),
        meta: {
          icon: 'lucide:database',
          title: '字段管理',
        },
      },
      {
        name: 'HttpTest',
        path: 'http-test',
        component: () => import('#/views/rule/http-test/index.vue'),
        meta: {
          icon: 'lucide:send',
          title: '接口测试',
        },
      },
    ],
  },
];

export default routes;
