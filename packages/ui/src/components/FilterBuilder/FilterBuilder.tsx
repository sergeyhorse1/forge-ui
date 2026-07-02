import { useEffect, useMemo, useRef, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import type { FilterActions } from './actions'
import { focusIntent, type FocusIntent } from './focus'
import { FilterGroup } from './FilterGroup'
import type { RenderRuleContext } from './FilterRule'
import { FilterSummary } from './FilterSummary'
import { SchemaRuleEditor } from './SchemaRuleEditor'
import type { FilterFieldSchema } from './schema'
import { builderRoot } from './styles'
import {
  addGroup,
  addRule,
  getNodeAt,
  removeNode,
  setCombinator,
  updateRule,
} from './tree'
import { useFilterMode, type FilterMode } from './useFilterMode'
import { isGroup } from './types'
import type { FilterPath, FilterRule, FilterSchema, FilterTree } from './types'

// The root group lives at the empty path. This must be a single stable
// reference, not a fresh `[]` literal per render: the root `FilterGroup`
// derives its children's `path` arrays from this prop and memoises them on
// `[path, rules.length]`. A new array each render would invalidate that memo,
// hand every direct child a new `path`, and cascade a re-render through the
// whole tree — defeating the per-row memoisation. Frozen so it cannot be
// mutated into a non-empty path by accident.
const ROOT_PATH: FilterPath = Object.freeze([])

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
   * narrow container. The chip summary needs `fields`, so without `fields` both
   * `'compact'` and `'auto'` fall back to the editable tree.
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

  // Records where focus should land after the next commit, paired with the exact
  // tree that commit is expected to produce. A ref (not state) so recording an
  // intent neither triggers a render nor reintroduces tree state — it is stable
  // across renders, which is why the `actions` memo below can close over it with
  // an empty dependency list.
  const pendingFocusRef = useRef<{
    intent: FocusIntent
    expected: FilterTree<S>
  } | null>(null)

  const actions = useMemo<FilterActions<S>>(() => {
    const emit = (next: FilterTree<S>) => onChangeRef.current(next)
    const make = () => (createRuleRef.current ?? defaultCreateRule<S>)()
    // Where a newly appended node lands: after `addRule`/`addGroup` the new node
    // sits at the current child count of the target group (0 if it is a leaf,
    // which cannot happen for these paths but keeps the read total).
    const appendIndex = (path: FilterPath) => {
      const group = getNodeAt(treeRef.current, path)
      return isGroup(group) ? group.rules.length : 0
    }
    return {
      addRule: (path: FilterPath) => {
        const next = addRule(treeRef.current, path, make())
        pendingFocusRef.current = {
          intent: { kind: 'ruleFirstControl', path: [...path, appendIndex(path)] },
          expected: next,
        }
        emit(next)
      },
      addGroup: (path: FilterPath) => {
        const next = addGroup(treeRef.current, path)
        pendingFocusRef.current = {
          intent: { kind: 'groupFirstControl', path: [...path, appendIndex(path)] },
          expected: next,
        }
        emit(next)
      },
      removeNode: (path: FilterPath) => {
        const next = removeNode(treeRef.current, path)
        pendingFocusRef.current = {
          intent: {
            kind: 'afterRemove',
            parentPath: path.slice(0, -1),
            index: path[path.length - 1]!,
          },
          expected: next,
        }
        emit(next)
      },
      // Editing clears any stale focus intent: the user is typing, so a focus
      // jump is unwanted, and a leftover add/remove intent must not fire on this
      // commit.
      updateRule: (path, patch) => {
        pendingFocusRef.current = null
        emit(updateRule(treeRef.current, path, patch))
      },
      setCombinator: (path, combinator) => {
        pendingFocusRef.current = null
        emit(setCombinator(treeRef.current, path, combinator))
      },
    }
  }, [])

  // Resolve a pending focus intent only when the consumer echoed back exactly the
  // tree the action computed (`value === expected`). Depending on `[value]`, this
  // runs on every tree change; the identity gate ensures a rejected, transformed,
  // or superseded edit never moves focus — so a stale intent can neither steal
  // focus from a field the user is editing nor fire on an unrelated re-render.
  //
  // Trade-off: a consumer that clones/normalises the tree instead of echoing it
  // by reference (the `onChange={setValue}` pattern used everywhere here echoes
  // exactly) simply gets no focus movement — graceful degradation, never a theft.
  useEffect(() => {
    const pending = pendingFocusRef.current
    if (pending === null) return
    if (value !== pending.expected) return
    pendingFocusRef.current = null
    const root = rootRef.current
    if (root === null) return
    focusIntent(root, pending.intent, value)
  }, [value])

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
          path={ROOT_PATH}
          actions={actions}
          renderRule={effectiveRenderRule}
          isRoot
        />
      )}
    </div>
  )
}
