import '@testing-library/jest-dom/vitest'

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Combobox } from './Combobox'
import type { ComboboxOption, ComboboxItems, UseComboboxResult } from '.'

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
    // Текст есть и в портальном статусе, и в sr-only live-region — скоупим на список.
    expect(within(screen.getByRole('listbox')).getByText('Nothing here')).toBeInTheDocument()
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

  it('opens and highlights the first option with ArrowDown when closed', () => {
    render(<Combobox items={fruits} aria-label="Fruit" />)
    const input = getCombobox()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-expanded', 'true')
    const options = screen.getAllByRole('option')
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id)
  })

  it('opens and highlights the last enabled option with ArrowUp when closed', () => {
    render(<Combobox items={fruits} aria-label="Fruit" />)
    const input = getCombobox()
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    const options = screen.getAllByRole('option')
    // cherry disabled → последняя доступная banana (индекс 2).
    expect(input).toHaveAttribute('aria-activedescendant', options[2]!.id)
  })

  it('clamps the active option at both ends without wrapping', () => {
    render(<Combobox items={fruits} defaultOpen aria-label="Fruit" />)
    const input = getCombobox()
    const options = screen.getAllByRole('option')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    // Уже на первой опции — вверх не заворачивает на последнюю.
    expect(input).toHaveAttribute('aria-activedescendant', options[0]!.id)
    for (let i = 0; i < 5; i += 1) fireEvent.keyDown(input, { key: 'ArrowDown' })
    // Упираемся в последнюю доступную, без wrap на первую.
    expect(input).toHaveAttribute('aria-activedescendant', options[2]!.id)
  })

  it('closes on Tab and keeps the input value', () => {
    render(<Combobox items={fruits} defaultInputValue="ap" defaultOpen aria-label="Fruit" />)
    const input = getCombobox()
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveValue('ap')
  })

  it('clears the input on a second Escape once the listbox is closed', () => {
    render(<Combobox items={fruits} defaultInputValue="ap" defaultOpen aria-label="Fruit" />)
    const input = getCombobox()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveValue('ap')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveValue('')
  })

  it('references the listbox with aria-controls only while open', () => {
    render(<Combobox items={fruits} aria-label="Fruit" />)
    const input = getCombobox()
    expect(input).not.toHaveAttribute('aria-controls')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id)
  })

  it('filters case-insensitively regardless of query casing', () => {
    render(<Combobox items={fruits} defaultOpen aria-label="Fruit" />)
    fireEvent.change(getCombobox(), { target: { value: 'AP' } })
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Apricot' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Banana' })).not.toBeInTheDocument()
  })

  it('treats a whitespace-only query as no filter', () => {
    render(<Combobox items={fruits} defaultOpen aria-label="Fruit" />)
    fireEvent.change(getCombobox(), { target: { value: '   ' } })
    expect(screen.getAllByRole('option')).toHaveLength(fruits.length)
  })

  it('does not select a disabled option on click', () => {
    const onValueChange = vi.fn()
    render(<Combobox items={fruits} defaultOpen onValueChange={onValueChange} aria-label="Fruit" />)
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(getCombobox()).toHaveAttribute('aria-expanded', 'true')
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
    // Видимая статус-строка теперь презентационная (role=status только у sr-only анонсера).
    expect(within(screen.getByRole('listbox')).getByText('Loading…')).toBeInTheDocument()

    await settle('ab', [{ value: 'ab', label: 'AB result' }])
    expect(screen.getByRole('option', { name: 'AB result' })).toBeInTheDocument()
  })

  it('never flashes the empty state before the first async resolve', () => {
    const { load } = deferredLoader()
    render(
      <Combobox
        loadItems={load}
        debounceMs={300}
        emptyText="No matches"
        loadingText="Loading…"
        aria-label="Search"
      />,
    )
    fireEvent.change(getCombobox(), { target: { value: 'a' } })
    // Первый кадр после открытия async: показываем loading, а не ложный empty.
    const listbox = screen.getByRole('listbox')
    expect(within(listbox).queryByText('No matches')).not.toBeInTheDocument()
    expect(within(listbox).getByText('Loading…')).toBeInTheDocument()
  })

  it('shows the empty state when the loader resolves with nothing', async () => {
    const { load, settle } = deferredLoader()
    render(
      <Combobox loadItems={load} debounceMs={300} emptyText="No matches" aria-label="Search" />,
    )
    const input = getCombobox()
    fireEvent.change(input, { target: { value: 'zz' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    await settle('zz', [])
    expect(within(screen.getByRole('listbox')).getByText('No matches')).toBeInTheDocument()
    expect(input).not.toHaveAttribute('aria-activedescendant')
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

  it('drops aria-activedescendant while a request is loading', async () => {
    const { load, settle } = deferredLoader()
    render(<Combobox loadItems={load} debounceMs={300} aria-label="Search" />)
    const input = getCombobox()

    fireEvent.change(input, { target: { value: 'a' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    await settle('a', [{ value: 'a', label: 'Alpha' }])
    // Результаты пришли → активная опция подсвечена.
    expect(input).toHaveAttribute('aria-activedescendant')

    // Новый запрос → снова loading, узла активной опции в DOM нет.
    fireEvent.change(input, { target: { value: 'ab' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(input).toHaveAttribute('aria-busy', 'true')
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })
})

describe('Combobox — grouping edge cases', () => {
  it('does not render a heading for a group with no matches', () => {
    const grouped = [
      { label: 'Fruit', items: [{ value: 'apple', label: 'Apple' }] },
      { label: 'Veg', items: [{ value: 'carrot', label: 'Carrot' }] },
    ]
    render(<Combobox items={grouped} defaultInputValue="app" defaultOpen aria-label="Food" />)
    expect(screen.getByRole('group', { name: 'Fruit' })).toBeInTheDocument()
    // Пустая после фильтра группа не оставляет висячий заголовок.
    expect(screen.queryByText('Veg')).not.toBeInTheDocument()
  })

  it('drops an already-empty group even without a query', () => {
    const grouped = [
      { label: 'Fruit', items: [{ value: 'apple', label: 'Apple' }] },
      { label: 'Empty', items: [] },
    ]
    render(<Combobox items={grouped} defaultOpen aria-label="Food" />)
    expect(screen.queryByText('Empty')).not.toBeInTheDocument()
  })

  it('renders duplicate-value items as distinct options (stable keys)', () => {
    const dupes = [
      { value: 'x', label: 'First X' },
      { value: 'x', label: 'Second X' },
    ]
    render(<Combobox items={dupes} defaultOpen aria-label="Dupes" />)
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })
})

describe('Combobox — public headless types', () => {
  it('re-exports the hook result and option types', () => {
    const asResult = (result: UseComboboxResult): ComboboxOption[] => result.options
    expect(asResult).toBeTypeOf('function')
  })
})
