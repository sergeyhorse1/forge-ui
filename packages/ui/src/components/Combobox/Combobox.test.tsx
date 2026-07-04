import '@testing-library/jest-dom/vitest'

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Combobox } from './Combobox'
import type { ComboboxItems } from './types'

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
]

const groups = [
  { label: 'Citrus', items: [{ value: 'lemon', label: 'Lemon' }, { value: 'lime', label: 'Lime' }] },
  { label: 'Berries', items: [{ value: 'strawberry', label: 'Strawberry' }] },
]

function getCombobox() {
  return screen.getByRole('combobox')
}

describe('Combobox — synchronous', () => {
  it('exposes the WAI-ARIA combobox attributes', () => {
    render(<Combobox items={fruits} aria-label="Fruit" />)
    const input = getCombobox()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
  })

  it('opens and filters options as the user types', () => {
    render(<Combobox items={fruits} aria-label="Fruit" />)
    const input = getCombobox()
    fireEvent.change(input, { target: { value: 'ap' } })
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Apricot' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Banana' })).not.toBeInTheDocument()
  })

  it('renders grouped options with a labelled group', () => {
    render(<Combobox items={groups} defaultOpen aria-label="Fruit" />)
    const group = screen.getByRole('group', { name: 'Citrus' })
    expect(within(group).getByRole('option', { name: 'Lemon' })).toBeInTheDocument()
    expect(within(group).getByRole('option', { name: 'Lime' })).toBeInTheDocument()
  })

  it('moves the active option with the arrow keys and Home/End', () => {
    render(<Combobox items={fruits} defaultOpen aria-label="Fruit" />)
    const input = getCombobox()
    const options = screen.getAllByRole('option')

    // Первая доступная опция активна при открытии.
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id)

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', options[1]!.id)

    fireEvent.keyDown(input, { key: 'End' })
    // cherry (последняя) disabled → End останавливается на banana (индекс 2).
    expect(input).toHaveAttribute('aria-activedescendant', options[2]!.id)

    fireEvent.keyDown(input, { key: 'Home' })
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id)
  })

  it('skips disabled options during navigation', () => {
    render(<Combobox items={fruits} defaultOpen aria-label="Fruit" />)
    const input = getCombobox()
    const options = screen.getAllByRole('option')
    fireEvent.keyDown(input, { key: 'End' })
    // Не должна встать на disabled cherry.
    expect(input).not.toHaveAttribute('aria-activedescendant', options[3]!.id)
    expect(options[3]!).toHaveAttribute('aria-disabled', 'true')
  })

  it('selects the active option with Enter', () => {
    const onValueChange = vi.fn()
    render(<Combobox items={fruits} onValueChange={onValueChange} aria-label="Fruit" />)
    const input = getCombobox()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledWith('apricot')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveValue('Apricot')
  })

  it('selects an option on click', () => {
    const onValueChange = vi.fn()
    render(<Combobox items={fruits} defaultOpen onValueChange={onValueChange} aria-label="Fruit" />)
    fireEvent.click(screen.getByRole('option', { name: 'Banana' }))
    expect(onValueChange).toHaveBeenCalledWith('banana')
  })

  it('marks the selected option with aria-selected', () => {
    // Пустой inputValue → фильтр не режет список, все опции видны.
    render(<Combobox items={fruits} value="banana" defaultOpen aria-label="Fruit" />)
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'false')
  })

  it('closes on Escape while keeping the input value', () => {
    render(<Combobox items={fruits} defaultInputValue="ap" defaultOpen aria-label="Fruit" />)
    const input = getCombobox()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveValue('ap')
  })

  it('shows the empty state when nothing matches', () => {
    render(<Combobox items={fruits} defaultOpen aria-label="Fruit" emptyText="Nothing here" />)
    fireEvent.change(getCombobox(), { target: { value: 'zzz' } })
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('works uncontrolled with a default value', () => {
    render(<Combobox items={fruits} defaultValue="apple" defaultInputValue="Apple" aria-label="Fruit" />)
    expect(getCombobox()).toHaveValue('Apple')
  })

  it('honours a controlled input value', () => {
    const onInputValueChange = vi.fn()
    render(
      <Combobox
        items={fruits}
        inputValue="controlled"
        onInputValueChange={onInputValueChange}
        aria-label="Fruit"
      />,
    )
    const input = getCombobox()
    expect(input).toHaveValue('controlled')
    fireEvent.change(input, { target: { value: 'controlledX' } })
    expect(onInputValueChange).toHaveBeenCalledWith('controlledX')
    // Значение управляется извне → инпут не меняется без обновления пропа.
    expect(input).toHaveValue('controlled')
  })
})

describe('Combobox — asynchronous', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function deferredLoader() {
    const calls: Array<{ query: string; resolve: (items: ComboboxItems) => void }> = []
    const load = vi.fn(
      (query: string) =>
        new Promise<ComboboxItems>((resolve) => {
          calls.push({ query, resolve })
        }),
    )
    const settle = async (query: string, items: ComboboxItems) => {
      const call = [...calls].reverse().find((entry) => entry.query === query && entry.resolve)
      await act(async () => {
        call!.resolve(items)
      })
    }
    return { load, settle }
  }

  it('debounces the query and shows loading then results', async () => {
    const { load, settle } = deferredLoader()
    render(<Combobox loadItems={load} debounceMs={300} aria-label="Search" />)
    const input = getCombobox()

    fireEvent.change(input, { target: { value: 'ab' } })
    // До истечения дебаунса запрос по 'ab' ещё не ушёл.
    expect(load).not.toHaveBeenCalledWith('ab')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(load).toHaveBeenCalledWith('ab')
    // Спиннер в инпуте тоже role=status — скоупим на список.
    expect(within(screen.getByRole('listbox')).getByRole('status')).toHaveTextContent('Loading…')

    await settle('ab', [{ value: 'ab', label: 'AB result' }])
    expect(screen.getByRole('option', { name: 'AB result' })).toBeInTheDocument()
  })

  it('discards a stale response when a newer query resolves first', async () => {
    const { load, settle } = deferredLoader()
    render(<Combobox loadItems={load} debounceMs={300} aria-label="Search" />)
    const input = getCombobox()

    fireEvent.change(input, { target: { value: 'a' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    fireEvent.change(input, { target: { value: 'ab' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    // Новый запрос ('ab') резолвится раньше устаревшего ('a').
    await settle('ab', [{ value: 'ab', label: 'Fresh' }])
    await settle('a', [{ value: 'a', label: 'Stale' }])

    expect(screen.getByRole('option', { name: 'Fresh' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Stale' })).not.toBeInTheDocument()
  })
})
