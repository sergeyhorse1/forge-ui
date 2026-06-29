import { cva } from 'class-variance-authority'

import type { ColumnAlign } from './types'

/** Map column alignment to the matching justify utility for a flex cell. */
export const ALIGN_CLASS: Record<ColumnAlign, string> = {
  left: 'justify-start text-left',
  center: 'justify-center text-center',
  right: 'justify-end text-right',
}

export const gridRoot = cva(
  'relative isolate overflow-hidden rounded-md border border-border bg-background text-sm text-foreground',
)

export const headerCell = cva(
  'flex h-full items-center gap-1.5 border-b border-border bg-muted/60 px-3 font-medium text-muted-foreground select-none',
  {
    variants: {
      sortable: {
        true: 'cursor-pointer hover:bg-muted focus-visible:bg-muted',
        false: '',
      },
    },
    defaultVariants: { sortable: false },
  },
)

export const bodyCell = cva(
  'flex h-full items-center overflow-hidden px-3 whitespace-nowrap',
)

export const rowBase = cva('flex border-b border-border/60', {
  variants: {
    selected: {
      // The accent rail is an inset box-shadow rather than a left border so it
      // never alters the row's box size or the offsets of the absolutely
      // positioned cells inside it. Combined with a stronger tint and bold,
      // foreground-coloured text it reads clearly in both light and dark themes.
      true: 'bg-primary/15 font-medium text-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]',
      false: 'hover:bg-muted/40',
    },
  },
  defaultVariants: { selected: false },
})

export const resizeHandle = cva(
  'absolute top-0 right-0 z-10 flex h-full w-2 translate-x-1/2 cursor-col-resize touch-none items-stretch justify-center focus-visible:outline-none',
)

export const resizeBar = cva('w-px bg-border', {
  variants: {
    active: { true: 'bg-primary', false: 'group-hover:bg-primary/60' },
  },
  defaultVariants: { active: false },
})

export const sortIndicator = cva('text-xs leading-none', {
  variants: {
    active: { true: 'text-foreground', false: 'text-transparent' },
  },
  defaultVariants: { active: false },
})
