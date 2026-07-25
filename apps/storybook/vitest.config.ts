import { fileURLToPath } from 'node:url'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

import { windowsStoryGuard } from './.storybook/windows-story-guard'

const storybookPlugins = await storybookTest({
  configDir: fileURLToPath(new URL('.storybook', import.meta.url)),
})

// Отдельный конфиг, не workspace-энтри: аддон хочет сам определять тест-проект, а jsdom-прогон живёт в packages/ui
export default defineConfig({
  plugins: [...storybookPlugins, windowsStoryGuard()],
  // Пре-бандлим рантайм стори, иначе Vite найдёт импорты лениво и перезагрузит раннер посреди теста
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
