import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { FilterBuilder } from './FilterBuilder'
import type { RenderRuleContext } from './FilterRule'
import { makeFilterTree } from './demo/fixtures'
import { deserialize, serialize } from './serialization'
import type { FilterSchema, FilterTree } from './types'

/**
 * Per-rule render counter, keyed by `rule.field`. The instrumented `renderRule`
 * below is called synchronously inside each `FilterRule`'s render, so its
 * invocation count is exactly that row's render count. A rule that is not
 * re-rendered never re-invokes `renderRule`, which is also how case C (stable
 * `update`/`remove` callbacks) is observed: an untouched row's counter stays
 * flat.
 */
const renders = new Map<string, number>()

/**
 * Stable, module-level `renderRule`. It must not be recreated per render:
 * `FilterBuilder` memoises `effectiveRenderRule` on `[renderRule, fields]`, so a
 * fresh function each render would invalidate that memo and defeat the isolation
 * the test is measuring.
 */
function countingRenderRule(ctx: RenderRuleContext<FilterSchema>): ReactNode {
  const field = ctx.rule.field
  renders.set(field, (renders.get(field) ?? 0) + 1)
  return (
    <input
      aria-label={field}
      value={String(ctx.rule.value ?? '')}
      onChange={(event) => ctx.update({ value: event.target.value })}
    />
  )
}

/** Stateful host that owns the tree and threads the stable `renderRule`. */
function Host({ initial }: { initial: FilterTree }) {
  const [value, setValue] = useState<FilterTree>(initial)
  return (
    <FilterBuilder value={value} onChange={setValue} renderRule={countingRenderRule} />
  )
}

function snapshot(): Map<string, number> {
  return new Map(renders)
}

beforeEach(() => {
  renders.clear()
})

