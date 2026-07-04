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

// --- Base components ---

export { Button, buttonVariants } from './components/Button'
export type { ButtonProps, ButtonVariantProps } from './components/Button'

export { IconButton } from './components/IconButton'
export type { IconButtonProps } from './components/IconButton'

export { Spinner } from './components/Spinner'
export type { SpinnerProps } from './components/Spinner'

export { Badge } from './components/Badge'
export type { BadgeProps, BadgeVariantProps } from './components/Badge'

export { Avatar } from './components/Avatar'
export type { AvatarProps } from './components/Avatar'

export { Skeleton } from './components/Skeleton'
export type { SkeletonProps } from './components/Skeleton'

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/Card'
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './components/Card'


export { Input, inputVariants } from './components/Input'
export type { InputProps, InputVariantProps } from './components/Input'

export { Textarea, textareaVariants } from './components/Textarea'
export type { TextareaProps, TextareaVariantProps } from './components/Textarea'

export { Checkbox, checkboxVariants } from './components/Checkbox'
export type { CheckboxProps, CheckboxVariantProps } from './components/Checkbox'

export { RadioGroup, RadioItem, radioGroupVariants, radioItemVariants } from './components/Radio'
export type { RadioGroupProps, RadioItemProps, RadioGroupVariantProps } from './components/Radio'

export { Switch, switchVariants } from './components/Switch'
export type { SwitchProps, SwitchVariantProps } from './components/Switch'

export { Select, SelectItem, selectTriggerVariants, selectContentVariants, selectItemVariants } from './components/Select'
export type { SelectProps, SelectItemProps, SelectOptionItem, SelectVariantProps } from './components/Select'

export {
  Combobox,
  useCombobox,
  comboboxInputVariants,
  comboboxContentVariants,
  comboboxOptionVariants,
  comboboxGroupLabelVariants,
  comboboxStatusVariants,
} from './components/Combobox'
export type {
  ComboboxProps,
  ComboboxItem,
  ComboboxGroup,
  ComboboxItems,
  ComboboxLoader,
  ComboboxVariantProps,
} from './components/Combobox'


// --- Overlay components ---

export { Tooltip, tooltipContentVariants } from './components/Tooltip'
export type { TooltipProps } from './components/Tooltip'

export { Popover, PopoverTrigger, PopoverContent, PopoverClose, popoverContentVariants } from './components/Popover'
export type { PopoverProps, PopoverTriggerProps, PopoverContentProps, PopoverCloseProps } from './components/Popover'

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  dialogOverlayVariants,
  dialogContentVariants,
  dialogHeaderVariants,
  dialogFooterVariants,
  dialogTitleVariants,
  dialogDescriptionVariants,
} from './components/Dialog'
export type {
  DialogProps,
  DialogTriggerProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogFooterProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
} from './components/Dialog'

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
  sheetOverlayVariants,
  sheetContentVariants,
  sheetHeaderVariants,
  sheetFooterVariants,
  sheetTitleVariants,
  sheetDescriptionVariants,
} from './components/Sheet'
export type {
  SheetProps,
  SheetTriggerProps,
  SheetContentProps,
  SheetHeaderProps,
  SheetFooterProps,
  SheetTitleProps,
  SheetDescriptionProps,
  SheetCloseProps,
  SheetVariantProps,
} from './components/Sheet'

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  useToast,
  toast,
  dismissToast,
  toastViewportVariants,
  toastVariants,
  toastTitleVariants,
  toastDescriptionVariants,
  toastActionVariants,
  toastCloseVariants,
} from './components/Toast'
export type {
  ToastProviderProps,
  ToastViewportProps,
  ToastProps,
  ToastTitleProps,
  ToastDescriptionProps,
  ToastActionProps,
  ToastCloseProps,
  ToastVariantProps,
  ToastData,
  ToastInput,
} from './components/Toast'
