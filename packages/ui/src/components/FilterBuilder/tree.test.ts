import { describe, expect, it } from 'vitest'

import {
  addGroup,
  addRule,
  emptyGroup,
  getNodeAt,
  removeNode,
  setCombinator,
  updateRule,
} from './tree'
import {
  isGroup,
  isRule,
  type FilterRule,
  type FilterTree,
  type FilterValue,
} from './types'

function rule(field: string, operator: string, value: FilterValue): FilterRule {
  return { field, operator, value }
}

/** A small two-level tree used across the path-operation tests. */
function sampleTree(): FilterTree {
  return {
    combinator: 'and',
    rules: [
      rule('status', 'eq', 'active'),
      {
        combinator: 'or',
        rules: [rule('age', 'gt', 18), rule('age', 'lt', 65)],
      },
    ],
  }
}

/** Deep snapshot via JSON to compare structural equality before/after an op. */
function snapshot(tree: FilterTree): string {
  return JSON.stringify(tree)
}

describe('type guards', () => {
  it('classifies groups and rules', () => {
    const group = emptyGroup()
    const leaf = rule('a', 'eq', 1)
    expect(isGroup(group)).toBe(true)
    expect(isRule(group)).toBe(false)
    expect(isGroup(leaf)).toBe(false)
    expect(isRule(leaf)).toBe(true)
  })
})

describe('getNodeAt', () => {
  it('resolves root, rule and nested nodes', () => {
    const tree = sampleTree()
    expect(getNodeAt(tree, [])).toBe(tree)
    expect(getNodeAt(tree, [0])).toBe(tree.rules[0])
    expect(getNodeAt(tree, [1, 0])).toBe((tree.rules[1] as FilterTree).rules[0])
  })

  it('throws on out-of-range index', () => {
    expect(() => getNodeAt(sampleTree(), [5])).toThrow()
  })

  it('throws when descending into a rule', () => {
    expect(() => getNodeAt(sampleTree(), [0, 0])).toThrow()
  })
})

describe('immutability', () => {
  it('addRule does not mutate the source tree', () => {
    const tree = sampleTree()
    const before = snapshot(tree)
    addRule(tree, [], rule('name', 'contains', 'x'))
    expect(snapshot(tree)).toBe(before)
  })

  it('removeNode does not mutate the source tree', () => {
    const tree = sampleTree()
    const before = snapshot(tree)
    removeNode(tree, [1, 0])
    expect(snapshot(tree)).toBe(before)
  })

  it('updateRule does not mutate the source tree', () => {
    const tree = sampleTree()
    const before = snapshot(tree)
    updateRule(tree, [0], { value: 'inactive' })
    expect(snapshot(tree)).toBe(before)
  })

  it('setCombinator does not mutate the source tree', () => {
    const tree = sampleTree()
    const before = snapshot(tree)
    setCombinator(tree, [1], 'and')
    expect(snapshot(tree)).toBe(before)
  })
})

describe('structural sharing (reference identity)', () => {
  it('keeps untouched siblings identical, replaces the edited branch', () => {
    const tree = sampleTree()
    const next = updateRule(tree, [1, 0], { value: 21 })

    // Root is a new object, and so is the edited group on the path.
    expect(next).not.toBe(tree)
    expect(next.rules[1]).not.toBe(tree.rules[1])

    // The untouched sibling rule keeps its identity.
    expect(next.rules[0]).toBe(tree.rules[0])

    // Within the edited group, only the edited rule changes; its sibling stays.
    const beforeGroup = tree.rules[1] as FilterTree
    const afterGroup = next.rules[1] as FilterTree
    expect(afterGroup.rules[0]).not.toBe(beforeGroup.rules[0])
    expect(afterGroup.rules[1]).toBe(beforeGroup.rules[1])
  })

  it('addRule at root reuses every existing child by reference', () => {
    const tree = sampleTree()
    const next = addRule(tree, [], rule('flag', 'eq', true))
    expect(next).not.toBe(tree)
    expect(next.rules[0]).toBe(tree.rules[0])
    expect(next.rules[1]).toBe(tree.rules[1])
    expect(next.rules).toHaveLength(3)
  })
})

describe('addRule / addGroup', () => {
  it('appends a rule to the targeted group', () => {
    const next = addRule(sampleTree(), [1], rule('age', 'eq', 40))
    const group = next.rules[1] as FilterTree
    expect(group.rules).toHaveLength(3)
    expect(group.rules[2]).toEqual(rule('age', 'eq', 40))
  })

  it('appends an empty group by default', () => {
    const next = addGroup(sampleTree(), [])
    expect(next.rules).toHaveLength(3)
    expect(next.rules[2]).toEqual(emptyGroup())
  })

  it('appends a provided group inside a nested group', () => {
    const inner = emptyGroup()
    inner.combinator = 'or'
    const next = addGroup(sampleTree(), [1], inner)
    const group = next.rules[1] as FilterTree
    expect(group.rules).toHaveLength(3)
    expect(group.rules[2]).toEqual(inner)
  })

  it('throws when the path is not a group', () => {
    expect(() => addRule(sampleTree(), [0], rule('x', 'eq', 1))).toThrow()
  })
})

describe('removeNode', () => {
  it('removes a nested rule and reindexes siblings', () => {
    const next = removeNode(sampleTree(), [1, 0])
    const group = next.rules[1] as FilterTree
    expect(group.rules).toHaveLength(1)
    expect(group.rules[0]).toEqual(rule('age', 'lt', 65))
  })

  it('removes a top-level node', () => {
    const next = removeNode(sampleTree(), [0])
    expect(next.rules).toHaveLength(1)
    expect(isGroup(next.rules[0]!)).toBe(true)
  })

  it('throws when removing the root', () => {
    expect(() => removeNode(sampleTree(), [])).toThrow()
  })
})

describe('updateRule', () => {
  it('merges a partial patch', () => {
    const next = updateRule(sampleTree(), [0], { operator: 'neq' })
    expect(next.rules[0]).toEqual(rule('status', 'neq', 'active'))
  })

  it('applies an updater function', () => {
    const next = updateRule(sampleTree(), [1, 1], (current) => ({
      ...current,
      value: 70,
    }))
    const group = next.rules[1] as FilterTree
    expect(group.rules[1]).toEqual(rule('age', 'lt', 70))
  })

  it('throws when the path is a group', () => {
    expect(() => updateRule(sampleTree(), [1], { value: 1 })).toThrow()
  })
})

describe('setCombinator', () => {
  it('changes a nested group combinator', () => {
    const next = setCombinator(sampleTree(), [1], 'and')
    expect((next.rules[1] as FilterTree).combinator).toBe('and')
  })

  it('changes the root combinator', () => {
    expect(setCombinator(sampleTree(), [], 'or').combinator).toBe('or')
  })
})
