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

  it('preserves empty array and empty object values', () => {
    const tree: FilterTree = {
      combinator: 'or',
      rules: [
        { field: 'tags', operator: 'in', value: [] },
        { field: 'meta', operator: 'matches', value: {} },
      ],
    }
    expect(roundTrip(tree)).toEqual(tree)
  })

  it('preserves negative and fractional numbers', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'balance', operator: 'lt', value: -42.5 },
        { field: 'ratio', operator: 'eq', value: 0.0001 },
      ],
    }
    expect(roundTrip(tree)).toEqual(tree)
  })

  it('round-trips a heterogeneous deeply nested tree', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'status', operator: 'eq', value: 'open' },
        {
          combinator: 'or',
          rules: [
            { field: 'priority', operator: 'in', value: ['high', 'urgent'] },
            {
              combinator: 'and',
              rules: [
                { field: 'assignee', operator: 'is', value: null },
                {
                  combinator: 'or',
                  rules: [
                    {
                      field: 'labels',
                      operator: 'matches',
                      value: { any: ['bug', 'regression'], none: [] },
                    },
                  ],
                },
              ],
            },
          ],
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
    // JSON не несёт Infinity буквально; собранный вручную payload имитирует
    // битую нагрузку, дошедшую до валидатора.
    const payload = '{"v":1,"tree":{"combinator":"and","rules":[{"field":"a","operator":"eq","value":1e999}]}}'
    expect(() => deserialize(payload)).toThrow(/finite/)
  })

  it('throws when the envelope itself is not an object', () => {
    expect(() => deserialize(JSON.stringify([1, 2, 3]))).toThrow(/envelope/)
    expect(() => deserialize(JSON.stringify('plain string'))).toThrow(/envelope/)
  })

  it('throws when the tree node is not an object', () => {
    expect(() => deserialize(JSON.stringify({ v: 1, tree: 42 }))).toThrow(/tree/)
    expect(() => deserialize(JSON.stringify({ v: 1, tree: null }))).toThrow(/tree/)
  })

  it('throws when a missing version reads as undefined', () => {
    expect(() =>
      deserialize(JSON.stringify({ tree: { combinator: 'and', rules: [] } })),
    ).toThrow(/version/)
  })

  it('throws on a bad combinator buried several levels deep', () => {
    expect(() =>
      deserialize(
        JSON.stringify({
          v: 1,
          tree: {
            combinator: 'and',
            rules: [
              { field: 'a', operator: 'eq', value: 1 },
              {
                combinator: 'or',
                rules: [{ combinator: 'nand', rules: [] }],
              },
            ],
          },
        }),
      ),
    ).toThrow(/rules\[1\]\.rules\[0\]/)
  })

  it('throws on a non-JSON value nested inside a rule array', () => {
    // Не-конечное число внутри массива-значения тоже должно отвергаться, с путём
    // до провинившегося индекса.
    const payload =
      '{"v":1,"tree":{"combinator":"and","rules":[{"field":"a","operator":"in","value":[1,1e999,3]}]}}'
    expect(() => deserialize(payload)).toThrow(/rules\[0\]\.value\[1\]/)
  })

  it('throws on a non-string operator deep in the tree', () => {
    expect(() =>
      deserialize(
        JSON.stringify({
          v: 1,
          tree: {
            combinator: 'and',
            rules: [
              {
                combinator: 'or',
                rules: [{ field: 'a', operator: 5, value: 1 }],
              },
            ],
          },
        }),
      ),
    ).toThrow(/operator/)
  })

  it('reports the path to a malformed value nested in an object', () => {
    const payload =
      '{"v":1,"tree":{"combinator":"and","rules":[{"field":"a","operator":"matches","value":{"hi":1e999}}]}}'
    expect(() => deserialize(payload)).toThrow(/rules\[0\]\.value\.hi/)
  })
})

describe('deserialize strict node keys', () => {
  it('rejects a group carrying an extra key', () => {
    expect(() =>
      deserialize(JSON.stringify({ v: 1, tree: { combinator: 'and', rules: [], extra: 1 } })),
    ).toThrow(/unexpected key "extra"/)
  })

  it('rejects a rule carrying an extra key', () => {
    expect(() =>
      deserialize(
        JSON.stringify({
          v: 1,
          tree: {
            combinator: 'and',
            rules: [{ field: 'a', operator: 'eq', value: 1, label: 'oops' }],
          },
        }),
      ),
    ).toThrow(/rules\[0\]: unexpected key "label"/)
  })

  it('rejects a group/rule hybrid node', () => {
    // combinator направляет узел в group-валидатор, который отвергает лишние rule-ключи.
    expect(() =>
      deserialize(
        JSON.stringify({
          v: 1,
          tree: { combinator: 'and', rules: [], field: 'a', operator: 'eq', value: 1 },
        }),
      ),
    ).toThrow(/unexpected key "field"/)
  })

  it('rejects an extra key on the envelope', () => {
    expect(() =>
      deserialize(
        JSON.stringify({ v: 1, tree: { combinator: 'and', rules: [] }, hacked: true }),
      ),
    ).toThrow(/envelope: unexpected key "hacked"/)
  })

  it('reports the path to an extra key on a deeply nested node', () => {
    expect(() =>
      deserialize(
        JSON.stringify({
          v: 1,
          tree: {
            combinator: 'and',
            rules: [
              { field: 'a', operator: 'eq', value: 1 },
              {
                combinator: 'or',
                rules: [{ field: 'b', operator: 'eq', value: 2, stray: 9 }],
              },
            ],
          },
        }),
      ),
    ).toThrow(/rules\[1\]\.rules\[0\]: unexpected key "stray"/)
  })

  it('still accepts a clean tree with no extra keys', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'a', operator: 'eq', value: 1 },
        { combinator: 'or', rules: [{ field: 'b', operator: 'in', value: [1, 2] }] },
      ],
    }
    expect(deserialize(serialize(tree))).toEqual(tree)
  })

  it('does not constrain keys inside a rule value object', () => {
    // Строгость только на уровне узла: произвольные ключи внутри value разрешены.
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        {
          field: 'meta',
          operator: 'matches',
          value: { anyKey: 1, another: 'ok', nested: { deep: [true, null] } },
        },
      ],
    }
    expect(deserialize(serialize(tree))).toEqual(tree)
  })
})
