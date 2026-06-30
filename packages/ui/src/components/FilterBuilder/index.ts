export { FilterBuilder } from './FilterBuilder'
export type { FilterBuilderProps } from './FilterBuilder'
export type { RenderRuleContext } from './FilterRule'

export type {
  FilterMode,
  ResolvedFilterMode,
} from './useFilterMode'
export { DEFAULT_COMPACT_BREAKPOINT } from './useFilterMode'

export {
  OPERATORS_BY_TYPE,
  fieldConfig,
  operatorsForField,
  operatorDef,
  operatorDefForField,
  defaultOperatorForField,
} from './schema'
export type {
  EnumOption,
  FieldType,
  FilterFieldConfig,
  FilterFieldSchema,
  OperatorDef,
  OperatorInputKind,
} from './schema'

export {
  defaultValueFor,
  coerceValue,
  reconcileField,
  reconcileOperator,
} from './reconcile'

export {
  describeCombinator,
  summarizeGroup,
  summarizeRule,
  summarizeRuleText,
} from './summary'
export type { RuleSummaryParts } from './summary'

export { isGroup, isRule } from './types'
export type {
  Combinator,
  FieldShape,
  FilterGroup,
  FilterNode,
  FilterPath,
  FilterRule,
  FilterSchema,
  FilterTree,
  FilterValue,
} from './types'

export {
  addGroup,
  addRule,
  emptyGroup,
  getNodeAt,
  removeNode,
  setCombinator,
  updateRule,
} from './tree'
export type { RulePatch } from './tree'

export { deserialize, serialize } from './serialization'
