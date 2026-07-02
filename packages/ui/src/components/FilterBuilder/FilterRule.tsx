import { memo, useId, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import type { FilterActions } from './actions'
import { encodePath } from './focus'
import { removeButton, ruleControl, ruleRow } from './styles'
import type { RulePatch } from './tree'
import type { FilterPath, FilterRule as FilterRuleModel, FilterSchema } from './types'

/**
 * Context handed to a custom {@link FilterBuilderProps.renderRule}. It exposes the
 * current rule plus pre-bound `update`/`remove` callbacks, an `idBase` for
 * deriving stable, unique control ids — the seam the schema-driven editor uses to
 * swap itself in without re-implementing the tree wiring — and the rule's `path`.
 *
 * A custom renderer does **not** need to stamp any focus attribute: `FilterRule`
 * wraps every rendered row (built-in or custom) in a `display:contents` element
 * carrying `data-rule-path`, so post-commit focus management can address the row
 * without the renderer's cooperation. `path` is exposed for renderers that want
 * to derive their own addressing.
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

/** The minimal native field/operator/value editor used when no `renderRule`. */
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

  // Stamp `data-rule-path` on a single `display:contents` wrapper around whatever
  // the row renders — built-in editor or a consumer's `renderRule`. Centralising
  // it here (rather than in each editor) means custom renderers get post-commit
  // focus management for free, and `contents` keeps the wrapper out of layout so
  // the row's own flex/grid is unaffected.
  // Stamp `data-rule-path` on a single `display:contents` wrapper around whatever
  // the row renders — built-in editor or a consumer's `renderRule`. Centralising
  // it here (rather than in each editor) means custom renderers get post-commit
  // focus management for free, and `contents` keeps the wrapper out of layout so
  // the row's own flex/grid is unaffected.
  return (
    <div className="contents" data-rule-path={encodePath(path)}>
      {renderRule ? renderRule(ctx) : <DefaultRuleEditor {...ctx} />}
    </div>
  )
}

/**
 * A single leaf rule. Wrapped in `React.memo`: combined with the structural
 * sharing in the tree ops (untouched rules keep their `===` identity) and the
 * stable `actions`/`path` references threaded from the root, editing one rule's
 * value does not re-render its siblings.
 */
export const FilterRule = memo(FilterRuleInner) as typeof FilterRuleInner
