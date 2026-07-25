import base from './index.mjs';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  ...base,
  ...sveltePlugin.configs.recommended,
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: base[0]?.languageOptions?.parserOptions?.projectService ?? undefined,
      },
    },
  },
];
