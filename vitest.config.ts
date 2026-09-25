import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'packages/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'build', '.turbo', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        'packages/frontend/**', // Frontend tested via Playwright
        'packages/desktop/**'   // Desktop tested via Tauri
      ]
    },
    testTimeout: 30000,
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      }
    },
    reporters: ['default'],
    outputFile: {
      json: './test-results/vitest-results.json',
    }
  },
  resolve: {
    alias: {
      '@belentani/core': resolve(__dirname, 'packages/core/src'),
      '@belentani/generators': resolve(__dirname, 'packages/generators/src'),
      '@belentani/frontend': resolve(__dirname, 'packages/frontend/src'),
      '@belentani/studio-api': resolve(__dirname, 'packages/studio-api/src'),
      '@belentani/desktop': resolve(__dirname, 'packages/desktop/src')
    }
  }
});