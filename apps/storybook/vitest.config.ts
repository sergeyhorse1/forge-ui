import { fileURLToPath } from 'node:url'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

import { windowsStoryGuard } from './.storybook/windows-story-guard'

const dirname = fileURLToPath(new URL('.', import.meta.url))

const storybookPlugins = await storybookTest({
  configDir: `${dirname}.storybook`,
})

/**
 * Dedicated browser-mode project that runs every story as a test through the
 * Storybook Vitest addon. It is intentionally a standalone config rather than a
 * Vitest workspace entry: the library keeps its own jsdom unit project in
 * `packages/ui`, and the two never share a runner.
 *
 * The `test` field stays here (never in a Vite config) — the addon expects to
 * own the test project definition.
 */
export default defineConfig({
  plugins: [...storybookPlugins, windowsStoryGuard()],
  // Pre-bundle the story runtime so the browser runner does not reload mid-test
  // when Vite discovers these imports lazily.
  optimizeDeps: {
    include: ['storybook/test', '@storybook/react-vite', 'react', 'react-dom'],
  },
  test: {
    name: 'storybook',
    setupFiles: ['./vitest.setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
