import type { Meta, StoryObj } from '@storybook/react-vite'

import { IconButton } from './IconButton'

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    icon: <PlusIcon />,
    'aria-label': 'Add item',
  },
  argTypes: {
    variant: { control: 'select', options: ['solid', 'soft', 'outline', 'ghost', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const AllVariants: Story = {
  tags: ['test'],
  render: (args) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <IconButton {...args} variant="solid" aria-label="Solid" />
      <IconButton {...args} variant="soft" aria-label="Soft" />
      <IconButton {...args} variant="outline" aria-label="Outline" />
      <IconButton {...args} variant="ghost" aria-label="Ghost" />
      <IconButton {...args} variant="destructive" aria-label="Destructive" />
    </div>
  ),
}

export const AllSizes: Story = {
  tags: ['test'],
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <IconButton {...args} size="sm" aria-label="Small" />
      <IconButton {...args} size="md" aria-label="Medium" />
      <IconButton {...args} size="lg" aria-label="Large" />
    </div>
  ),
}

export const Loading: Story = {
  args: { loading: true },
}
