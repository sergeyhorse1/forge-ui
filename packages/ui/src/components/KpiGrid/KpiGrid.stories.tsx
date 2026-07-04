import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

import { KpiGrid } from './KpiGrid'
import { MetricCard } from '../MetricCard'

const meta = {
  title: 'Dashboard/KpiGrid',
  component: KpiGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof KpiGrid>

export default meta
type Story = StoryObj<typeof meta>

function Tiles() {
  return (
    <>
      <MetricCard title="Revenue" value="$48k" delta={12} />
      <MetricCard title="Sessions" value="9.2k" delta={-3} />
      <MetricCard title="Signups" value={318} delta={7} />
      <MetricCard title="Churn" value="1.8%" delta={0} />
    </>
  )
}

function trackCount(element: HTMLElement): number {
  return getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
}

export const Default: Story = {
  render: (args) => (
    <KpiGrid {...args}>
      <Tiles />
    </KpiGrid>
  ),
}

export const Wide: Story = {
  tags: ['test'],
  render: (args) => (
    <div style={{ width: 900 }}>
      <KpiGrid {...args}>
        <Tiles />
      </KpiGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const gridEl = canvasElement.querySelector<HTMLElement>('[style*="repeat"]')
    await expect(gridEl).not.toBeNull()
    await expect(trackCount(gridEl as HTMLElement)).toBeGreaterThan(1)
  },
}

export const Narrow: Story = {
  tags: ['test'],
  render: (args) => (
    <div style={{ width: 240 }}>
      <KpiGrid {...args}>
        <Tiles />
      </KpiGrid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const gridEl = canvasElement.querySelector<HTMLElement>('[style*="repeat"]')
    await expect(gridEl).not.toBeNull()
    await expect(trackCount(gridEl as HTMLElement)).toBe(1)
  },
}
