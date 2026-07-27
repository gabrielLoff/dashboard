import base from './index.mjs';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  ...base,
  ...sveltePlugin.configs.recommended,
  {
    ignores: ['**/*.svelte.ts'],
  },
  {
    files: ['**/*.svelte'],
    rules: {
      'svelte/no-useless-children-snippet': 'off',
    },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        extraFileExtensions: ['.svelte'],
        parser: tseslint.parser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: resolve(__dirname, '../..'),
          extraFileExtensions: ['.svelte'],
        },
      },
    },
  },
];
