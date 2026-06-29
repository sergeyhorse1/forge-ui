import { describe, expect, it } from 'vitest'

import { deserialize, serialize } from './serialization'
import type { FilterTree } from './types'

function roundTrip(tree: FilterTree): FilterTree {
  return deserialize(serialize(tree))
}

describe('round trip', () => {
  it('preserves a simple flat tree', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'age', operator: 'gt', value: 18 },
      ],
    }
    expect(roundTrip(tree)).toEqual(tree)
  })

  it('preserves deeply nested groups', () => {
    const tree: FilterTree = {
      combinator: 'or',
      rules: [
        { field: 'a', operator: 'eq', value: 1 },
        {
          combinator: 'and',
          rules: [
            { field: 'b', operator: 'eq', value: 2 },
            {
              combinator: 'or',
              rules: [
                { field: 'c', operator: 'eq', value: 3 },
                {
                  combinator: 'and',
                  rules: [{ field: 'd', operator: 'eq', value: 4 }],
                },
              ],
            },
          ],
        },
      ],
    }
    expect(roundTrip(tree)).toEqual(tree)
  })

  it('preserves an empty group', () => {
    const tree: FilterTree = { combinator: 'and', rules: [] }
    expect(roundTrip(tree)).toEqual(tree)
  })

  it('preserves a nested empty group', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [{ combinator: 'or', rules: [] }],
    }
    expect(roundTrip(tree)).toEqual(tree)
  })

  it('preserves every JSON value type', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'nullable', operator: 'is', value: null },
        { field: 'emptyString', operator: 'eq', value: '' },
        { field: 'zero', operator: 'eq', value: 0 },
        { field: 'falseFlag', operator: 'eq', value: false },
        { field: 'list', operator: 'in', value: [1, 2, 3] },
        {
          field: 'range',
          operator: 'between',
          value: { from: 0, to: 100, labels: ['lo', 'hi'] },
        },
      ],
    }
    expect(roundTrip(tree)).toEqual(tree)
  })
})

describe('serialize output', () => {
  it('wraps the tree in a versioned envelope', () => {
    const tree: FilterTree = { combinator: 'and', rules: [] }
    expect(JSON.parse(serialize(tree))).toEqual({ v: 1, tree })
  })
})

describe('deserialize validation', () => {
  it('throws on non-JSON input', () => {
    expect(() => deserialize('{ not json')).toThrow(/valid JSON/)
  })

  it('throws on an unknown envelope version', () => {
    expect(() =>
      deserialize(JSON.stringify({ v: 99, tree: { combinator: 'and', rules: [] } })),
    ).toThrow(/version/)
  })

  it('throws when the root is a bare rule, not a group', () => {
    expect(() =>
      deserialize(JSON.stringify({ v: 1, tree: { field: 'a', operator: 'eq', value: 1 } })),
    ).toThrow(/group/)
  })

  it('throws on an invalid combinator', () => {
    expect(() =>
      deserialize(JSON.stringify({ v: 1, tree: { combinator: 'xor', rules: [] } })),
    ).toThrow(/combinator/)
  })

  it('throws when rules is not an array', () => {
    expect(() =>
      deserialize(JSON.stringify({ v: 1, tree: { combinator: 'and', rules: {} } })),
    ).toThrow(/rules/)
  })

  it('throws on a rule missing its value', () => {
    expect(() =>
      deserialize(
        JSON.stringify({
          v: 1,
          tree: { combinator: 'and', rules: [{ field: 'a', operator: 'eq' }] },
        }),
      ),
    ).toThrow(/value/)
  })

  it('throws on a non-string field', () => {
    expect(() =>
      deserialize(
        JSON.stringify({
          v: 1,
          tree: { combinator: 'and', rules: [{ field: 7, operator: 'eq', value: 1 }] },
        }),
      ),
    ).toThrow(/field/)
  })

  it('throws on a malformed deeply nested node', () => {
    expect(() =>
      deserialize(
        JSON.stringify({
          v: 1,
          tree: {
            combinator: 'and',
            rules: [{ combinator: 'or', rules: [{ field: 'ok', operator: 'eq', value: 1 }, null] }],
          },
        }),
      ),
    ).toThrow(/rules\[1\]/)
  })

  it('rejects a non-finite number injected as a rule value', () => {
    // JSON cannot literally carry Infinity; a hand-built object simulates a
    // malformed payload reaching the validator.
    const payload = '{"v":1,"tree":{"combinator":"and","rules":[{"field":"a","operator":"eq","value":1e999}]}}'
    expect(() => deserialize(payload)).toThrow(/finite/)
  })
})
