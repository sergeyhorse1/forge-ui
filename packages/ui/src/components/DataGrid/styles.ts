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
        true: 'cursor-pointer hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        false: '',
      },
    },
    defaultVariants: { sortable: false },
  },
)

export const bodyCell = cva(
  // A designed, inset focus ring: cells are absolutely positioned edge-to-edge,
  // so an outset (default) ring would be clipped by the row's overflow or by
  // neighbouring cells. `z-10` lifts the focused cell above its siblings so the
  // ring is never occluded; the ring colour reads in both light and dark themes
  // via the shared `--color-ring` token. `focusRing` carries the same ring for
  // the frozen overlay mirror (see DataGridFrozenBody).
  'relative flex h-full items-center overflow-hidden px-3 whitespace-nowrap focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
  {
    variants: {
      /**
       * The real frozen gridcell is clipped to a 1x1 box so it does not paint a
       * duplicate behind the visual overlay, which means its own focus ring is
       * never visible. The overlay cell therefore mirrors the ring on demand.
       */
      focused: { true: 'z-10 ring-2 ring-ring ring-inset', false: '' },
    },
    defaultVariants: { focused: false },
  },
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

// The handle drops the native outline (it sits half-outside the header and an
// outset ring would be clipped) but is NOT left without a focus indicator: the
// inner bar takes over via `group-focus-visible`, widening and turning primary
// so keyboard resize has a clearly visible target.
export const resizeHandle = cva(
  'group absolute top-0 right-0 z-10 flex h-full w-2 translate-x-1/2 cursor-col-resize touch-none items-stretch justify-center focus-visible:outline-none',
)

export const resizeBar = cva('w-px bg-border group-focus-visible:w-0.5 group-focus-visible:bg-primary', {
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
