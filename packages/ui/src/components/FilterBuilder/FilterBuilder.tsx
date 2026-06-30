import { useMemo, useRef, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import type { FilterActions } from './actions'
import { FilterGroup } from './FilterGroup'
import type { RenderRuleContext } from './FilterRule'
import { FilterSummary } from './FilterSummary'
import { SchemaRuleEditor } from './SchemaRuleEditor'
import type { FilterFieldSchema } from './schema'
import { builderRoot } from './styles'
import {
  addGroup,
  addRule,
  removeNode,
  setCombinator,
  updateRule,
} from './tree'
import { useFilterMode, type FilterMode } from './useFilterMode'
import type { FilterPath, FilterRule, FilterSchema, FilterTree } from './types'

export interface FilterBuilderProps<S extends FilterSchema = FilterSchema> {
  /** The whole filter tree. The component is fully controlled — it holds no
   * tree state of its own; every edit is reported through {@link onChange}. */
  value: FilterTree<S>
  /** Called with the next tree after any edit. */
  onChange: (next: FilterTree<S>) => void
  /**
   * Factory for the rule appended by "Add rule". A concrete schema should pass
   * its own so the new rule satisfies the discriminated union; the default
   * builds a blank permissive rule.
   */
  createRule?: () => FilterRule<S>
  /**
   * Optional seam: render a rule with custom controls instead of the built-in
   * field/operator/value editor. Receives the rule plus pre-bound
   * `update`/`remove` callbacks and an `idBase` for unique control ids. An
   * explicit `renderRule` always wins over the schema-driven editor below.
   */
  renderRule?: (ctx: RenderRuleContext<S>) => ReactNode
  /**
   * Runtime field schema. When supplied (and no explicit `renderRule`), each
   * rule is edited with a schema-driven field/operator/value editor and the
   * compact mode summarises rules using the field labels and options.
   */
  fields?: FilterFieldSchema
  /**
   * Display mode. `'expanded'` (default) shows full editable controls;
   * `'compact'` shows a read-only chip summary; `'auto'` picks compact on a
   * narrow container. `'auto'` needs `fields` to summarise meaningfully.
   */
  mode?: FilterMode
  /** Container width (px) at/below which `'auto'` resolves to compact. */
  compactBreakpoint?: number
  className?: string
}

// Without a concrete schema the union widens to `{ field: string; operator:
// string; value: FilterValue }`, so a blank rule is structurally valid; the cast
// is only needed for the parameterised-schema case, where the consumer supplies
// its own `createRule`.
//
// Footgun: against a CONCRETE schema with no `createRule` prop, "Add rule" emits
// this blank rule into `value` — a structurally off-union rule the cast hides
// from the type system (empty field/operator may not exist in the schema).
// Concrete-schema consumers should always pass `createRule` so new rules satisfy
// the discriminated union.
function defaultCreateRule<S extends FilterSchema>(): FilterRule<S> {
  return { field: '', operator: '', value: '' } as FilterRule<S>
}

/**
 * Controlled, recursive view over a {@link FilterTree}. It renders the root
 * group and dispatches every edit through a single stable `actions` object: the
 * tree itself lives in `value`, never in component state.
 *
 * The `actions` object and its methods are created once (`useMemo(…, [])`). They
 * read the latest `value`/`onChange`/`createRule` from refs updated on every
 * render, so their identity is stable across renders without going stale. Stable
 * `actions` flowing down to the memoised `FilterGroup`/`FilterRule` rows is what
 * keeps an edit to one rule from re-rendering the rest of the tree.
 */
export function FilterBuilder<S extends FilterSchema = FilterSchema>({
  value,
  onChange,
  createRule,
  renderRule,
  fields,
  mode = 'expanded',
  compactBreakpoint,
  className,
}: FilterBuilderProps<S>) {
  const treeRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const createRuleRef = useRef(createRule)
  treeRef.current = value
  onChangeRef.current = onChange
  createRuleRef.current = createRule

  const rootRef = useRef<HTMLDivElement>(null)
  const resolvedMode = useFilterMode(mode, rootRef, compactBreakpoint)

  const actions = useMemo<FilterActions<S>>(() => {
    const emit = (next: FilterTree<S>) => onChangeRef.current(next)
    const make = () => (createRuleRef.current ?? defaultCreateRule<S>)()
    return {
      addRule: (path: FilterPath) =>
        emit(addRule(treeRef.current, path, make())),
      addGroup: (path: FilterPath) => emit(addGroup(treeRef.current, path)),
      removeNode: (path: FilterPath) => emit(removeNode(treeRef.current, path)),
      updateRule: (path, patch) =>
        emit(updateRule(treeRef.current, path, patch)),
      setCombinator: (path, combinator) =>
        emit(setCombinator(treeRef.current, path, combinator)),
    }
  }, [])

  // Precedence: an explicit `renderRule` always wins; otherwise, given `fields`,
  // build the schema-driven editor; otherwise fall back to the default editor.
  const effectiveRenderRule = useMemo<
    ((ctx: RenderRuleContext<S>) => ReactNode) | undefined
  >(() => {
    if (renderRule) return renderRule
    if (fields)
      return (ctx: RenderRuleContext<S>) => (
        <SchemaRuleEditor ctx={ctx} schema={fields} />
      )
    return undefined
  }, [renderRule, fields])

  return (
    <div ref={rootRef} className={cn(builderRoot(), className)}>
      {resolvedMode === 'compact' && fields ? (
        <FilterSummary tree={value} schema={fields} />
      ) : (
        <FilterGroup
          group={value}
          path={[]}
          actions={actions}
          renderRule={effectiveRenderRule}
          isRoot
        />
      )}
    </div>
  )
}
