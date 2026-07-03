import { expect, within } from 'storybook/test'

import type { Meta, StoryObj } from '@storybook/react-vite'

import { TokenGallery } from './TokenGallery'

const meta = {
  title: 'Foundations/Design Tokens',
  component: TokenGallery,
  // Включает стори в прогон компонентных тестов (Vitest addon).
  tags: ['test'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TokenGallery>

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const heading = canvas.getByRole('heading', { name: 'Design tokens' })

    await expect(heading).toBeInTheDocument()

    // Primary swatch должен покраситься токен-цветом — доказывает, что Tailwind
    // скомпилирован против CSS-переменных библиотеки.
    const primarySwatch = canvasElement.querySelector('.bg-primary')
    await expect(primarySwatch).not.toBeNull()
    await expect(getComputedStyle(primarySwatch!).backgroundColor).not.toBe('')
  },
}

export const DarkTheme: Story = {
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.dataset.theme).toBe('dark')

    // Тот же swatch резолвится в dark-переопределение токена — красится, а не
    // падает в прозрачный дефолт.
    const primarySwatch = canvasElement.querySelector('.bg-primary')
    await expect(primarySwatch).not.toBeNull()
    await expect(getComputedStyle(primarySwatch!).backgroundColor).not.toBe('')
  },
}
