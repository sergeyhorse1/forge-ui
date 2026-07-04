import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Inbox } from 'lucide-react'

import { EmptyState } from './EmptyState'
import { Button } from '../Button'

const meta = {
  title: 'Dashboard/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: <Inbox />,
    title: 'No messages yet',
    description: 'When your team starts a conversation it will show up here.',
    action: <Button size="sm">Start a thread</Button>,
  },
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No messages yet')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Start a thread' })).toBeInTheDocument()
  },
}

export const TitleOnly: Story = {
  args: { title: 'Nothing to display' },
}
