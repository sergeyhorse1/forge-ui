import '@testing-library/jest-dom/vitest'

import { useState } from 'react'
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
    const allGroups = screen.getAllByRole('group', { name: 'Match type' })
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

    const allGroups = screen.getAllByRole('group', { name: 'Match type' })
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

    const rootToggle = screen.getAllByRole('group', { name: 'Match type' })[0]!
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

  it('wires the custom remove button through removeNode at the rule path', () => {
    const value: FilterTree = {
      combinator: 'and',
      rules: [makeRule('a'), makeRule('b'), makeRule('c')],
    }
    const onChange = vi.fn()
    render(
      <FilterBuilder
        value={value}
        onChange={onChange}
        renderRule={({ rule, remove }) => (
          <button type="button" onClick={remove}>
            drop {rule.field}
          </button>
        )}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'drop b' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(removeNode(value, [1]))
  })
})

/**
 * A flat group of three distinct rules. Distinct field labels let a test target
 * one specific row's controls so removing the middle one can be told apart from
 * removing the first or last.
 */
function makeSiblingTree(): FilterTree {
  return {
    combinator: 'and',
    rules: [makeRule('alpha'), makeRule('beta'), makeRule('gamma')],
  }
}

/**
 * Render every rule with a labelled remove button so a test can name an exact
 * row. The buttons carry the rule's field, so `drop <field>` is unambiguous.
 */
function withNamedRemovers(
  value: FilterTree,
  onChange: (next: FilterTree) => void,
) {
  return render(
    <FilterBuilder
      value={value}
      onChange={onChange}
      renderRule={({ rule, update, remove }) => (
        <div>
          <span>row:{String(rule.field)}</span>
          <button type="button" onClick={() => update({ value: 'edited' })}>
            edit {String(rule.field)}
          </button>
          <button type="button" onClick={remove}>
            drop {String(rule.field)}
          </button>
        </div>
      )}
    />,
  )
}

describe('FilterBuilder — sibling index correctness', () => {
  it('removing the first of several rules targets index 0', () => {
    const value = makeSiblingTree()
    const onChange = vi.fn()
    withNamedRemovers(value, onChange)

    fireEvent.click(screen.getByRole('button', { name: 'drop alpha' }))

    expect(onChange).toHaveBeenCalledWith(removeNode(value, [0]))
  })

  it('removing the middle of several rules targets index 1, not the last', () => {
    const value = makeSiblingTree()
    const onChange = vi.fn()
    withNamedRemovers(value, onChange)

    fireEvent.click(screen.getByRole('button', { name: 'drop beta' }))

    const emitted = removeNode(value, [1])
    expect(onChange).toHaveBeenCalledWith(emitted)
    // Removing the middle must keep the outer siblings, in order.
    expect(emitted.rules.map((r) => (r as FilterRule).field)).toEqual([
      'alpha',
      'gamma',
    ])
  })

  it('removing the last of several rules targets the final index', () => {
    const value = makeSiblingTree()
    const onChange = vi.fn()
    withNamedRemovers(value, onChange)

    fireEvent.click(screen.getByRole('button', { name: 'drop gamma' }))

    expect(onChange).toHaveBeenCalledWith(removeNode(value, [2]))
  })

  it('editing the middle rule patches index 1 and leaves siblings untouched', () => {
    const value = makeSiblingTree()
    const onChange = vi.fn()
    withNamedRemovers(value, onChange)

    fireEvent.click(screen.getByRole('button', { name: 'edit beta' }))

    const emitted = updateRule(value, [1], { value: 'edited' })
    expect(onChange).toHaveBeenCalledWith(emitted)
    expect((emitted.rules[1] as FilterRule).value).toBe('edited')
    // The untouched siblings keep their object identity.
    expect(emitted.rules[0]).toBe(value.rules[0])
    expect(emitted.rules[2]).toBe(value.rules[2])
  })
})

/**
 * Root with a leading rule and a nested group that itself contains a deeper
 * group. The deepest group lives at path [1, 1]; its inner rule at [1, 1, 0].
 * This lets a test prove the path threads three levels down, not just one.
 */
function makeDeeplyNestedTree(): FilterTree {
  return {
    combinator: 'and',
    rules: [
      makeRule('top'),
      {
        combinator: 'or',
        rules: [
          makeRule('mid'),
          {
            combinator: 'and',
            rules: [{ field: 'deepField', operator: 'eq', value: 'deepValue' }],
          },
        ],
      },
    ],
  }
}

describe('FilterBuilder — deep recursion path threading', () => {
  // The deepest group renders the only "Remove group" button nested two panels
  // in; find it by walking up from the field input of the rule it alone holds.
  function deepestGroupPanel(): HTMLElement {
    const deepField = screen.getByDisplayValue('deepField')
    // input -> ruleRow -> groupChildren -> deepest groupPanel
    return deepField.parentElement!.parentElement!.parentElement!
  }

  it('adds a rule into a group nested two levels deep at path [1, 1]', () => {
    const value = makeDeeplyNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const panel = deepestGroupPanel()
    fireEvent.click(
      within(panel).getAllByRole('button', { name: 'Add rule' })[0]!,
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(addRule(value, [1, 1], DEFAULT_RULE))
  })

  it('removes the deepest group at path [1, 1]', () => {
    const value = makeDeeplyNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const panel = deepestGroupPanel()
    fireEvent.click(within(panel).getByRole('button', { name: 'Remove group' }))

    expect(onChange).toHaveBeenCalledWith(removeNode(value, [1, 1]))
  })

  it('edits the rule nested three levels deep at path [1, 1, 0]', () => {
    const value = makeDeeplyNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.change(screen.getByDisplayValue('deepField'), {
      target: { value: 'deeper' },
    })

    expect(onChange).toHaveBeenCalledWith(
      updateRule(value, [1, 1, 0], { field: 'deeper' }),
    )
  })

  it('toggles the combinator of a group nested two levels deep at path [1, 1]', () => {
    const value = makeDeeplyNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const panel = deepestGroupPanel()
    const toggle = within(panel).getByRole('group', { name: 'Match type' })
    expect(combinatorButton(toggle, 'AND')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(combinatorButton(toggle, 'OR'))

    expect(onChange).toHaveBeenCalledWith(setCombinator(value, [1, 1], 'or'))
  })
})

describe('FilterBuilder — sequential edits through a stateful host', () => {
  // The component reads `value`/`onChange` from refs refreshed each render. A
  // real stateful host re-renders with the new tree after each edit, so two
  // adds in a row must accumulate rather than the second overwriting the first.
  function Host({ initial }: { initial: FilterTree }) {
    const [value, setValue] = useState<FilterTree>(initial)
    return <FilterBuilder value={value} onChange={setValue} />
  }

  it('two consecutive Add rule clicks accumulate to three rows', () => {
    render(<Host initial={{ combinator: 'and', rules: [makeRule('seed')] }} />)

    expect(screen.getAllByLabelText('Field')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    expect(screen.getAllByLabelText('Field')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    expect(screen.getAllByLabelText('Field')).toHaveLength(3)
  })

  it('editing one row then another keeps the first edit in the tree', () => {
    render(
      <Host
        initial={{
          combinator: 'and',
          rules: [makeRule('first'), makeRule('second')],
        }}
      />,
    )

    const fields = () => screen.getAllByLabelText('Field') as HTMLInputElement[]
    fireEvent.change(fields()[0]!, { target: { value: 'one' } })
    fireEvent.change(fields()[1]!, { target: { value: 'two' } })

    expect(fields()[0]!.value).toBe('one')
    expect(fields()[1]!.value).toBe('two')
  })
})
