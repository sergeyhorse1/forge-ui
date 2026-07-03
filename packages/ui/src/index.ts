// Импорт стилей здесь делает собранный dist/styles.css сайд-эффектом пакета
// (для бандлеров, уважающих sideEffects). Свой Tailwind-билд — через /preset.
import './styles/globals.css'

export { cn } from './utils/cn'

export {
  DataGrid,
  useDataGrid,
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH,
  DEFAULT_ROW_HEIGHT,
  RESIZE_KEYBOARD_STEP,
} from './components/DataGrid'
export type {
  ColumnAlign,
  ColumnDef,
  ColumnId,
  ColumnSortInfo,
  DataGridModel,
  DataGridProps,
  ResolvedColumn,
  RowKey,
  SelectionMode,
  SelectionOptions,
  SortDirection,
  SortOptions,
  SortState,
  UseDataGridOptions,
} from './components/DataGrid'

export {
  FilterBuilder,
  isGroup,
  isRule,
  addGroup,
  addRule,
  emptyGroup,
  getNodeAt,
  removeNode,
  setCombinator,
  updateRule,
  deserialize,
  serialize,
  OPERATORS_BY_TYPE,
  fieldConfig,
  operatorsForField,
  operatorDef,
  operatorDefForField,
  defaultOperatorForField,
  defaultValueFor,
  coerceValue,
  reconcileField,
  reconcileOperator,
  describeCombinator,
  summarizeGroup,
  summarizeRule,
  summarizeRuleText,
  DEFAULT_COMPACT_BREAKPOINT,
} from './components/FilterBuilder'
export type {
  Combinator,
  FieldShape,
  FilterBuilderProps,
  FilterGroup,
  FilterNode,
  FilterPath,
  FilterRule,
  FilterSchema,
  FilterTree,
  FilterValue,
  RenderRuleContext,
  RulePatch,
  EnumOption,
  FieldType,
  FilterFieldConfig,
  FilterFieldSchema,
  FilterMode,
  OperatorDef,
  OperatorInputKind,
  ResolvedFilterMode,
  RuleSummaryParts,
} from './components/FilterBuilder'

export {
  preset,
  lightTokens,
  darkTokens,
  darkSelector,
} from './styles/preset'
export type { ForgeThemeTokens, ForgePreset } from './styles/preset'

export {
  useControllableState,
  useDebouncedValue,
  useMediaQuery,
  useFocusVisible,
} from './hooks'
export type { UseControllableStateParams } from './hooks'
