import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'build', '.turbo'],
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
  },
  resolve: {
    alias: {
      '@belentani/core': resolve(__dirname, './src'),
    }
  }
});