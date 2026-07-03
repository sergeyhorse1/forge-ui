import { cva } from 'class-variance-authority'

import type { ColumnAlign } from './types'

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
  // Инсетный фокус-ринг by design: ячейки абсолютны и стоят край-в-край, поэтому
  // outset-ринг обрезался бы overflow строки или соседями. z-10 поднимает
  // сфокусированную ячейку над соседями, чтобы ринг не перекрывался; цвет ринга
  // читается в light и dark через общий токен --color-ring.
  'relative flex h-full items-center overflow-hidden px-3 whitespace-nowrap focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
  {
    variants: {
      // Настоящая frozen-ячейка обрезана до 1x1, чтобы не рисовать дубль за
      // визуальным оверлеем, поэтому свой ринг не виден — ячейка оверлея зеркалит
      // его по запросу.
      focused: { true: 'z-10 ring-2 ring-ring ring-inset', false: '' },
    },
    defaultVariants: { focused: false },
  },
)

export const rowBase = cva('flex border-b border-border/60', {
  variants: {
    selected: {
      // Акцентный рельс — инсетный box-shadow, а не левый border: не меняет размер
      // бокса строки и офсеты абсолютных ячеек внутри неё.
      true: 'bg-primary/15 font-medium text-foreground shadow-[inset_2px_0_0_0_var(--color-primary)]',
      false: 'hover:bg-muted/40',
    },
  },
  defaultVariants: { selected: false },
})

// Ручка снимает нативный outline (она наполовину снаружи шапки, outset-ринг
// обрезался бы), но без индикатора фокуса не остаётся: внутренний бар через
// group-focus-visible расширяется и становится primary — видимая цель для клавиатуры.
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
