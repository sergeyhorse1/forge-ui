import type { Meta, StoryObj } from '@storybook/react-vite'

import { RadioGroup } from './Radio'

const items = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push notification' },
]

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { items, defaultValue: 'email' },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32 }}>
      <RadioGroup size="sm" items={items} defaultValue="email" />
      <RadioGroup size="md" items={items} defaultValue="sms" />
      <RadioGroup size="lg" items={items} defaultValue="push" />
    </div>
  ),
}

export const WithError: Story = {
  args: { items, error: 'Please select a notification method' },
}

export const Disabled: Story = {
  args: { items, disabled: true, defaultValue: 'email' },
}
