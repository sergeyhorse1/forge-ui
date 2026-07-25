import { cva } from 'class-variance-authority'

export const comboboxInputVariants = cva(
  // ring-offset-background гасит белый зазор offset-кольца в тёмной теме.
  'w-full rounded-md border border-input bg-transparent text-foreground transition-colors motion-reduce:transition-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export const comboboxContentVariants = cva(
  // Скролл держим на listbox, не тут: role="dialog" со скроллом axe считает недоступным с клавиатуры
  'z-50 w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-content-available-width)] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none',
  {
    variants: {
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export const comboboxOptionVariants = cva(
  // Активная опция залита accent, а не primary: ring == primary, на своей же заливке кольцо пропадёт
  'flex cursor-default select-none items-center justify-between rounded-sm outline-none transition-colors motion-reduce:transition-none data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:ring-2 data-[active=true]:ring-inset data-[active=true]:ring-ring data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

// Скролл на role="listbox": виджет-роль снимает axe-правило scrollable-region-focusable
export const comboboxListVariants = cva('max-h-72 overflow-y-auto overflow-x-hidden')

export const comboboxGroupLabelVariants = cva(
  'px-3 py-1.5 text-xs font-medium text-muted-foreground',
)

export const comboboxStatusVariants = cva(
  'px-3 py-2 text-sm text-muted-foreground',
)
