import '@testing-library/jest-dom/vitest'

import { useState, type RefObject } from 'react'
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FilterBuilder } from './FilterBuilder'
import { operatorsForField, type FilterFieldSchema } from './schema'
import { summarizeRule, summarizeRuleText, summarizeGroup } from './summary'
import { useFilterMode } from './useFilterMode'
import type { FilterRule, FilterTree } from './types'

const SCHEMA: FilterFieldSchema = [
  { field: 'name', label: 'Name', type: 'string' },
  { field: 'price', label: 'Price', type: 'number' },
  { field: 'createdAt', label: 'Created', type: 'date' },
  { field: 'active', label: 'Active', type: 'boolean' },
  {
    field: 'plan',
    label: 'Plan',
    type: 'enum',
    options: [
      { label: 'Free', value: 'free' },
      { label: 'Pro', value: 'pro' },
      { label: 'Team', value: 'team' },
    ],
  },
  {
    field: 'rank',
    label: 'Rank',
    type: 'enum',
    options: [
      { label: 'Bronze', value: 1 },
      { label: 'Silver', value: 2 },
      { label: 'Gold', value: 3 },
    ],
  },
]

function SchemaHost({
  initial,
  mode,
}: {
  initial: FilterTree
  mode?: 'expanded' | 'compact'
}) {
  const [value, setValue] = useState<FilterTree>(initial)
  return (
    <FilterBuilder value={value} onChange={setValue} fields={SCHEMA} mode={mode} />
  )
}

function treeOf(rule: FilterRule): FilterTree {
  return { combinator: 'and', rules: [rule] }
}

describe('Filter operator menu — valid choices per field type', () => {
  it('offers chronological operators including a range for a date field', () => {
    const ids = operatorsForField('createdAt', SCHEMA).map((op) => op.value)
    expect(ids).toEqual(['before', 'after', 'between'])
  })

  it('never offers a free-text contains operator outside string fields', () => {
    for (const field of ['price', 'createdAt', 'active', 'plan']) {
      const ids = operatorsForField(field, SCHEMA).map((op) => op.value)
      expect(ids).not.toContain('contains')
    }
  })

  it('never offers a two-handle between operator on a boolean field', () => {
    const ids = operatorsForField('active', SCHEMA).map((op) => op.value)
    expect(ids).not.toContain('between')
  })

  it('falls back to the full type set when a field allow-list is empty', () => {
    const schema: FilterFieldSchema = [
      { field: 'cost', label: 'Cost', type: 'number', operators: [] },
    ]
    const ids = operatorsForField('cost', schema).map((op) => op.value)
    expect(ids).toEqual(['eq', 'neq', 'lt', 'gt', 'lte', 'gte', 'between'])
  })

  it('falls back to the full type set when the allow-list matches nothing', () => {
    const schema: FilterFieldSchema = [
      { field: 'cost', label: 'Cost', type: 'number', operators: ['contains'] },
    ]
    const ids = operatorsForField('cost', schema).map((op) => op.value)
    expect(ids).toEqual(['eq', 'neq', 'lt', 'gt', 'lte', 'gte', 'between'])
  })
})

