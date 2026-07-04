import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  tags: ['test'],
  render: () => (
    <Tabs defaultValue="overview" style={{ width: 360 }}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Your dashboard summary.</TabsContent>
      <TabsContent value="activity">Recent activity feed.</TabsContent>
      <TabsContent value="settings">Workspace settings.</TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Your dashboard summary.')).toBeInTheDocument()

    const activity = canvas.getByRole('tab', { name: 'Activity' })
    await userEvent.click(activity)
    await expect(activity).toHaveAttribute('aria-selected', 'true')
    await expect(canvas.getByText('Recent activity feed.')).toBeInTheDocument()

    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('tab', { name: 'Settings' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}
