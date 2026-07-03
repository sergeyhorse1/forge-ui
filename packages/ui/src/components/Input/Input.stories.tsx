import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './Input'

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: 'Enter text...' },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
}

export const WithError: Story = {
  args: { error: 'This field is required', placeholder: 'Email' },
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled input' },
}

export const WithAddons: Story = {
  args: {
    leftAddon: <span>$</span>,
    rightAddon: <span>.00</span>,
    placeholder: '0',
  },
}

export const Password: Story = {
  args: { type: 'password', placeholder: 'Password' },
}
