import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            // 后端服务地址，保留 /api 前缀
            target: 'http://localhost:8080',
            ws: true,
          },
        },
      },
    },
  };
});
