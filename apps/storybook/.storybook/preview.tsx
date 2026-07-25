import { useEffect } from 'react'

import type { Decorator, Preview } from '@storybook/react-vite'

// Берём исходник, не прибилт: тогда плагин Tailwind соберёт те же утилиты, что уезжают в пакет
import '../../../packages/ui/src/styles/globals.css'
import './storybook.css'

type Theme = 'light' | 'dark'

// Тему кладём на <html data-theme>, как это делает консьюмер: иначе dark-переопределения токенов не сработают
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
    a11y: {
      test: 'error',
    },
  },
}

export default preview
