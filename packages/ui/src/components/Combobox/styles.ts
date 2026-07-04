import { cva } from 'class-variance-authority'

export const comboboxInputVariants = cva(
  'w-full rounded-md border border-input bg-transparent text-foreground transition-colors motion-reduce:transition-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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
  'z-50 max-h-72 min-w-[var(--radix-popover-trigger-width)] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none',
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
  // Подсветка активной опции — на bg-accent, НЕ bg-primary: ring-токен равен primary
  // в обеих темах, индикатор на primary-фоне был бы невидим (гоча 9e).
  'flex cursor-default select-none items-center justify-between rounded-sm outline-none transition-colors motion-reduce:transition-none data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
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

export const comboboxGroupLabelVariants = cva(
  'px-3 py-1.5 text-xs font-medium text-muted-foreground',
)

export const comboboxStatusVariants = cva(
  'px-3 py-2 text-sm text-muted-foreground',
)
