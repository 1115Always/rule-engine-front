import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bar-chart-3',
      order: 0,
      title: '指标管理',
    },
    name: 'Metric',
    path: '/metric',
    children: [
      {
        name: 'MetricEntity',
        path: 'entity',
        component: () => import('#/views/metric/entity/index.vue'),
        meta: {
          icon: 'lucide:box',
          keepAlive: true,
          title: '实体维护',
        },
      },
      {
        name: 'MetricCode',
        path: 'code',
        component: () => import('#/views/metric/code/index.vue'),
        meta: {
          icon: 'lucide:activity',
          keepAlive: true,
          title: '指标维护',
        },
      },
    ],
  },
];

export default routes;
