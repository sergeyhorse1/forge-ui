import { cva } from 'class-variance-authority'

export const builderRoot = cva('text-sm text-foreground')

export const groupPanel = cva(
  'flex flex-col gap-3 rounded-md border border-border p-3',
  {
    variants: {
      root: {
        true: 'bg-card',
        false: 'bg-muted/40',
      },
    },
    defaultVariants: { root: true },
  },
)

export const groupHeader = cva('flex items-center justify-between gap-2')

export const groupChildren = cva('flex flex-col gap-2 border-l border-border pl-4')

export const combinatorToggle = cva(
  'inline-flex overflow-hidden rounded-md border border-border',
)

// На активном сегменте ринг перекрашен: --color-ring == --color-primary, на своей же заливке он не виден
export const combinatorButton = cva(
  'px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
  {
    variants: {
      active: {
        true: 'bg-primary font-semibold text-primary-foreground focus-visible:ring-primary-foreground',
        false: 'bg-muted font-normal text-muted-foreground hover:bg-muted/70',
      },
    },
    defaultVariants: { active: false },
  },
)

export const addButton = cva(
  'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

export const groupActions = cva('flex items-center gap-2')

export const removeButton = cva(
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

export const ruleRow = cva(
  'flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2',
)

export const ruleControl = cva(
  'h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

// Flex, а не двухколоночная сетка: такую утилиту заваливает dist-гард
export const ruleRangeGroup = cva('flex min-w-0 flex-1 items-center gap-2')

export const ruleRangeSeparator = cva('shrink-0 text-xs text-muted-foreground')

export const ruleMultiControl = cva(
  'min-h-16 min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

export const summaryRoot = cva('flex flex-col gap-2 text-sm text-foreground')

export const summaryGroup = cva(
  'flex flex-col gap-2 rounded-md border border-border p-2',
  {
    variants: {
      root: { true: 'bg-card', false: 'bg-muted/40' },
    },
    defaultVariants: { root: true },
  },
)

export const summaryCombinator = cva(
  'text-xs font-semibold tracking-wide text-muted-foreground uppercase',
)

export const summaryChildren = cva('flex flex-wrap items-start gap-2')

export const summaryChip = cva(
  'inline-flex min-w-0 max-w-full items-baseline gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs break-words text-foreground',
)

export const summaryChipField = cva('font-medium text-foreground')

export const summaryChipOperator = cva('text-muted-foreground')

// wrap-anywhere, а не break-words: он ещё и режет min-content ширину, иначе flex-чип не ужмётся
export const summaryChipValue = cva('min-w-0 wrap-anywhere font-medium text-foreground')
