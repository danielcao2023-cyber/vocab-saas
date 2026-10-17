import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  root: 'web', plugins: [vue()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: { proxy: { '/api': 'http://127.0.0.1:18420', '/health': 'http://127.0.0.1:18420' } },
  test: { root: '.', include: ['test/**/*.test.ts'] },
} as any);
