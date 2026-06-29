import { useEffect } from 'react'

import type { Decorator, Preview } from '@storybook/react-vite'

// Pre-built design tokens. Importing the source stylesheet lets the Tailwind
// Vite plugin (see main.ts) compile the same utilities the library ships with.
import '../../../packages/ui/src/styles/globals.css'
// Utilities used only by demo, preview and story files. globals.css scopes its
// scan to published code so dist stays lean; this re-adds those classes for the
// Storybook build (see storybook.css).
import './storybook.css'

type Theme = 'light' | 'dark'

/**
 * Reflects the toolbar selection onto `<html data-theme>` so the
 * `[data-theme='dark']` token overrides in globals.css take effect, matching how
 * consumers opt into dark mode.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as Theme

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    return () => {
      delete root.dataset.theme
    }
  }, [theme])

  return (
    <div className="bg-background text-foreground min-h-svh p-8">
      <Story />
    </div>
  )
}

const preview: Preview = {
  decorators: [withTheme],
  initialGlobals: {
    theme: 'light',
  },
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Fail stories that contain accessibility violations instead of only
    // surfacing them in the panel.
    a11y: {
      test: 'error',
    },
  },
}

export default preview
