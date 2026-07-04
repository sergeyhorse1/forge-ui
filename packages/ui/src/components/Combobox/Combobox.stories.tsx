import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { Combobox } from './Combobox'
import type { ComboboxItems } from './types'

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'grape', label: 'Grape' },
]

const grouped = [
  {
    label: 'Citrus',
    items: [
      { value: 'lemon', label: 'Lemon' },
      { value: 'lime', label: 'Lime' },
      { value: 'orange', label: 'Orange' },
    ],
  },
  {
    label: 'Berries',
    items: [
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'raspberry', label: 'Raspberry' },
    ],
  },
]

const withDisabled = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved', disabled: true },
  { value: 'sold', label: 'Sold', disabled: true },
  { value: 'draft', label: 'Draft' },
]

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { items: fruits, placeholder: 'Search fruit…', 'aria-label': 'Fruit' },
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.type(input, 'ap')
    const body = within(document.body)
    await expect(body.getByRole('option', { name: 'Apple' })).toBeInTheDocument()
    await expect(body.getByRole('option', { name: 'Apricot' })).toBeInTheDocument()
    await expect(body.queryByRole('option', { name: 'Banana' })).toBeNull()
  },
}

export const Groups: Story = {
  args: { items: grouped, placeholder: 'Search…', 'aria-label': 'Produce' },
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.click(input)
    const body = within(document.body)
    await expect(body.getByRole('group', { name: 'Citrus' })).toBeInTheDocument()
    await expect(body.getByRole('option', { name: 'Lemon' })).toBeInTheDocument()
  },
}

export const DisabledOptions: Story = {
  args: { items: withDisabled, defaultOpen: true, placeholder: 'Pick…', 'aria-label': 'Status' },
}

function fetchFruits(query: string): Promise<ComboboxItems> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const q = query.trim().toLowerCase()
      resolve(q === '' ? fruits : fruits.filter((item) => item.label.toLowerCase().includes(q)))
    }, 600)
  })
}

export const Async: Story = {
  args: {
    loadItems: fetchFruits,
    debounceMs: 300,
    placeholder: 'Type to search…',
    'aria-label': 'Async fruit',
    loadingText: 'Loading…',
    emptyText: 'No fruit found',
  },
}

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('banana')
    const [text, setText] = useState('Banana')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Combobox
          {...args}
          items={fruits}
          value={value}
          onValueChange={setValue}
          inputValue={text}
          onInputValueChange={setText}
          aria-label="Controlled fruit"
        />
        <p style={{ fontSize: 12 }}>Selected: {value || '—'}</p>
      </div>
    )
  },
}
