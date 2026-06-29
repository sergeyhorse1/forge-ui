import {
  isGroup,
  type FilterGroup,
  type FilterNode,
  type FilterPath,
  type FilterRule,
  type FilterSchema,
  type FilterTree,
} from './types'

/**
 * Immutable, structurally-sharing operations over a {@link FilterTree}.
 *
 * Every function returns a **new** tree and never mutates its input. Crucially,
 * only the groups *along the edited path* are cloned; every untouched branch
 * keeps its object identity (`===`). That reference stability is what lets the
 * presentation layer memoise rule rows and skip re-rendering siblings when one
 * rule changes — see ADR-007. Do not reach for `structuredClone`: deep-cloning
 * the whole tree would defeat structural sharing and the perf budget.
 */

/** An empty group with the default `and` combinator. */
export function emptyGroup<S extends FilterSchema = FilterSchema>(): FilterGroup<S> {
  return { combinator: 'and', rules: [] }
}

function describePath(path: FilterPath): string {
  return path.length === 0 ? '[] (root)' : `[${path.join(', ')}]`
}

/**
 * Resolve the node a path points at. Throws if any index along the way is out
 * of range or descends into a leaf rule.
 */
export function getNodeAt<S extends FilterSchema>(
  tree: FilterTree<S>,
  path: FilterPath,
): FilterNode<S> {
  let node: FilterNode<S> = tree
  for (let depth = 0; depth < path.length; depth += 1) {
    if (!isGroup(node)) {
      throw new Error(
        `Cannot descend into a rule at path ${describePath(path.slice(0, depth))}`,
      )
    }
    const index = path[depth] as number
    const child: FilterNode<S> | undefined = node.rules[index]
    if (child === undefined) {
      throw new Error(`No node at index ${index} in path ${describePath(path)}`)
    }
    node = child
  }
  return node
}

/**
 * Core recursive rewrite. Walks `path` from `group` and returns a new tree in
 * which the group addressed by `path` is replaced by `transform(group)`. Only
 * the groups visited on the way down are copied; sibling nodes are reused by
 * reference. The remaining `path` is consumed one index per level.
 */
function rewriteGroupAt<S extends FilterSchema>(
  group: FilterGroup<S>,
  path: FilterPath,
  transform: (group: FilterGroup<S>) => FilterGroup<S>,
): FilterGroup<S> {
  if (path.length === 0) return transform(group)

  const index = path[0] as number
  const child = group.rules[index]
  if (child === undefined) {
    throw new Error(`No node at index ${index} while updating group`)
  }
  if (!isGroup(child)) {
    throw new Error(`Expected a group at index ${index}, found a rule`)
  }

  const nextChild = rewriteGroupAt(child, path.slice(1), transform)
  const nextRules = group.rules.slice()
  nextRules[index] = nextChild
  return { ...group, rules: nextRules }
}

/** Append a rule to the group addressed by `path`. */
export function addRule<S extends FilterSchema>(
  tree: FilterTree<S>,
  path: FilterPath,
  rule: FilterRule<S>,
): FilterTree<S> {
  return rewriteGroupAt(tree, path, (group) => ({
    ...group,
    rules: [...group.rules, rule],
  }))
}

/** Append a group (a fresh empty one by default) to the group at `path`. */
export function addGroup<S extends FilterSchema>(
  tree: FilterTree<S>,
  path: FilterPath,
  group: FilterGroup<S> = emptyGroup<S>(),
): FilterTree<S> {
  return rewriteGroupAt(tree, path, (parent) => ({
    ...parent,
    rules: [...parent.rules, group],
  }))
}

/**
 * Remove the node addressed by `path` from its parent group. Removing the root
 * (`[]`) is an error.
 */
export function removeNode<S extends FilterSchema>(
  tree: FilterTree<S>,
  path: FilterPath,
): FilterTree<S> {
  if (path.length === 0) {
    throw new Error('Cannot remove the root group')
  }
  const parentPath = path.slice(0, -1)
  const index = path[path.length - 1] as number
  return rewriteGroupAt(tree, parentPath, (parent) => {
    if (parent.rules[index] === undefined) {
      throw new Error(`No node at index ${index} to remove`)
    }
    return {
      ...parent,
      rules: parent.rules.filter((_, i) => i !== index),
    }
  })
}

/** Patch object or updater function accepted by {@link updateRule}. */
export type RulePatch<S extends FilterSchema> =
  | Partial<FilterRule<S>>
  | ((rule: FilterRule<S>) => FilterRule<S>)

/**
 * Replace or patch the rule addressed by `path`. `patch` is either a partial
 * object merged onto the rule or an updater receiving the current rule.
 * Throws if `path` points at a group rather than a rule.
 */
export function updateRule<S extends FilterSchema>(
  tree: FilterTree<S>,
  path: FilterPath,
  patch: RulePatch<S>,
): FilterTree<S> {
  if (path.length === 0) {
    throw new Error('Path [] (root) refers to a group, not a rule')
  }
  const parentPath = path.slice(0, -1)
  const index = path[path.length - 1] as number
  return rewriteGroupAt(tree, parentPath, (parent) => {
    const target = parent.rules[index]
    if (target === undefined) {
      throw new Error(`No node at index ${index} to update`)
    }
    if (isGroup(target)) {
      throw new Error(`Path ${describePath(path)} refers to a group, not a rule`)
    }
    const nextRule =
      typeof patch === 'function' ? patch(target) : { ...target, ...patch }
    const nextRules = parent.rules.slice()
    nextRules[index] = nextRule
    return { ...parent, rules: nextRules }
  })
}

/** Change the combinator of the group addressed by `path`. */
export function setCombinator<S extends FilterSchema>(
  tree: FilterTree<S>,
  path: FilterPath,
  combinator: FilterGroup<S>['combinator'],
): FilterTree<S> {
  return rewriteGroupAt(tree, path, (group) => ({ ...group, combinator }))
}