describe('Rule value control — widget matches the field type', () => {
  it('uses a date picker for a date field', () => {
    render(<SchemaHost initial={treeOf({ field: 'createdAt', operator: 'before', value: '2026-01-01' })} />)
    const control = screen.getByLabelText('Created value') as HTMLInputElement
    expect(control.tagName).toBe('INPUT')
    expect(control.type).toBe('date')
  })

  it('uses a true/false select for a boolean field', () => {
    render(<SchemaHost initial={treeOf({ field: 'active', operator: 'is', value: true })} />)
    const control = screen.getByLabelText('Active value') as HTMLSelectElement
    expect(control.tagName).toBe('SELECT')
    expect(Array.from(control.options, (o) => o.value)).toEqual(['true', 'false'])
    expect(control.value).toBe('true')
  })

  it('uses an options select for an enum field', () => {
    render(<SchemaHost initial={treeOf({ field: 'plan', operator: 'is', value: 'pro' })} />)
    const control = screen.getByLabelText('Plan value') as HTMLSelectElement
    expect(control.tagName).toBe('SELECT')
    expect(Array.from(control.options, (o) => o.textContent)).toEqual([
      'Free',
      'Pro',
      'Team',
    ])
    expect(control.value).toBe('pro')
  })

  it('uses a multi-select for an enum in operator', () => {
    render(<SchemaHost initial={treeOf({ field: 'plan', operator: 'in', value: ['pro', 'team'] })} />)
    const control = screen.getByLabelText('Plan value') as HTMLSelectElement
    expect(control.multiple).toBe(true)
    const selected = Array.from(control.selectedOptions, (o) => o.value)
    expect(selected).toEqual(['pro', 'team'])
  })

  it('keeps a numeric value typed as a number through onChange', () => {
    const onChange = vi.fn()
    const value: FilterTree = treeOf({ field: 'price', operator: 'eq', value: 10 })
    render(<FilterBuilder value={value} onChange={onChange} fields={SCHEMA} />)

    fireEvent.change(screen.getByLabelText('Price value'), {
      target: { value: '42' },
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0]![0] as FilterTree
    const edited = next.rules[0] as FilterRule
    expect(edited.value).toBe(42)
    expect(typeof edited.value).toBe('number')
  })

  it('decodes a numeric enum option back to its number value', () => {
    const onChange = vi.fn()
    const value: FilterTree = treeOf({ field: 'rank', operator: 'is', value: 1 })
    render(<FilterBuilder value={value} onChange={onChange} fields={SCHEMA} />)

    fireEvent.change(screen.getByLabelText('Rank value'), {
      target: { value: '3' },
    })

    const next = onChange.mock.calls[0]![0] as FilterTree
    const edited = next.rules[0] as FilterRule
    expect(edited.value).toBe(3)
    expect(typeof edited.value).toBe('number')
  })
})

describe('Filter summary — two-item enum is not read as a range', () => {
  // Текст чипа разводит массив по inputKind оператора: двухэлементный enum in
  // склеивает лейблы запятыми, а between той же арности читается «a – b».
  // Двухэлементный in не должен схлопнуться в форму с тире.
  it('joins a two-item enum membership rather than dashing it', () => {
    const rule: FilterRule = { field: 'plan', operator: 'in', value: ['pro', 'team'] }
    const text = summarizeRule(rule, SCHEMA).value
    expect(text).toBe('Pro, Team')
    expect(text).not.toContain('–')
  })

  it('renders an enum membership chip without range punctuation', () => {
    render(
      <SchemaHost
        initial={treeOf({ field: 'plan', operator: 'in', value: ['pro', 'team'] })}
        mode="compact"
      />,
    )
    expect(screen.getByText('Pro, Team')).toBeInTheDocument()
  })
})

describe('Filter summary — value formatting', () => {
  it('renders a boolean value as true/false text', () => {
    const rule: FilterRule = { field: 'active', operator: 'is', value: false }
    expect(summarizeRule(rule, SCHEMA).value).toBe('false')
  })

  it('falls back to an em dash for an empty value', () => {
    const rule: FilterRule = { field: 'name', operator: 'contains', value: '' }
    expect(summarizeRule(rule, SCHEMA).value).toBe('—')
  })

  it('joins field, operator and value into one readable line', () => {
    const rule: FilterRule = { field: 'price', operator: 'gt', value: 100 }
    expect(summarizeRuleText(rule, SCHEMA)).toBe('Price > 100')
  })

  it('captions a group by its combinator and child count', () => {
    const group: FilterTree = {
      combinator: 'or',
      rules: [
        { field: 'name', operator: 'contains', value: 'a' },
        { field: 'price', operator: 'gt', value: 1 },
      ],
    }
    expect(summarizeGroup(group)).toBe('OR of 2 conditions')
  })
})

describe('Filter summary — nested groups', () => {
  it('captions a nested group with its own child count', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'name', operator: 'contains', value: 'acme' },
        {
          combinator: 'or',
          rules: [
            { field: 'plan', operator: 'is', value: 'pro' },
            { field: 'plan', operator: 'is', value: 'team' },
          ],
        },
      ],
    }
    render(<SchemaHost initial={tree} mode="compact" />)

    expect(screen.getByText('AND of 2 conditions')).toBeInTheDocument()
    expect(screen.getByText('OR of 2 conditions')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Team')).toBeInTheDocument()
  })
})

describe('Filter rule editor — changing the operator reshapes the value', () => {
  // Переключение number-правила со скалярного сравнения на between должно
  // превратить один контрол в двуручьевой range, перенеся старый скаляр, а обратно
  // — снова схлопнуть в один контрол.
  it('grows a single control into a range when choosing between', () => {
    function Host() {
      const [value, setValue] = useState<FilterTree>(
        treeOf({ field: 'price', operator: 'eq', value: 7 }),
      )
      return <FilterBuilder value={value} onChange={setValue} fields={SCHEMA} />
    }
    render(<Host />)

    expect(screen.queryByLabelText('Price value from')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Operator'), {
      target: { value: 'between' },
    })

    const from = screen.getByLabelText('Price value from') as HTMLInputElement
    const to = screen.getByLabelText('Price value to') as HTMLInputElement
    expect(from.value).toBe('7')
    expect(to.value).toBe('')
  })

  it('collapses a range back to a single control when leaving between', () => {
    function Host() {
      const [value, setValue] = useState<FilterTree>(
        treeOf({ field: 'price', operator: 'between', value: [10, 20] }),
      )
      return <FilterBuilder value={value} onChange={setValue} fields={SCHEMA} />
    }
    render(<Host />)

    fireEvent.change(screen.getByLabelText('Operator'), {
      target: { value: 'gt' },
    })

    expect(screen.queryByLabelText('Price value from')).not.toBeInTheDocument()
    const single = screen.getByLabelText('Price value') as HTMLInputElement
    expect(single.value).toBe('10')
  })
})

