import type { Meta, StoryObj } from '@storybook/react-vite'

import { Select, SelectItem } from './Select'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
]

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { items, placeholder: 'Select a fruit...', 'aria-label': 'Fruit' },
}

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Select size="sm" items={items} placeholder="Small" aria-label="Small fruit" />
      <Select size="md" items={items} placeholder="Medium" aria-label="Medium fruit" />
      <Select size="lg" items={items} placeholder="Large" aria-label="Large fruit" />
    </div>
  ),
}

export const WithError: Story = {
  args: { items, error: 'Please select a fruit', placeholder: 'Choose...', 'aria-label': 'Fruit' },
}

export const Disabled: Story = {
  args: { items, disabled: true, placeholder: 'Disabled', 'aria-label': 'Fruit' },
}

export const WithChildren: Story = {
  render: () => (
    <Select placeholder="Pick..." aria-label="Number">
      <SelectItem value="one">One</SelectItem>
      <SelectItem value="two">Two</SelectItem>
      <SelectItem value="three">Three</SelectItem>
    </Select>
  ),
}
