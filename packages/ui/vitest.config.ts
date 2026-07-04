import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.stories.tsx',
        '**/*.test.{ts,tsx}',
        '**/demo/**',
        'src/preview/**',
        '**/index.ts',
        'src/styles/preset.ts',
      ],
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        '**/components/DataGrid/**': {
          lines: 75,
          functions: 75,
          branches: 75,
          statements: 75,
        },
        '**/components/FilterBuilder/**': {
          lines: 75,
          functions: 75,
          branches: 75,
          statements: 75,
        },
      },
    },
  },
})