describe('Filter rule editor — changing the field discards an invalid combination', () => {
  // Load-bearing: string-правило с contains "abc", переключённое на числовое поле,
  // не должно уцелеть с текстовым оператором или текстовым значением. Ровно эту
  // ловушку ломает мутация reconcileField.
  function StringToNumberHost() {
    const [value, setValue] = useState<FilterTree>(
      treeOf({ field: 'name', operator: 'contains', value: 'abc' }),
    )
    return <FilterBuilder value={value} onChange={setValue} fields={SCHEMA} />
  }

  it('replaces a text operator and value with valid numeric ones', () => {
    render(<StringToNumberHost />)

    fireEvent.change(screen.getByLabelText('Field'), {
      target: { value: 'price' },
    })

    const operator = screen.getByLabelText('Operator') as HTMLSelectElement
    const numericIds = operatorsForField('price', SCHEMA).map((op) => op.value)
    // Перенесённый текстовый оператор исчез; правило показывает валидный числовой.
    expect(operator.value).not.toBe('contains')
    expect(numericIds).toContain(operator.value)

    // Числовой контрол на месте, и устаревшее текстовое значение не просочилось.
    const numberControl = screen.getByLabelText('Price value') as HTMLInputElement
    expect(numberControl.type).toBe('number')
    expect(numberControl.value).not.toBe('abc')
    expect(numberControl.value).toBe('')
  })

  it('does not leave a contains option selectable after the numeric switch', () => {
    render(<StringToNumberHost />)

    fireEvent.change(screen.getByLabelText('Field'), {
      target: { value: 'price' },
    })

    const operator = screen.getByLabelText('Operator') as HTMLSelectElement
    const optionIds = Array.from(operator.options, (o) => o.value)
    expect(optionIds).not.toContain('contains')
  })
})

describe('Filter rule editor — controlled with a schema, no mirrored tree', () => {
  // Schema-driven хост, глотающий все изменения, не должен оптимистично обновлять
  // видимый контрол значения: внутреннего зеркала дерева нет.
  it('keeps the operator unchanged when the host ignores onChange', () => {
    const value: FilterTree = treeOf({ field: 'price', operator: 'eq', value: 1 })
    render(<FilterBuilder value={value} onChange={() => {}} fields={SCHEMA} />)

    const operator = screen.getByLabelText('Operator') as HTMLSelectElement
    expect(operator.value).toBe('eq')
    fireEvent.change(operator, { target: { value: 'between' } })
    // Range-контролов нет: проглоченное изменение так и не перерисовало компонент.
    expect(screen.queryByLabelText('Price value from')).not.toBeInTheDocument()
    const after = screen.getByLabelText('Operator') as HTMLSelectElement
    expect(after.value).toBe('eq')
  })
})

describe('Compact and expanded modes share one value', () => {
  it('shows read-only chips in compact and controls in expanded for the same tree', () => {
    const tree: FilterTree = treeOf({ field: 'price', operator: 'gt', value: 100 })

    const compact = render(<SchemaHost initial={tree} mode="compact" />)
    expect(screen.queryByLabelText('Field')).not.toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('>')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    compact.unmount()

    render(<SchemaHost initial={tree} mode="expanded" />)
    expect(screen.getByLabelText('Field')).toBeInTheDocument()
    expect(screen.getByLabelText('Price value')).toBeInTheDocument()
  })
})

describe('useFilterMode — resolving the display mode', () => {
  const ORIGINAL_RESIZE_OBSERVER = globalThis.ResizeObserver

  class StubResizeObserver {
    static last: StubResizeObserver | undefined
    callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
      StubResizeObserver.last = this
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    emit(width: number) {
      this.callback(
        [{ contentRect: { width } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      )
    }
  }

  function refToWidth(width: number): RefObject<HTMLElement | null> {
    const node = {
      getBoundingClientRect: () => ({ width }) as DOMRect,
    } as HTMLElement
    return { current: node }
  }

  beforeEach(() => {
    StubResizeObserver.last = undefined
    globalThis.ResizeObserver =
      StubResizeObserver as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    globalThis.ResizeObserver = ORIGINAL_RESIZE_OBSERVER
  })

  it('forces compact regardless of width', () => {
    const { result } = renderHook(() => useFilterMode('compact', refToWidth(2000)))
    expect(result.current).toBe('compact')
  })

  it('forces expanded regardless of width', () => {
    const { result } = renderHook(() => useFilterMode('expanded', refToWidth(100)))
    expect(result.current).toBe('expanded')
  })

  it('resolves auto to compact on a narrow container', () => {
    const ref = refToWidth(360)
    const { result } = renderHook(() => useFilterMode('auto', ref, 480))
    expect(result.current).toBe('compact')
  })

  it('resolves auto to expanded on a wide container', () => {
    const ref = refToWidth(900)
    const { result } = renderHook(() => useFilterMode('auto', ref, 480))
    expect(result.current).toBe('expanded')
  })

  it('switches auto from expanded to compact as the container shrinks', () => {
    // Стабильный ref, чтобы ре-рендер не перезапустил эффект и не перемерил.
    const ref = refToWidth(900)
    const { result } = renderHook(() => useFilterMode('auto', ref, 480))
    expect(result.current).toBe('expanded')

    act(() => {
      StubResizeObserver.last!.emit(300)
    })
    expect(result.current).toBe('compact')
  })
})
