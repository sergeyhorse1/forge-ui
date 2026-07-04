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

// Возвращает alpha цвета; rgba(0,0,0,0)/transparent → 0, непрозрачный → 1.
function alphaOf(color: string): number {
  if (color === 'transparent') return 0
  const match = color.match(/rgba?\(([^)]+)\)/)
  if (!match) return 1
  const parts = match[1]!.split(',').map((part) => part.trim())
  return parts.length === 4 ? Number.parseFloat(parts[3]!) : 1
}

export const SelectedPaint: Story = {
  args: { 'aria-label': 'Date', defaultValue: new Date(2026, 6, 10) },
  tags: ['test'],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Date' }))
    const grid = await within(document.body).findByRole('grid')

    // Выбранный день реально залит (не rgba(0,0,0,0)).
    const selected = grid.querySelector('td[data-selected="true"] button') as HTMLElement
    await expect(selected).not.toBeNull()
    await expect(alphaOf(getComputedStyle(selected).backgroundColor)).toBe(1)
    // Focus-ring на выбранном дне различим (гоча 9e): box-shadow появляется.
    selected.focus()
    await expect(getComputedStyle(selected).boxShadow).not.toBe('none')

    // «Сегодня» (не выбран) несёт рамку primary и НЕ залит как выбранный.
    const today = grid.querySelector('td[data-today="true"]:not([data-selected="true"]) button') as HTMLElement
    await expect(today).not.toBeNull()
    await expect(Number.parseFloat(getComputedStyle(today).borderTopWidth)).toBeGreaterThan(0)
    await expect(alphaOf(getComputedStyle(today).backgroundColor)).toBe(0)
  },
}

export const RangePaint: Story = {
  args: {
    mode: 'range',
    'aria-label': 'Trip',
    numberOfMonths: 1,
    defaultValue: { from: new Date(2026, 6, 8), to: new Date(2026, 6, 14) },
  },
  tags: ['test'],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Trip' }))
    const grid = await within(document.body).findByRole('grid')

    const start = getComputedStyle(within(grid).getByText('8')).backgroundColor
    const middle = getComputedStyle(within(grid).getByText('11')).backgroundColor
    const end = getComputedStyle(within(grid).getByText('14')).backgroundColor

    // Все три залиты (непрозрачны).
    await expect(alphaOf(start)).toBe(1)
    await expect(alphaOf(middle)).toBe(1)
    await expect(alphaOf(end)).toBe(1)
    // Концы — primary (одинаковы), середина — accent (отличается от концов).
    await expect(end).toBe(start)
    await expect(middle).not.toBe(start)
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
