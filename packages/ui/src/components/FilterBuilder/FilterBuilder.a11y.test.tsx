import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { FilterBuilder } from './FilterBuilder'
import { encodePath } from './focus'
import type { FilterPath, FilterRule, FilterTree } from './types'

function makeRule(field: string): FilterRule {
  return { field, operator: 'eq', value: field }
}

/**
 * Stateful host mirroring the real usage: it owns the tree and echoes each edit
 * back through `value`, so the builder's post-commit focus effect sees the new
 * DOM. Focus management only works when the consumer honours `onChange`.
 */
function Host({ initial }: { initial: FilterTree }) {
  const [value, setValue] = useState<FilterTree>(initial)
  return <FilterBuilder value={value} onChange={setValue} />
}

/** The rule row (outer div carrying `data-rule-path`) for a given path. */
function ruleRowAt(path: FilterPath): HTMLElement {
  const row = document.querySelector<HTMLElement>(
    `[data-rule-path="${encodePath(path)}"]`,
  )
  if (row === null) throw new Error(`no rule row at ${encodePath(path)}`)
  return row
}

describe('FilterBuilder — focus management on add', () => {
  it('moves focus into the new row after Add rule at root', () => {
    render(<Host initial={{ combinator: 'and', rules: [makeRule('a')] }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))

    // The appended rule sits at index 1; focus must land on its first control.
    const newRow = ruleRowAt([1])
    const firstControl = within(newRow).getAllByRole('textbox')[0]!
    expect(document.activeElement).toBe(firstControl)
  })

  it('moves focus into the new rule inside a nested group', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        makeRule('a'),
        { combinator: 'or', rules: [makeRule('nested')] },
      ],
    }
    render(<Host initial={tree} />)

    // Reach the nested group's own "Add rule" by anchoring on its match-type
    // toggle (the only group whose OR segment is pressed).
    const toggles = screen.getAllByRole('group', { name: 'Match type' })
    const nestedToggle = toggles.find(
      (group) =>
        within(group)
          .getByRole('button', { name: 'OR' })
          .getAttribute('aria-pressed') === 'true',
    )!
    const nestedPanel = nestedToggle.parentElement!.parentElement!
    fireEvent.click(
      within(nestedPanel).getAllByRole('button', { name: 'Add rule' })[0]!,
    )

    // New rule is at [1, 1]; its first control receives focus.
    const newRow = ruleRowAt([1, 1])
    const firstControl = within(newRow).getAllByRole('textbox')[0]!
    expect(document.activeElement).toBe(firstControl)
  })

  it('moves focus into the new group after Add group', () => {
    render(<Host initial={{ combinator: 'and', rules: [makeRule('a')] }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add group' }))

    // The new empty group is at index 1; its first focusable is the AND segment
    // of its match-type toggle.
    const newGroup = document.querySelector<HTMLElement>(
      `[data-group-path="${encodePath([1])}"]`,
    )!
    const firstControl = within(newGroup).getAllByRole('button')[0]!
    expect(document.activeElement).toBe(firstControl)
  })
})

describe('FilterBuilder — focus management on remove', () => {
  it('focuses the previous sibling after removing a non-first rule', () => {
    render(
      <Host
        initial={{
          combinator: 'and',
          rules: [makeRule('alpha'), makeRule('beta'), makeRule('gamma')],
        }}
      />,
    )

    // Remove the middle rule (index 1). Its previous sibling (index 0, "alpha")
    // must take focus so the keyboard user is not dropped onto the body.
    const removeButtons = screen.getAllByRole('button', { name: 'Remove rule' })
    fireEvent.click(removeButtons[1]!)

    const survivor = ruleRowAt([0])
    const firstControl = within(survivor).getAllByRole('textbox')[0]!
    expect(document.activeElement).toBe(firstControl)
    // Sanity: the field input still shows the surviving first rule.
    expect((firstControl as HTMLInputElement).value).toBe('alpha')
  })

  it('focuses the slid-in neighbour after removing the first rule', () => {
    render(
      <Host
        initial={{
          combinator: 'and',
          rules: [makeRule('alpha'), makeRule('beta')],
        }}
      />,
    )

    const removeButtons = screen.getAllByRole('button', { name: 'Remove rule' })
    fireEvent.click(removeButtons[0]!)

    // "beta" slides into index 0; focus follows it there.
    const survivor = ruleRowAt([0])
    const firstControl = within(survivor).getAllByRole('textbox')[0]!
    expect(document.activeElement).toBe(firstControl)
    expect((firstControl as HTMLInputElement).value).toBe('beta')
  })

  it('focuses the Add rule button after removing the only rule in a group', () => {
    render(<Host initial={{ combinator: 'and', rules: [makeRule('solo')] }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove rule' }))

    // The root group is now empty: focus falls back to its Add rule button.
    const addRule = screen.getByRole('button', { name: 'Add rule' })
    expect(document.activeElement).toBe(addRule)
  })

  it('leaves focus where the user left it when onChange is ignored', () => {
    // A read-only consumer drops onChange, so no re-render happens and the
    // post-commit resolver never runs. Focus must stay on the control the user
    // was interacting with — the resolver must not reach across an unchanged
    // tree and yank it elsewhere.
    render(
      <FilterBuilder
        value={{ combinator: 'and', rules: [makeRule('a'), makeRule('b')] }}
        onChange={() => {}}
      />,
    )

    const removeButton = screen.getAllByRole('button', {
      name: 'Remove rule',
    })[0]!
    removeButton.focus()
    fireEvent.click(removeButton)

    // Edit dropped: both rows remain, and focus is still on the button.
    expect(screen.getAllByLabelText('Field')).toHaveLength(2)
    expect(document.activeElement).toBe(removeButton)
  })
})

describe('FilterBuilder — group and toggle semantics', () => {
  it('exposes each group as an accessible group with a label', () => {
    render(
      <FilterBuilder
        value={{
          combinator: 'and',
          rules: [
            makeRule('a'),
            { combinator: 'or', rules: [makeRule('b')] },
          ],
        }}
        onChange={() => {}}
      />,
    )

    // Root group is labelled "Filter rules"; the nested one "Rule group".
    expect(
      screen.getByRole('group', { name: 'Filter rules' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Rule group' })).toBeInTheDocument()
  })

  it('labels the AND/OR toggle "Match type", not jargon', () => {
    render(
      <FilterBuilder
        value={{ combinator: 'and', rules: [makeRule('a')] }}
        onChange={() => {}}
      />,
    )

    const toggle = screen.getByRole('group', { name: 'Match type' })
    expect(within(toggle).getByRole('button', { name: 'AND' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // The old jargon label is gone.
    expect(screen.queryByRole('group', { name: 'Combinator' })).toBeNull()
  })
})
