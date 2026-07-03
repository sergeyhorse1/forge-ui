import '@testing-library/jest-dom/vitest'

import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FilterBuilder } from './FilterBuilder'
import {
  coerceValue,
  defaultValueFor,
  reconcileField,
  reconcileOperator,
} from './reconcile'
import {
  defaultOperatorForField,
  operatorsForField,
  type FilterFieldSchema,
} from './schema'
import { describeCombinator, summarizeRule } from './summary'
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
    field: 'tier',
    label: 'Tier',
    type: 'string',
    operators: ['equals', 'contains'],
  },
  {
    field: 'region',
    label: 'Region',
    type: 'enum',
    options: [
      { label: 'East', value: 'east' },
      { label: 'West', value: 'west' },
    ],
  },
]

describe('operatorsForField — type-scoped operator sets', () => {
  it('offers string operators for a string field and excludes numeric ones', () => {
    const ids = operatorsForField('name', SCHEMA).map((op) => op.value)
    expect(ids).toContain('contains')
    expect(ids).not.toContain('between')
  })

  it('offers numeric operators including range for a number field', () => {
    const ids = operatorsForField('price', SCHEMA).map((op) => op.value)
    expect(ids).toEqual(['eq', 'neq', 'lt', 'gt', 'lte', 'gte', 'between'])
  })

  it('offers only is for a boolean field', () => {
    const ids = operatorsForField('active', SCHEMA).map((op) => op.value)
    expect(ids).toEqual(['is'])
  })

  it('offers enum operators including the multi in', () => {
    const ids = operatorsForField('plan', SCHEMA).map((op) => op.value)
    expect(ids).toEqual(['is', 'isNot', 'in'])
  })

  it('narrows and reorders to a field-level operators allow-list', () => {
    const ids = operatorsForField('tier', SCHEMA).map((op) => op.value)
    expect(ids).toEqual(['equals', 'contains'])
  })

  it('returns an empty set for an unknown field', () => {
    expect(operatorsForField('nope', SCHEMA)).toEqual([])
  })
})

describe('defaultValueFor — per type and input kind', () => {
  it('string single is empty', () => {
    expect(defaultValueFor('string', 'single')).toBe('')
  })

  it('boolean single is false', () => {
    expect(defaultValueFor('boolean', 'single')).toBe(false)
  })

  it('range is a two-default tuple', () => {
    expect(defaultValueFor('number', 'range')).toEqual(['', ''])
  })

  it('multi is an empty array', () => {
    expect(defaultValueFor('enum', 'multi')).toEqual([])
  })

  it('enum single picks the first option value', () => {
    const config = SCHEMA.find((entry) => entry.field === 'plan')!
    expect(defaultValueFor('enum', 'single', config)).toBe('free')
  })
})

describe('coerceValue — reshaping across input kinds', () => {
  it('collapses a range to its first element when going single', () => {
    expect(coerceValue([5, 9], 'number', 'single')).toBe(5)
  })

  it('carries a scalar into a range when going range', () => {
    expect(coerceValue(5, 'number', 'range')).toEqual([5, ''])
  })

  it('wraps a meaningful scalar into a singleton when going multi', () => {
    expect(coerceValue('pro', 'enum', 'multi')).toEqual(['pro'])
  })

  it('treats an empty scalar as an empty multi list', () => {
    expect(coerceValue('', 'enum', 'multi')).toEqual([])
  })
})

describe('reconcileField — no broken combination after a field change', () => {
  it('resets operator and value when switching string → number', () => {
    const rule: FilterRule = { field: 'name', operator: 'contains', value: 'x' }
    const next = reconcileField(rule, 'price', SCHEMA)
    expect(next.field).toBe('price')
    // contains невалиден для чисел → сброс на дефолтный оператор числа.
    expect(next.operator).toBe(defaultOperatorForField('price', SCHEMA))
    expect(operatorsForField('price', SCHEMA).map((o) => o.value)).toContain(
      next.operator,
    )
    // Строковое значение не должно уцелеть как значение числового правила.
    expect(next.value).toBe('')
  })

  it('keeps a shared operator across two string fields', () => {
    const rule: FilterRule = { field: 'name', operator: 'equals', value: 'x' }
    const next = reconcileField(rule, 'tier', SCHEMA)
    expect(next.operator).toBe('equals')
    expect(next.value).toBe('x')
  })

  it('resets to enum first option when switching to an enum field', () => {
    const rule: FilterRule = { field: 'name', operator: 'contains', value: 'x' }
    const next = reconcileField(rule, 'plan', SCHEMA)
    expect(next.operator).toBe('is')
    expect(next.value).toBe('free')
  })
})

