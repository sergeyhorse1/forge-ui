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

// Корневая группа живёт по пустому пути. Это должна быть одна стабильная ссылка, а
// не свежий [] на каждый рендер: корневой FilterGroup выводит path детей из этого
// пропа и мемоизирует их на [path, rules.length]. Новый массив каждый рендер убил
// бы memo, раздал детям новые path и каскадом перерисовал всё дерево. Заморожен,
// чтобы случайно не стал непустым путём.
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
   * Seam to render a rule with custom controls instead of the built-in editor.
   * Receives the rule plus pre-bound `update`/`remove` and an `idBase` for unique
   * control ids; an explicit `renderRule` always wins over the schema editor.
   */
  renderRule?: (ctx: RenderRuleContext<S>) => ReactNode
  /**
   * Runtime field schema. When supplied (and no explicit `renderRule`), each
   * rule is edited with a schema-driven field/operator/value editor and the
   * compact mode summarises rules using the field labels and options.
   */
  fields?: FilterFieldSchema
  /**
   * Display mode: `'expanded'` (default) full editable controls, `'compact'` a
   * read-only chip summary, `'auto'` compact on a narrow container. The chip
   * summary needs `fields`; without it `'compact'`/`'auto'` fall back to the tree.
   */
  mode?: FilterMode
  /** Container width (px) at/below which `'auto'` resolves to compact. */
  compactBreakpoint?: number
  className?: string
}

// Без конкретной схемы union расширяется до {field:string; operator:string;
// value:FilterValue}, так что пустое правило структурно валидно; каст нужен лишь для
// параметризованной схемы. Footgun: против КОНКРЕТНОЙ схемы без пропа createRule
// «Add rule» вбросит это пустое правило в value — вне-union правило, которое каст
// прячет от типов. Консьюмеры с конкретной схемой должны всегда передавать createRule.
function defaultCreateRule<S extends FilterSchema>(): FilterRule<S> {
  return { field: '', operator: '', value: '' } as FilterRule<S>
}

/**
 * Controlled, recursive view over a {@link FilterTree}. Renders the root group
 * and dispatches every edit through a single stable `actions` object; the tree
 * lives in `value`, never in component state.
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

  // Куда сядет фокус после следующего коммита, в паре с точным деревом, которое
  // этот коммит должен дать. Ref (не state): запись намерения не триггерит рендер и
  // не возвращает состояние дерева — стабильна между рендерами, поэтому actions-memo
  // ниже может замкнуться на неё с пустым списком зависимостей.
  const pendingFocusRef = useRef<{
    intent: FocusIntent
    expected: FilterTree<S>
  } | null>(null)

  const actions = useMemo<FilterActions<S>>(() => {
    const emit = (next: FilterTree<S>) => onChangeRef.current(next)
    const make = () => (createRuleRef.current ?? defaultCreateRule<S>)()
    // Куда встанет добавленный узел: после addRule/addGroup он на позиции текущего
    // числа детей целевой группы (0 для листа — для этих путей невозможно, но
    // делает чтение тотальным).
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
      // Правка сбрасывает устаревшее focus-намерение: юзер печатает, прыжок фокуса
      // не нужен, и оставшееся add/remove-намерение не должно сработать на коммите.
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

  // Разрешаем focus-намерение только когда консьюмер вернул РОВНО то дерево, что
  // посчитал экшен (value === expected). Гейт по identity гарантирует, что
  // отклонённая/трансформированная/перекрытая правка не двинет фокус — устаревшее
  // намерение не украдёт фокус у редактируемого поля и не сработает на постороннем
  // рендере. Trade-off: консьюмер, клонирующий/нормализующий дерево вместо эхо по
  // ссылке, просто не получит движения фокуса — мягкая деградация, не кража.
  useEffect(() => {
    const pending = pendingFocusRef.current
    if (pending === null) return
    if (value !== pending.expected) return
    pendingFocusRef.current = null
    const root = rootRef.current
    if (root === null) return
    focusIntent(root, pending.intent, value)
  }, [value])

  // Приоритет: явный renderRule всегда побеждает; иначе при наличии fields —
  // schema-driven редактор; иначе дефолтный.
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
