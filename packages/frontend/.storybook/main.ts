import type { StorybookConfig } from '@storybook/svelte-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@{js,ts,svelte}'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/svelte-vite',
    options: {},
  },
  viteFinal: async (config) => {
    const { resolve } = await import('node:path');
    const srcDir = resolve(import.meta.dirname, '..', 'src');
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      $lib: resolve(srcDir, 'lib'),
      $components: resolve(srcDir, 'components'),
      $widgets: resolve(srcDir, 'widgets'),
    };
    return config;
  },
};

export default config;
