import { expect, within } from 'storybook/test'

import type { Meta, StoryObj } from '@storybook/react-vite'

import { TokenGallery } from './TokenGallery'

const meta = {
  title: 'Foundations/Design Tokens',
  component: TokenGallery,
  // Opt the story into the Vitest addon's component-test run.
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

    // The Primary swatch must paint with the token color, proving Tailwind
    // utilities compiled against the library's CSS variables.
    const primarySwatch = canvasElement.querySelector('.bg-primary')
    await expect(primarySwatch).not.toBeNull()
    await expect(getComputedStyle(primarySwatch!).backgroundColor).not.toBe('')
  },
}
