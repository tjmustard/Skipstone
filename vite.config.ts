/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2022',
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
