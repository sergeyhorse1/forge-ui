import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { MetricCard } from './MetricCard'

const meta = {
  title: 'Dashboard/MetricCard',
  component: MetricCard,
  tags: ['autodocs', 'test'],
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MetricCard>

export default meta
type Story = StoryObj<typeof meta>

const series = [12, 18, 9, 22, 17, 28, 24, 31]

export const Positive: Story = {
  args: {
    title: 'Monthly revenue',
    value: '$48.2k',
    delta: { value: 12.5, label: 'vs last month' },
    sparkline: series,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('12.5')).toBeInTheDocument()
    await expect(canvas.getByText('12.5').parentElement).toHaveClass('text-success')
  },
}

export const Negative: Story = {
  args: {
    title: 'Bounce rate',
    value: '32%',
    delta: -4.2,
    sparkline: [40, 38, 41, 36, 34, 33, 32],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('4.2').parentElement).toHaveClass('text-destructive')
  },
}

export const Flat: Story = {
  args: { title: 'Uptime', value: '99.9%', delta: 0 },
}

export const NoDelta: Story = {
  args: { title: 'Active projects', value: 14 },
}
