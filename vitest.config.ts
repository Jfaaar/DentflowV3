import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/__tests__/**/*.test.{js,ts}'],
    globals: false,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
