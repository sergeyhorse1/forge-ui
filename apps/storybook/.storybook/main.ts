import tailwindcss from '@tailwindcss/vite'
import type { StorybookConfig } from '@storybook/react-vite'

/**
 * Stories live next to the components inside the `@sergeyhorse/forge` package,
 * not inside this app. The glob reaches into the workspace package so a single
 * Storybook instance documents the library it ships.
 */
const config: StorybookConfig = {
  stories: ['../../../packages/ui/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  // Tailwind v4 only emits utility classes when its Vite plugin runs in the
  // same build that processes the imported `globals.css`. Without this the
  // story styles would resolve to empty rules.
  viteFinal: (viteConfig) => {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()]
    return viteConfig
  },
}

export default config
