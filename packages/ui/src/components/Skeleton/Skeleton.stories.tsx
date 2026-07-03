import type { Meta, StoryObj } from '@storybook/react-vite'

import { Skeleton } from './Skeleton'

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { width: 200, height: 20 },
}

export const Circle: Story = {
  args: { width: 40, height: 40, className: 'rounded-full' },
}

export const CardPlaceholder: Story = {
  tags: ['test'],
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 300 }}>
      <Skeleton height={160} />
      <Skeleton height={16} width="80%" />
      <Skeleton height={16} width="60%" />
    </div>
  ),
}
