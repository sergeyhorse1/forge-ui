import { memo, useId, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import type { FilterActions } from './actions'
import { encodePath } from './focus'
import { removeButton, ruleControl, ruleRow } from './styles'
import type { RulePatch } from './tree'
import type { FilterPath, FilterRule as FilterRuleModel, FilterSchema } from './types'

/**
 * Context handed to a custom {@link FilterBuilderProps.renderRule}: the current
 * rule, pre-bound `update`/`remove`, an `idBase` for unique control ids, and the
 * rule's `path`. A custom renderer need not stamp any focus attribute — the row
 * wrapper carries `data-rule-path` for post-commit focus management.
 */
export interface RenderRuleContext<S extends FilterSchema> {
  rule: FilterRuleModel<S>
  update: (patch: RulePatch<S>) => void
  remove: () => void
  idBase: string
  path: FilterPath
}

interface FilterRuleProps<S extends FilterSchema> {
  rule: FilterRuleModel<S>
  path: FilterPath
  actions: FilterActions<S>
  renderRule?: (ctx: RenderRuleContext<S>) => ReactNode
}

// Минимальный нативный field/operator/value редактор, когда renderRule не задан.
function DefaultRuleEditor<S extends FilterSchema>({
  rule,
  update,
  remove,
  idBase,
}: RenderRuleContext<S>) {
  return (
    <div className={cn(ruleRow())}>
      <label className="sr-only" htmlFor={`${idBase}-field`}>
        Field
      </label>
      <input
        id={`${idBase}-field`}
        className={cn(ruleControl())}
        placeholder="Field"
        value={rule.field}
        onChange={(event) =>
          update({ field: event.target.value } as RulePatch<S>)
        }
      />

      <label className="sr-only" htmlFor={`${idBase}-operator`}>
        Operator
      </label>
      <input
        id={`${idBase}-operator`}
        className={cn(ruleControl())}
        placeholder="Operator"
        value={rule.operator}
        onChange={(event) =>
          update({ operator: event.target.value } as RulePatch<S>)
        }
      />

      <label className="sr-only" htmlFor={`${idBase}-value`}>
        Value
      </label>
      <input
        id={`${idBase}-value`}
        className={cn(ruleControl())}
        placeholder="Value"
        value={String(rule.value ?? '')}
        onChange={(event) =>
          update({ value: event.target.value } as RulePatch<S>)
        }
      />

      <button
        type="button"
        className={cn(removeButton())}
        aria-label="Remove rule"
        onClick={remove}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  )
}

function FilterRuleInner<S extends FilterSchema>({
  rule,
  path,
  actions,
  renderRule,
}: FilterRuleProps<S>) {
  const idBase = useId()
  const ctx: RenderRuleContext<S> = {
    rule,
    idBase,
    path,
    update: (patch) => actions.updateRule(path, patch),
    remove: () => actions.removeNode(path),
  }

  // Штампуем data-rule-path на одной display:contents обёртке вокруг того, что
  // рендерит строка (встроенный редактор или renderRule консьюмера). Централизация
  // здесь даёт кастомным рендерерам пост-коммит фокус бесплатно, а contents держит
  // обёртку вне layout, не трогая flex/grid строки.
  return (
    <div className="contents" data-rule-path={encodePath(path)}>
      {renderRule ? renderRule(ctx) : <DefaultRuleEditor {...ctx} />}
    </div>
  )
}

// Одно листовое правило в React.memo: вместе со структурным шарингом дерева
// (нетронутые правила хранят === identity) и стабильными actions/path из корня
// правка значения одного правила не перерисовывает сиблингов.
export const FilterRule = memo(FilterRuleInner) as typeof FilterRuleInner