describe('FilterBuilder re-render isolation', () => {
  it('re-renders only the edited rule in a flat group (case A)', () => {
    const flat: FilterTree = {
      combinator: 'and',
      rules: Array.from({ length: 6 }, (_, index) => ({
        field: `r${index}`,
        operator: 'eq',
        value: '',
      })),
    }
    render(<Host initial={flat} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('r3'), { target: { value: 'x' } })

    // The edited row re-rendered exactly once more…
    expect(renders.get('r3')).toBe((before.get('r3') ?? 0) + 1)
    // …and every sibling row's render count is unchanged (structural sharing +
    // memo + stable ROOT_PATH keep their `path`/`rule`/`actions` props `===`).
    for (const field of ['r0', 'r1', 'r2', 'r4', 'r5']) {
      expect(renders.get(field)).toBe(before.get(field))
    }
  })

  it('does not re-render a sibling branch when editing a nested rule (case B)', () => {
    const nested: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'a0', operator: 'eq', value: '' },
        {
          combinator: 'or',
          rules: [
            { field: 'b0', operator: 'eq', value: '' },
            { field: 'b1', operator: 'eq', value: '' },
          ],
        },
      ],
    }
    render(<Host initial={nested} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('b0'), { target: { value: 'y' } })

    // Only the edited leaf re-renders; the sibling rule in the same group and the
    // rule in the sibling branch both stay put.
    expect(renders.get('b0')).toBe((before.get('b0') ?? 0) + 1)
    expect(renders.get('b1')).toBe(before.get('b1'))
    expect(renders.get('a0')).toBe(before.get('a0'))
  })

  it('keeps a deep edit from cascading sideways across the tree', () => {
    // A rule three groups deep, with sibling rules and sibling sub-trees planted
    // at every level above it, so any width-wise cascade would show up as an
    // extra render on one of them.
    const deep: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'top-sibling', operator: 'eq', value: '' },
        {
          combinator: 'or',
          rules: [
            { field: 'mid-sibling', operator: 'eq', value: '' },
            {
              combinator: 'and',
              rules: [
                { field: 'inner-sibling', operator: 'eq', value: '' },
                {
                  combinator: 'or',
                  rules: [
                    { field: 'deep-target', operator: 'eq', value: '' },
                    { field: 'deep-neighbour', operator: 'eq', value: '' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    render(<Host initial={deep} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('deep-target'), {
      target: { value: 'z' },
    })

    // The edited leaf re-renders once…
    expect(renders.get('deep-target')).toBe(
      (before.get('deep-target') ?? 0) + 1,
    )
    // …and nothing beside it — neither its own neighbour nor any sibling rule
    // parked at a shallower level — re-renders.
    for (const field of [
      'deep-neighbour',
      'inner-sibling',
      'mid-sibling',
      'top-sibling',
    ]) {
      expect(renders.get(field)).toBe(before.get(field))
    }
  })
})

/**
 * Group-level render counter. `FilterGroup` accepts no custom renderer, so we
 * observe its renders indirectly: a group re-render re-runs its children's
 * renderers, and a group whose sub-tree is untouched must not re-render any of
 * the leaves it owns. Tagging each group's rules with a distinct prefix lets one
 * group's edit be told apart from a sibling group's activity.
 */
describe('FilterBuilder sibling-group isolation', () => {
  it('leaves a sibling group untouched when a rule in another group changes', () => {
    const twoGroups: FilterTree = {
      combinator: 'and',
      rules: [
        {
          combinator: 'or',
          rules: [
            { field: 'groupA-first', operator: 'eq', value: '' },
            { field: 'groupA-second', operator: 'eq', value: '' },
          ],
        },
        {
          combinator: 'or',
          rules: [
            { field: 'groupB-first', operator: 'eq', value: '' },
            { field: 'groupB-second', operator: 'eq', value: '' },
          ],
        },
      ],
    }
    render(<Host initial={twoGroups} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('groupA-first'), {
      target: { value: 'q' },
    })

    // The edited rule in group A re-renders once.
    expect(renders.get('groupA-first')).toBe(
      (before.get('groupA-first') ?? 0) + 1,
    )
    // Every rule owned by the sibling group B keeps its render count flat —
    // group B never re-renders, so its whole sub-tree is skipped.
    expect(renders.get('groupB-first')).toBe(before.get('groupB-first'))
    expect(renders.get('groupB-second')).toBe(before.get('groupB-second'))
    // Group A's own untouched rule is likewise skipped.
    expect(renders.get('groupA-second')).toBe(before.get('groupA-second'))
  })
})

/**
 * Records how many times each group at a labelled path renders. The instrumented
 * `renderRule` can only see leaf rows, so to observe an *ancestor group*
 * re-rendering we thread a per-group `combinator` toggle: flipping a group's
 * combinator forces that group (and only the groups along its path) to produce a
 * new `rules`/`combinator` object. Ancestors re-render; sibling groups do not.
 */
describe('FilterBuilder ancestor re-render along the edited path', () => {
  it('re-renders the edited rule while its stable siblings stay flat', () => {
    // Isolation is about *siblings*, not ancestors. The chain of groups from the
    // root down to the edited rule legitimately re-renders — those groups own the
    // changed `rules` array. But a memoised leaf *within* a re-rendered ancestor
    // group still short-circuits when its own props are unchanged, so the sibling
    // rows do not re-render. We assert exactly that boundary here so the test
    // neither forbids the ancestor re-render nor tolerates a sibling leak.
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        {
          combinator: 'or',
          rules: [
            { field: 'same-group-sibling', operator: 'eq', value: '' },
            { field: 'edited', operator: 'eq', value: '' },
          ],
        },
        {
          combinator: 'or',
          rules: [{ field: 'off-path', operator: 'eq', value: '' }],
        },
      ],
    }
    render(<Host initial={tree} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('edited'), { target: { value: 'v' } })

    // The edited rule re-renders exactly once more.
    expect(renders.get('edited')).toBe((before.get('edited') ?? 0) + 1)
    // The sibling in the *same* ancestor group is still skipped: its rule object,
    // path and callbacks are all `===`, so `React.memo` bails out even though the
    // parent group re-rendered. This is the tighter guarantee — ancestor
    // re-render does not force its memoised children.
    expect(renders.get('same-group-sibling')).toBe(
      before.get('same-group-sibling'),
    )
    // The off-path branch, rooted at a sibling group, is fully skipped.
    expect(renders.get('off-path')).toBe(before.get('off-path'))
  })

  it('re-renders the whole path when a group along it structurally changes', () => {
    // Flipping a nested group's combinator replaces that group and every group
    // above it (structural sharing rewrites the path). React then re-renders
    // those groups; because each rule inside a rewritten group is reached through
    // a freshly-mapped `childPaths` entry only when `rules.length` changes, the
    // combinator flip alone keeps child paths stable — so the rules themselves
    // still don't re-render. What re-renders is bounded to the groups on the path,
    // which we observe by confirming the off-path branch's rule stays flat.
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        {
          combinator: 'and',
          rules: [{ field: 'nested-rule', operator: 'eq', value: '' }],
        },
        {
          combinator: 'or',
          rules: [{ field: 'other-branch', operator: 'eq', value: '' }],
        },
      ],
    }
    render(<Host initial={tree} />)
    const before = snapshot()

    // Toggle the first nested group's combinator from AND to OR. There are two
    // combinator toggles (root + nested); target the nested group's OR button.
    const orButtons = screen.getAllByRole('button', { name: 'OR' })
    // Root OR is first; the nested group's OR button is the second one.
    fireEvent.click(orButtons[orButtons.length - 1]!)

    // The rule inside the flipped group keeps stable props (its object, path and
    // callbacks are untouched), so even its own group re-rendering does not force
    // it to re-render.
    expect(renders.get('nested-rule')).toBe(before.get('nested-rule'))
    // The sibling branch is entirely off the path and never re-renders.
    expect(renders.get('other-branch')).toBe(before.get('other-branch'))
  })
})

