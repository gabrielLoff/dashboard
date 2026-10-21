import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Route tests share one SQLite file; parallel workers contend on WAL.
    fileParallelism: false,
  },
});
