import type { Meta, StoryObj } from '@storybook/react-vite'

import { Textarea } from './Textarea'

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: 'Write something...' },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Textarea size="sm" placeholder="Small" />
      <Textarea size="md" placeholder="Medium" />
      <Textarea size="lg" placeholder="Large" />
    </div>
  ),
}

export const WithError: Story = {
  args: { error: 'Message is too short', placeholder: 'Description', 'aria-label': 'Description' },
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled textarea' },
}

export const AutoResize: Story = {
  args: { autoResize: true, placeholder: 'Type to grow...' },
}
