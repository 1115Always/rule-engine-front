import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        host: 'localhost',
        proxy: {
          // /rule/screen 属于 rule-online-app（8081），其余 /api 归 rule-console-app（8080）
          // 更具体的 key 必须写在 '/api' 之前，vite 按声明顺序取第一个匹配
          '/api/rule/screen': {
            changeOrigin: true,
            target: 'http://localhost:8081',
          },
          '/api': {
            changeOrigin: true,
            target: 'http://localhost:8080',
            ws: true,
          },
        },
      },
    },
  };
});
