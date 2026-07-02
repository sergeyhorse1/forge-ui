import type { FilterGroup, FilterNode, FilterTree } from '../types'

/**
 * Pure generator for a realistically-shaped filter tree used by the perf story
 * and the perf test. Rules are distributed across nested sub-groups rather than
 * kept flat, so the tree exercises the recursive render path and the
 * structural-sharing tree ops the way a real deep filter would.
 *
 * Keep the call site lazy (`useMemo` in a story, inline in a test) — building a
 * few-hundred-node tree at module scope needlessly slows importing this file and
 * has bitten the DataGrid demos before.
 *
 * @param ruleCount - Total number of leaf rules to place in the tree.
 * @param groupSize - Target number of leaf rules per sub-group; the generator
 *   opens a fresh nested group once the current one reaches this many rules.
 */
export function makeFilterTree(ruleCount: number, groupSize = 10): FilterTree {
  if (ruleCount < 0) throw new Error('ruleCount must be non-negative')
  if (groupSize < 1) throw new Error('groupSize must be at least 1')

  const root: FilterGroup = { combinator: 'and', rules: [] }
  let currentGroup: FilterGroup = root

  for (let index = 0; index < ruleCount; index += 1) {
    // Every `groupSize` rules, nest a new sub-group under the root and continue
    // filling that. The root keeps a couple of direct rules so the tree has a
    // sibling rule beside its first sub-group (mirrors the nested test case).
    if (index > 0 && index % groupSize === 0) {
      const nested: FilterGroup = {
        combinator: index % (groupSize * 2) === 0 ? 'or' : 'and',
        rules: [],
      }
      root.rules.push(nested)
      currentGroup = nested
    }
    currentGroup.rules.push(makeRule(index))
  }

  return root
}

/** A single deterministic rule; `field` is unique so it can key a render map. */
function makeRule(index: number): FilterNode {
  const kind = index % 3
  if (kind === 0) {
    return { field: `field_${index}`, operator: 'contains', value: `q${index}` }
  }
  if (kind === 1) {
    return { field: `field_${index}`, operator: 'gt', value: index }
  }
  return { field: `field_${index}`, operator: 'eq', value: index % 2 === 0 }
}
