import { memo, useMemo, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import type { FilterActions } from './actions'
import { encodePath } from './focus'
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
  // Ре-ключим только по длине: правка значения правила (длина та же) сохраняет
  // ссылки на path-массивы детей, так что мемоизированные строки не переучитываются
  // свежим path.
  const childPaths = useMemo(
    () => group.rules.map((_, index) => [...path, index] as FilterPath),
    [path, group.rules.length],
  )

  return (
    <div
      className={cn(groupPanel({ root: isRoot }))}
      role="group"
      aria-label={isRoot ? 'Filter rules' : 'Rule group'}
      data-group-path={encodePath(path)}
    >
      <div className={cn(groupHeader())}>
        <div
          className={cn(combinatorToggle())}
          role="group"
          aria-label="Match type"
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
            // Ключ по позиции: id у узла нет, его идентичность и есть индекс в rules родителя
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
          data-add-rule-path={encodePath(path)}
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

// Плата за index-ключи: удалили не-последнего сиблинга, и фокус с кареткой остаются на инпуте, уехавшем к следующему правилу
export const FilterGroup = memo(FilterGroupInner) as typeof FilterGroupInner
