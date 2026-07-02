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
    expect(median).toBeLessThanOrEqual(SERIALIZE_BUDGET_MS)
  })

  it('deserializes 200 rules within budget', () => {
    const median = medianMs(() => {
      deserialize(wire)
    })
    console.log(`deserialize(200) median: ${median.toFixed(4)} ms`)
    expect(median).toBeLessThanOrEqual(SERIALIZE_BUDGET_MS)
  })

  it('round-trips a 200-rule tree without wire-format regression', () => {
    expect(deserialize(serialize(tree))).toEqual(tree)
  })
})
