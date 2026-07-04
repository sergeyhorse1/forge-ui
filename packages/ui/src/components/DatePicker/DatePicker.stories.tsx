import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { DatePicker } from './DatePicker'
import type { DatePickerProps, DateRange } from './types'

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    locale: { control: 'radio', options: ['en', 'ru'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>

export default meta
// Пропсы DatePicker — дискриминированный union (single|range); StoryObj<typeof meta>
// схлопывает args в never, поэтому типизируем от самого union.
type Story = StoryObj<DatePickerProps>

export const Single: Story = {
  args: { 'aria-label': 'Date', placeholder: 'Pick a date' },
  tags: ['test'],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Date' })
    await userEvent.click(trigger)
    const grid = await within(document.body).findByRole('grid')
    await expect(grid).toBeInTheDocument()
  },
}

export const WithDefault: Story = {
  args: { 'aria-label': 'Date', defaultValue: new Date(2026, 6, 4) },
}

export const RussianLocale: Story = {
  args: { 'aria-label': 'Дата', locale: 'ru', defaultValue: new Date(2026, 6, 4) },
  tags: ['test'],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Дата' })
    await userEvent.click(trigger)
    const grid = await within(document.body).findByRole('grid')
    // Заголовки недели в aria-hidden thead → без role columnheader, читаем из DOM.
    const weekdays = grid.querySelectorAll('thead th')
    await expect(weekdays[0]).toHaveTextContent(/пн/i)
  },
}

export const Range: Story = {
  args: {
    mode: 'range',
    'aria-label': 'Trip dates',
    placeholder: 'Pick a range',
    defaultValue: { from: new Date(2026, 6, 8), to: new Date(2026, 6, 14) },
  },
}

export const Controlled: Story = {
  render: (args: DatePickerProps) => {
    const [range, setRange] = useState<DateRange | undefined>({
      from: new Date(2026, 6, 10),
      to: new Date(2026, 6, 16),
    })
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <DatePicker
          mode="range"
          locale={args.locale}
          size={args.size}
          aria-label="Controlled range"
          value={range}
          onValueChange={setRange}
        />
        <p style={{ fontSize: 12 }}>
          {range?.from ? range.from.toDateString() : '—'} …{' '}
          {range?.to ? range.to.toDateString() : '—'}
        </p>
      </div>
    )
  },
}
