import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FilterBuilder } from './FilterBuilder'
import {
  addGroup,
  addRule,
  removeNode,
  setCombinator,
  updateRule,
} from './tree'
import type { FilterRule, FilterTree } from './types'

/** The blank rule FilterBuilder appends when no `createRule` is supplied. */
const DEFAULT_RULE: FilterRule = { field: '', operator: '', value: '' }

function makeRule(field: string): FilterRule {
  return { field, operator: 'eq', value: field }
}

/** Root with one rule, one nested group (holding one rule), one trailing rule. */
function makeNestedTree(): FilterTree {
  const nestedRule: FilterRule = {
    field: 'nestedField',
    operator: 'eq',
    value: 'nestedValue',
  }
  return {
    combinator: 'and',
    rules: [
      makeRule('a'),
      { combinator: 'or', rules: [nestedRule] },
      makeRule('b'),
    ],
  }
}

/** The combinator `<button>` whose visible label is AND/OR. */
function combinatorButton(scope: HTMLElement, label: 'AND' | 'OR') {
  return within(scope).getByRole('button', { name: label })
}

describe('FilterBuilder — controlled onChange correctness', () => {
  it('Add rule at root emits addRule(value, [], defaultRule)', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(addRule(value, [], DEFAULT_RULE))
  })

  it('Add group at root emits addGroup(value, [])', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add group' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(addGroup(value, []))
  })

  it('Remove rule emits removeNode(value, [0])', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove rule' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(removeNode(value, [0]))
  })

  it('uses a consumer-supplied createRule for Add rule', () => {
    const value: FilterTree = { combinator: 'and', rules: [] }
    const onChange = vi.fn()
    const custom = makeRule('seed')
    render(
      <FilterBuilder
        value={value}
        onChange={onChange}
        createRule={() => custom}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))

    expect(onChange).toHaveBeenCalledWith(addRule(value, [], custom))
  })
})

describe('FilterBuilder — fully controlled, no internal tree state', () => {
  // Load-bearing disproof: onChange ignores the update so `value` never changes.
  // If anyone mirrors the tree in `useState`/`useReducer`, the click would
  // optimistically add a row and this assertion would go red. It MUST stay green
  // only while the component is a pure projection of the `value` prop.
  it('does not optimistically add a rule when onChange is ignored', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn() // intentionally drops the next tree
    render(<FilterBuilder value={value} onChange={onChange} />)

    const before = screen.getAllByLabelText('Field').length
    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    const after = screen.getAllByLabelText('Field').length

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(after).toBe(before)
  })
})

describe('FilterBuilder — recursion path correctness', () => {
  it('Add rule inside the nested group hits path [1]', () => {
    const value = makeNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    // The nested group is the only one with an active "OR" toggle; use its
    // combinator role-group as an anchor to reach its own "Add rule".
    const allGroups = screen.getAllByRole('group', { name: 'Combinator' })
    const nestedToggle = allGroups.find(
      (g) =>
        within(g).getByRole('button', { name: 'OR' }).getAttribute('aria-pressed') ===
        'true',
    )!
    // toggle (role=group) -> groupHeader -> groupPanel
    const nestedPanel = nestedToggle.parentElement!.parentElement!
    fireEvent.click(
      within(nestedPanel).getAllByRole('button', { name: 'Add rule' })[0]!,
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(addRule(value, [1], DEFAULT_RULE))
  })

  it('Remove nested group emits removeNode(value, [1])', () => {
    const value = makeNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove group' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(removeNode(value, [1]))
  })

  it('Add group inside the nested group hits path [1] (>= 2 levels deep)', () => {
    const value = makeNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const allGroups = screen.getAllByRole('group', { name: 'Combinator' })
    const nestedToggle = allGroups.find(
      (g) =>
        within(g).getByRole('button', { name: 'OR' }).getAttribute('aria-pressed') ===
        'true',
    )!
    // toggle (role=group) -> groupHeader -> groupPanel
    const nestedPanel = nestedToggle.parentElement!.parentElement!
    fireEvent.click(
      within(nestedPanel).getAllByRole('button', { name: 'Add group' })[0]!,
    )

    expect(onChange).toHaveBeenCalledWith(addGroup(value, [1]))
  })
})

describe('FilterBuilder — updateRule wiring', () => {
  it('typing into a value input emits updateRule at the right path', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Value'), {
      target: { value: 'next' },
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(
      updateRule(value, [0], { value: 'next' }),
    )
  })

  it('typing into a nested rule field emits updateRule at [1, 0]', () => {
    const value = makeNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const nestedField = screen.getByDisplayValue('nestedField')
    fireEvent.change(nestedField, { target: { value: 'changed' } })

    expect(onChange).toHaveBeenCalledWith(
      updateRule(value, [1, 0], { field: 'changed' }),
    )
  })
})

describe('FilterBuilder — combinator toggle', () => {
  it('clicking the inactive combinator emits setCombinator(value, [], other)', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const rootToggle = screen.getAllByRole('group', { name: 'Combinator' })[0]!
    expect(combinatorButton(rootToggle, 'AND')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(combinatorButton(rootToggle, 'OR'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(setCombinator(value, [], 'or'))
  })
})

describe('FilterBuilder — renderRule seam', () => {
  it('renders custom controls and wires update/remove through actions', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(
      <FilterBuilder
        value={value}
        onChange={onChange}
        renderRule={({ rule, update, remove }) => (
          <div>
            <span>custom:{rule.field}</span>
            <button type="button" onClick={() => update({ field: 'z' })}>
              patch
            </button>
            <button type="button" onClick={remove}>
              drop
            </button>
          </div>
        )}
      />,
    )

    expect(screen.getByText('custom:a')).toBeInTheDocument()
    // The default native editor must be absent when renderRule is provided.
    expect(screen.queryByLabelText('Field')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'patch' }))
    expect(onChange).toHaveBeenCalledWith(
      updateRule(value, [0], { field: 'z' }),
    )
  })
})
