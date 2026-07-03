import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar } from './Avatar'

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: {
    alt: 'User',
    fallback: 'U',
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/80?u=forge',
    alt: 'User avatar',
    fallback: 'JD',
  },
}

export const WithFallback: Story = {
  args: {
    alt: 'John Doe',
    fallback: 'JD',
  },
}

export const AllSizes: Story = {
  tags: ['test'],
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar {...args} size="sm" fallback="S" alt="Small" />
      <Avatar {...args} size="md" fallback="M" alt="Medium" />
      <Avatar {...args} size="lg" fallback="L" alt="Large" />
    </div>
  ),
}

export const BrokenImage: Story = {
  args: {
    src: 'https://invalid.example/404.png',
    alt: 'Broken',
    fallback: 'BR',
  },
}
