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
 * Children are keyed by array index rather than a node id because the model
 * carries no ids and a node's identity *is* its position; the tree ops rebuild
 * the affected slice on every edit, so index keys track the structure exactly.
 */
export const FilterGroup = memo(FilterGroupInner) as typeof FilterGroupInner
