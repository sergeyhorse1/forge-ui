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

// В rdp@10 модификаторы выбора помечают ЯЧЕЙКУ (td: data-selected/aria-selected),
// а НЕ кнопку. Поэтому заливку задаём в слотах selected/range_* (они на td), протягивая
// её на дочернюю кнопку через `[&>button]`. Focus-ring на выбранном дне: ring==primary
// на bg-primary был бы невидим (гоча 9e), но ring-offset-popover даёт зазор цвета
// поверхности между кнопкой и кольцом → кольцо различимо в обеих темах.
const dayButton =
  'inline-flex size-9 items-center justify-center rounded-md text-sm font-normal text-foreground transition-colors motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover'

/**
 * Maps every DayPicker UI slot to token-driven Tailwind utilities so the calendar
 * is styled without importing `react-day-picker/style.css`. Selection slots live on
 * the day cell (`<td>`); each paints its inner `day_button`.
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
  // Выбранный день (и концы диапазона) — заливка primary на кнопке через слот на td.
  selected:
    '[&>button]:bg-primary [&>button]:font-medium [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90',
  // Рамка «сегодня» только пока день НЕ выбран (td без data-selected).
  today:
    '[&:not([data-selected=true])>button]:border [&:not([data-selected=true])>button]:border-primary',
  outside: '[&>button]:text-muted-foreground [&>button]:opacity-50',
  disabled: '[&>button]:pointer-events-none [&>button]:opacity-40',
  range_start: '[&>button]:rounded-r-none',
  range_end: '[&>button]:rounded-l-none',
  // Середина диапазона — bg-accent. Селектор с [data-selected=true] специфичнее слота
  // selected (тоже на этой ячейке) → детерминированно перебивает primary без !important.
  range_middle:
    '[&[data-selected=true]>button]:bg-accent [&[data-selected=true]>button]:font-normal [&[data-selected=true]>button]:text-accent-foreground [&>button]:rounded-none',
  hidden: 'invisible',
}