describe('reconcileField — value reset when the field TYPE changes (shared op id)', () => {
  // Id операторов пересекаются между типами: between — число И дата, is — boolean
  // И enum. Сохранение id НЕ должно сохранять значение старого типа.
  it('drops a numeric range when moving to a date field that also has between', () => {
    const rule: FilterRule = {
      field: 'price',
      operator: 'between',
      value: [100, 200],
    }
    const next = reconcileField(rule, 'createdAt', SCHEMA)
    expect(next.field).toBe('createdAt')
    // Общий id оператора остаётся валиден для date-поля…
    expect(next.operator).toBe('between')
    // …но числовая пара не должна уцелеть в date-правиле.
    expect(next.value).not.toEqual([100, 200])
    expect(next.value).toEqual(['', ''])
  })

  it('drops a boolean value when moving to an enum field that also has is', () => {
    const rule: FilterRule = { field: 'active', operator: 'is', value: true }
    const next = reconcileField(rule, 'plan', SCHEMA)
    expect(next.field).toBe('plan')
    expect(next.operator).toBe('is')
    // У true нет подходящей enum-опции; сброс на значение первой опции.
    expect(next.value).not.toBe(true)
    expect(next.value).toBe('free')
  })

  it('sanitizes a value outside the new enum option set (enum → enum)', () => {
    const rule: FilterRule = { field: 'plan', operator: 'is', value: 'pro' }
    const next = reconcileField(rule, 'region', SCHEMA)
    expect(next.field).toBe('region')
    expect(next.operator).toBe('is')
    // 'pro' нет в опциях Region (east/west) → сброс на первую опцию.
    expect(next.value).not.toBe('pro')
    expect(next.value).toBe('east')
  })

  it('filters a multi enum value down to the new field option set', () => {
    const rule: FilterRule = {
      field: 'plan',
      operator: 'in',
      value: ['pro', 'team'],
    }
    const next = reconcileField(rule, 'region', SCHEMA)
    expect(next.operator).toBe('in')
    // Ни 'pro', ни 'team' нет в Region → массив опустошается.
    expect(next.value).toEqual([])
  })
})

describe('SchemaRuleEditor — value control re-renders after a type-changing field swap', () => {
  it('shows empty date inputs after number-between → date-between', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [{ field: 'price', operator: 'between', value: [100, 200] }],
    }
    render(<SchemaHost initial={tree} />)

    const field = screen.getByLabelText('Field') as HTMLSelectElement
    fireEvent.change(field, { target: { value: 'createdAt' } })

    const from = screen.getByLabelText('Created value from') as HTMLInputElement
    const to = screen.getByLabelText('Created value to') as HTMLInputElement
    expect(from.type).toBe('date')
    expect(to.type).toBe('date')
    expect(from.value).toBe('')
    expect(to.value).toBe('')
  })

  it('shows a valid enum option after boolean-is → enum-is', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [{ field: 'active', operator: 'is', value: true }],
    }
    render(<SchemaHost initial={tree} />)

    const field = screen.getByLabelText('Field') as HTMLSelectElement
    fireEvent.change(field, { target: { value: 'plan' } })

    const value = screen.getByLabelText('Plan value') as HTMLSelectElement
    expect(value.tagName).toBe('SELECT')
    expect(value.value).toBe('free')
  })
})

describe('reconcileOperator — reshaping value when arity changes', () => {
  it('reshapes single → range when moving to between', () => {
    const rule: FilterRule = { field: 'price', operator: 'eq', value: 42 }
    const next = reconcileOperator(rule, 'between', SCHEMA)
    expect(next.operator).toBe('between')
    expect(next.value).toEqual([42, ''])
  })

  it('reshapes range → single when leaving between', () => {
    const rule: FilterRule = {
      field: 'price',
      operator: 'between',
      value: [10, 20],
    }
    const next = reconcileOperator(rule, 'gt', SCHEMA)
    expect(next.operator).toBe('gt')
    expect(next.value).toBe(10)
  })
})

describe('summarizeRule — readable chip parts', () => {
  it('maps field label, operator verb and value', () => {
    const rule: FilterRule = { field: 'price', operator: 'gt', value: 100 }
    expect(summarizeRule(rule, SCHEMA)).toEqual({
      field: 'Price',
      operator: '>',
      value: '100',
    })
  })

  it('maps an enum value back to its option label', () => {
    const rule: FilterRule = { field: 'plan', operator: 'is', value: 'pro' }
    expect(summarizeRule(rule, SCHEMA).value).toBe('Pro')
  })

  it('formats a range value as a dashed pair', () => {
    const rule: FilterRule = {
      field: 'price',
      operator: 'between',
      value: [100, 200],
    }
    expect(summarizeRule(rule, SCHEMA).value).toBe('100 – 200')
  })

  it('joins a multi enum value into option labels', () => {
    const rule: FilterRule = {
      field: 'plan',
      operator: 'in',
      value: ['pro', 'team'],
    }
    expect(summarizeRule(rule, SCHEMA).value).toBe('Pro, Team')
  })

  it('renders an untouched range as a single dash, not a dangling " – "', () => {
    const rule: FilterRule = {
      field: 'price',
      operator: 'between',
      value: ['', ''],
    }
    expect(summarizeRule(rule, SCHEMA).value).toBe('—')
  })
})

describe('describeCombinator', () => {
  it('uses the singular noun for one child', () => {
    expect(describeCombinator('and', 1)).toBe('AND of 1 condition')
  })

  it('uses the plural noun for several', () => {
    expect(describeCombinator('or', 3)).toBe('OR of 3 conditions')
  })
})