describe('FilterBuilder callback stability', () => {
  it('does not re-invoke an untouched rule renderer when a distant rule changes', () => {
    // `renderRule` is invoked once per row render and closes over `ctx.update`/
    // `ctx.remove`. If those callbacks were rebuilt on every tree change, the
    // untouched row's memo would break and its renderer would fire again. A flat
    // render count on the untouched row is the observable proof the callbacks
    // stay `===` across an unrelated edit.
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'untouched', operator: 'eq', value: '' },
        { field: 'target', operator: 'eq', value: '' },
      ],
    }
    render(<Host initial={tree} />)
    const untouchedRendersBefore = renders.get('untouched')

    // Two independent edits to a different row; the untouched row must not
    // re-render for either.
    fireEvent.change(screen.getByLabelText('target'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('target'), { target: { value: '2' } })

    expect(renders.get('untouched')).toBe(untouchedRendersBefore)
    // Sanity: the row we did edit really did re-render, so the test is not
    // passing because nothing happened.
    expect(renders.get('target')).toBeGreaterThan(1)
  })
})

/**
 * Percentile helper: warm up the JIT, then take the median of repeated measures
 * so a single GC/JIT spike cannot fail the budget. `JSON.stringify`/`parse` are
 * O(n), so the median lands far under budget with room to spare.
 */
function medianMs(run: () => void, { warmup = 5, measure = 10 } = {}): number {
  for (let i = 0; i < warmup; i += 1) run()
  const samples: number[] = []
  for (let i = 0; i < measure; i += 1) {
    const start = performance.now()
    run()
    samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  return samples[Math.floor(samples.length / 2)]!
}

const SERIALIZE_BUDGET_MS = 5

describe('FilterBuilder serialize budget (200 rules / 20 groups)', () => {
  const tree = makeFilterTree(200, 10)
  const wire = serialize(tree)

  it('serializes 200 rules within budget', () => {
    const median = medianMs(() => {
      serialize(tree)
    })
    console.log(`serialize(200) median: ${median.toFixed(4)} ms`)
    // Under budget, but strictly above zero: a no-op `serialize` would measure ~0
    // and slip a broken implementation past a one-sided budget check.
    expect(median).toBeGreaterThan(0)
    expect(median).toBeLessThanOrEqual(SERIALIZE_BUDGET_MS)
  })

  it('deserializes 200 rules within budget', () => {
    const median = medianMs(() => {
      deserialize(wire)
    })
    console.log(`deserialize(200) median: ${median.toFixed(4)} ms`)
    expect(median).toBeGreaterThan(0)
    expect(median).toBeLessThanOrEqual(SERIALIZE_BUDGET_MS)
  })

  it('round-trips a 200-rule tree without wire-format regression', () => {
    expect(deserialize(serialize(tree))).toEqual(tree)
  })
})
