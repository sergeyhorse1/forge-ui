import type { Combinator, FilterPath, FilterSchema } from './types'
import type { RulePatch } from './tree'

/**
 * The single dispatch surface threaded from {@link FilterBuilder} down through
 * the recursive view. Each method names a node by its {@link FilterPath} and
 * applies the matching tree operation, then reports the result through the
 * consumer's `onChange`. The view never touches the tree directly and never
 * holds its own copy — these methods read the latest tree from a ref inside the
 * root, so the whole object can stay referentially stable across renders (which
 * keeps `React.memo` on the rows and groups effective).
 */
export interface FilterActions<S extends FilterSchema = FilterSchema> {
  addRule: (path: FilterPath) => void
  addGroup: (path: FilterPath) => void
  removeNode: (path: FilterPath) => void
  updateRule: (path: FilterPath, patch: RulePatch<S>) => void
  setCombinator: (path: FilterPath, combinator: Combinator) => void
}
