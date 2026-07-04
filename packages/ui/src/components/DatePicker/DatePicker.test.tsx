import '@testing-library/jest-dom/vitest'

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DatePicker } from './DatePicker'
import type { DateRange } from './types'

const july2026 = new Date(2026, 6, 10)

describe('DatePicker — single', () => {
  it('shows the placeholder when nothing is selected', () => {
    render(<DatePicker aria-label="Date" placeholder="Choose a day" />)
    expect(screen.getByRole('button', { name: 'Date' })).toHaveTextContent('Choose a day')
  })

  it('formats the default value in the trigger', () => {
    render(<DatePicker aria-label="Date" defaultValue={july2026} />)
    expect(screen.getByRole('button', { name: 'Date' })).toHaveTextContent('Jul 10, 2026')
  })

  it('selects a day (uncontrolled) and updates the trigger', async () => {
    const user = userEvent.setup()
    render(<DatePicker aria-label="Date" defaultValue={july2026} />)
    await user.click(screen.getByRole('button', { name: 'Date' }))
    const dialog = await screen.findByRole('grid')
    await user.click(within(dialog).getByText('15'))
    expect(screen.getByRole('button', { name: 'Date' })).toHaveTextContent('Jul 15, 2026')
  })

  it('calls onValueChange with a Date (controlled)', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(<DatePicker aria-label="Date" value={july2026} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Date' }))
    const grid = await screen.findByRole('grid')
    await user.click(within(grid).getByText('20'))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.calls[0]![0]).toBeInstanceOf(Date)
  })
})

describe('DatePicker — keyboard', () => {
  it('navigates days with the arrow keys and selects with Enter', async () => {
    const onValueChange = vi.fn<(date: Date | undefined) => void>()
    const user = userEvent.setup()
    render(
      <DatePicker aria-label="Date" defaultValue={july2026} onValueChange={onValueChange} />,
    )
    await user.click(screen.getByRole('button', { name: 'Date' }))
    const grid = await screen.findByRole('grid')

    // Стартуем с выбранного дня (10), стрелкой вправо переходим на 11.
    const day10 = within(grid).getByText('10')
    day10.focus()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{Enter}')

    expect(onValueChange).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Date' })).toHaveTextContent('Jul 11, 2026')
  })

  it('selects the focused day with Space', async () => {
    const user = userEvent.setup()
    render(<DatePicker aria-label="Date" defaultValue={july2026} />)
    await user.click(screen.getByRole('button', { name: 'Date' }))
    const grid = await screen.findByRole('grid')

    const day10 = within(grid).getByText('10')
    day10.focus()
    await user.keyboard('{ArrowDown}') // +7 дней → 17
    await user.keyboard(' ')

    expect(screen.getByRole('button', { name: 'Date' })).toHaveTextContent('Jul 17, 2026')
  })
})

describe('DatePicker — range', () => {
  it('builds a range and shows both ends in the trigger', async () => {
    const onValueChange = vi.fn<(range: DateRange | undefined) => void>()
    const user = userEvent.setup()
    render(
      <DatePicker
        mode="range"
        aria-label="Range"
        defaultValue={{ from: july2026, to: undefined }}
        numberOfMonths={1}
        onValueChange={onValueChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Range' }))
    const grid = await screen.findByRole('grid')
    await user.click(within(grid).getByText('20'))
    // from=10 (default) → клик по 20 задаёт to; триггер показывает диапазон через «–».
    expect(screen.getByRole('button', { name: 'Range' })).toHaveTextContent('–')
    expect(onValueChange).toHaveBeenCalled()
  })
})

describe('DatePicker — locale', () => {
  // Заголовки недели живут в aria-hidden thead → не имеют role columnheader,
  // читаем их напрямую из DOM.
  it('starts the week on Monday for ru', async () => {
    const user = userEvent.setup()
    render(<DatePicker aria-label="Дата" locale="ru" defaultValue={july2026} />)
    await user.click(screen.getByRole('button', { name: 'Дата' }))
    const grid = await screen.findByRole('grid')
    const weekdays = grid.querySelectorAll('thead th')
    expect(weekdays[0]).toHaveTextContent(/пн/i)
  })

  it('starts the week on Sunday for en', async () => {
    const user = userEvent.setup()
    render(<DatePicker aria-label="Date" locale="en" defaultValue={july2026} />)
    await user.click(screen.getByRole('button', { name: 'Date' }))
    const grid = await screen.findByRole('grid')
    const weekdays = grid.querySelectorAll('thead th')
    expect(weekdays[0]).toHaveTextContent(/su/i)
  })
})
