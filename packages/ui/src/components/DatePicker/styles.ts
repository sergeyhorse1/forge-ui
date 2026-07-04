import { cva } from 'class-variance-authority'
import type { ClassNames } from 'react-day-picker'

export const datePickerTriggerVariants = cva(
  'inline-flex w-full items-center justify-start gap-2 rounded-md border border-input bg-transparent text-left font-normal text-foreground transition-colors motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder=true]:text-muted-foreground',
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

const navButton =
  'inline-flex size-8 items-center justify-center rounded-md text-foreground transition-colors motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40'

// Выбранный день красится через aria-selected на кнопке (bg-primary), а не через
// класс на td: ring-offset-popover рвёт невидимый ring==primary на primary-фоне (гоча 9e).
const dayButton =
  'inline-flex size-9 items-center justify-center rounded-md text-sm font-normal text-foreground transition-colors motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-popover aria-selected:bg-primary aria-selected:font-medium aria-selected:text-primary-foreground aria-selected:hover:bg-primary/90'

/**
 * Maps every DayPicker UI slot to token-driven Tailwind utilities so the calendar
 * is styled without importing `react-day-picker/style.css`.
 */
export const dayPickerClassNames: Partial<ClassNames> = {
  root: 'relative p-3',
  months: 'relative flex flex-col gap-4 sm:flex-row',
  month: 'flex flex-col gap-4',
  month_caption: 'flex h-9 items-center justify-center',
  caption_label: 'text-sm font-medium text-foreground',
  nav: 'absolute inset-x-3 top-3 flex items-center justify-between',
  button_previous: navButton,
  button_next: navButton,
  chevron: 'size-4 fill-current',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'flex h-8 w-9 items-center justify-center text-xs font-normal text-muted-foreground',
  week: 'mt-1 flex w-full',
  day: 'relative p-0 text-center',
  day_button: dayButton,
  // Тонкая рамка primary на «сегодня», пока день не выбран.
  today:
    '[&>button:not([aria-selected])]:border [&>button:not([aria-selected])]:border-primary',
  outside: '[&>button]:text-muted-foreground [&>button]:opacity-50',
  disabled: '[&>button]:pointer-events-none [&>button]:opacity-40',
  range_start: '[&>button]:rounded-r-none',
  range_end: '[&>button]:rounded-l-none',
  // Середина диапазона — на bg-accent; специфичнее, чем aria-selected:bg-primary кнопки.
  range_middle:
    '[&>button[aria-selected]]:rounded-none [&>button[aria-selected]]:bg-accent [&>button[aria-selected]]:font-normal [&>button[aria-selected]]:text-accent-foreground',
  hidden: 'invisible',
}
