import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{spec,test}.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@/src': path.resolve(__dirname, 'src'),
      '@/tests': path.resolve(__dirname, 'test'),
    },
  },
  plugins: [swc.vite()],
});