const SCHEMA_TREE: FilterTree = {
  combinator: 'and',
  rules: [{ field: 'name', operator: 'contains', value: 'acme' }],
}

function SchemaHost({
  initial,
  mode,
}: {
  initial: FilterTree
  mode?: 'expanded' | 'compact'
}) {
  const [value, setValue] = useState<FilterTree>(initial)
  return (
    <FilterBuilder
      value={value}
      onChange={setValue}
      fields={SCHEMA}
      mode={mode}
    />
  )
}

describe('FilterBuilder — schema-driven editor in renderRule seam', () => {
  it('changing the field reconciles the operator into the tree', () => {
    render(<SchemaHost initial={SCHEMA_TREE} />)

    const fieldSelect = screen.getByLabelText('Field') as HTMLSelectElement
    expect(fieldSelect.tagName).toBe('SELECT')
    fireEvent.change(fieldSelect, { target: { value: 'price' } })

    const operatorSelect = screen.getByLabelText('Operator') as HTMLSelectElement
    const ids = Array.from(operatorSelect.options, (o) => o.value)
    expect(ids).toContain('eq')
    expect(ids).not.toContain('contains')
    expect(operatorSelect.value).not.toBe('contains')
  })

  it('renders a number input for a numeric field', () => {
    const numericTree: FilterTree = {
      combinator: 'and',
      rules: [{ field: 'price', operator: 'eq', value: 10 }],
    }
    render(<SchemaHost initial={numericTree} />)

    const value = screen.getByLabelText('Price value') as HTMLInputElement
    expect(value.type).toBe('number')
  })

  it('renders two controls for a between operator', () => {
    const rangeTree: FilterTree = {
      combinator: 'and',
      rules: [{ field: 'price', operator: 'between', value: [10, 20] }],
    }
    render(<SchemaHost initial={rangeTree} />)

    expect(screen.getByLabelText('Price value from')).toBeInTheDocument()
    expect(screen.getByLabelText('Price value to')).toBeInTheDocument()
  })
})

describe('FilterBuilder — explicit renderRule wins over fields', () => {
  it('uses the consumer renderRule even when fields is supplied', () => {
    function Host() {
      const [value, setValue] = useState<FilterTree>(SCHEMA_TREE)
      return (
        <FilterBuilder
          value={value}
          onChange={setValue}
          fields={SCHEMA}
          renderRule={({ rule }) => <span>custom:{String(rule.field)}</span>}
        />
      )
    }
    render(<Host />)

    expect(screen.getByText('custom:name')).toBeInTheDocument()
    expect(screen.queryByLabelText('Field')).not.toBeInTheDocument()
  })
})

describe('FilterBuilder — compact summary mode', () => {
  it('renders read-only chips and no editable controls', () => {
    const tree: FilterTree = {
      combinator: 'or',
      rules: [
        { field: 'name', operator: 'contains', value: 'acme' },
        { field: 'plan', operator: 'is', value: 'pro' },
      ],
    }
    render(<SchemaHost initial={tree} mode="compact" />)

    expect(screen.queryByLabelText('Field')).not.toBeInTheDocument()
    expect(screen.getByText('OR of 2 conditions')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
  })

  it('preserves data when toggling compact ↔ expanded', () => {
    function ModeHost() {
      const [mode, setMode] = useState<'compact' | 'expanded'>('expanded')
      const [value, setValue] = useState<FilterTree>(SCHEMA_TREE)
      return (
        <div>
          <button type="button" onClick={() => setMode('compact')}>
            to compact
          </button>
          <button type="button" onClick={() => setMode('expanded')}>
            to expanded
          </button>
          <FilterBuilder
            value={value}
            onChange={setValue}
            fields={SCHEMA}
            mode={mode}
          />
        </div>
      )
    }
    render(<ModeHost />)

    const field = screen.getByLabelText('Field') as HTMLSelectElement
    fireEvent.change(field, { target: { value: 'plan' } })

    fireEvent.click(screen.getByRole('button', { name: 'to compact' }))
    expect(screen.getByText('Plan')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'to expanded' }))
    const fieldAgain = screen.getByLabelText('Field') as HTMLSelectElement
    expect(fieldAgain.value).toBe('plan')
  })
})

describe('FilterBuilder — controlled invariant preserved with fields', () => {
  // Зеркало controlled-теста дефолтного редактора: со schema-редактором
  // проигнорированный onChange всё равно не должен оптимистично менять дерево.
  it('does not change the field selection when onChange is dropped', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [{ field: 'name', operator: 'contains', value: 'x' }],
    }
    render(
      <FilterBuilder value={tree} onChange={() => {}} fields={SCHEMA} />,
    )

    const field = screen.getByLabelText('Field') as HTMLSelectElement
    expect(field.value).toBe('name')
    fireEvent.change(field, { target: { value: 'price' } })
    // value всё ещё 'name': хост проглотил следующее дерево.
    const after = screen.getByLabelText('Field') as HTMLSelectElement
    expect(after.value).toBe('name')
  })
})
