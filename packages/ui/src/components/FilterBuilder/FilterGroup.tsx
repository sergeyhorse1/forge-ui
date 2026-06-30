import { memo, useMemo, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import type { FilterActions } from './actions'
import { FilterRule, type RenderRuleContext } from './FilterRule'
import {
  addButton,
  combinatorButton,
  combinatorToggle,
  groupActions,
  groupChildren,
  groupHeader,
  groupPanel,
  removeButton,
} from './styles'
import { isGroup } from './types'
import type {
  Combinator,
  FilterGroup as FilterGroupModel,
  FilterPath,
  FilterSchema,
} from './types'

const COMBINATORS: readonly Combinator[] = ['and', 'or']

interface FilterGroupProps<S extends FilterSchema> {
  group: FilterGroupModel<S>
  path: FilterPath
  actions: FilterActions<S>
  isRoot?: boolean
  renderRule?: (ctx: RenderRuleContext<S>) => ReactNode
}

function FilterGroupInner<S extends FilterSchema>({
  group,
  path,
  actions,
  isRoot = false,
  renderRule,
}: FilterGroupProps<S>) {
  // Re-key only on length: editing a rule's value (length unchanged) keeps each
  // child path array referentially stable, so memoised child rows are not forced
  // to re-render by a fresh path prop.
  const childPaths = useMemo(
    () => group.rules.map((_, index) => [...path, index] as FilterPath),
    [path, group.rules.length],
  )

  return (
    <div className={cn(groupPanel({ root: isRoot }))}>
      <div className={cn(groupHeader())}>
        <div
          className={cn(combinatorToggle())}
          role="group"
          aria-label="Combinator"
        >
          {COMBINATORS.map((combinator) => {
            const active = group.combinator === combinator
            return (
              <button
                key={combinator}
                type="button"
                className={cn(combinatorButton({ active }))}
                aria-pressed={active}
                onClick={() => actions.setCombinator(path, combinator)}
              >
                {combinator.toUpperCase()}
              </button>
            )
          })}
        </div>

        {!isRoot && (
          <button
            type="button"
            className={cn(removeButton())}
            aria-label="Remove group"
            onClick={() => actions.removeNode(path)}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>

      {group.rules.length > 0 && (
        <div className={cn(groupChildren())}>
          {group.rules.map((child, index) => {
            const childPath = childPaths[index]!
            // Keyed by position — see the accepted-limitation note below the
            // component for why index keys are used and their one trade-off.
            if (isGroup(child)) {
              return (
                <FilterGroup
                  key={index}
                  group={child}
                  path={childPath}
                  actions={actions}
                  renderRule={renderRule}
                />
              )
            }
            return (
              <FilterRule
                key={index}
                rule={child}
                path={childPath}
                actions={actions}
                renderRule={renderRule}
              />
            )
          })}
        </div>
      )}

      <div className={cn(groupActions())}>
        <button
          type="button"
          className={cn(addButton())}
          onClick={() => actions.addRule(path)}
        >
          Add rule
        </button>
        <button
          type="button"
          className={cn(addButton())}
          onClick={() => actions.addGroup(path)}
        >
          Add group
        </button>
      </div>
    </div>
  )
}

/**
 * A group panel rendered recursively: each child is either another
 * `FilterGroup` (nested at `[...path, index]`) or a `FilterRule`. Wrapped in
 * `React.memo` so a change isolated to one branch — thanks to the tree's
 * structural sharing — does not re-render unrelated sibling groups.
 *
 * ## Positional keying (accepted limitation)
 *
 * Children are keyed by their array index, because the normalized model carries
 * no node id — a node's identity *is* its position in the parent's `rules`. Both
 * alternatives are unsound here:
 *
 * - **A `WeakMap<node, id>` keyed by object identity** would remount the input
 *   on every keystroke: an edit replaces the rule with a new object
 *   (`{ ...rule, ...patch }`), so its identity — and thus its key — changes on
 *   each change event, dropping focus mid-type. Strictly worse.
 * - **An explicit `id` field on rules/groups** is a model and wire-format change
 *   (it touches the type, serialization and round trip), which the model layer
 *   deliberately rejected: node identity is positional by design.
 *
 * The trade-off this accepts: when a non-last sibling is removed, React reuses
 * DOM nodes by index, so transient DOM state (focus, caret, IME composition) can
 * stay on a physical input that now backs the next rule. The controlled
 * **values** always re-project correctly — only momentary focus can misattribute
 * across a mid-list removal. Revisit if the model ever gains stable node ids.
 */
export const FilterGroup = memo(FilterGroupInner) as typeof FilterGroupInner
