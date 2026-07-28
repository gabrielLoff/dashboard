import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte({
      hot: false,
    }),
  ],
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$components': path.resolve('./src/components'),
      '$widgets': path.resolve('./src/widgets'),
    },
    conditions: ['browser', 'import', 'module'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
