import { cva } from 'class-variance-authority'

// Презентационные токены FilterBuilder, оформлены cva-блоками, чтобы вью не склеивал
// строки классов вручную. Цвета — из общих семантических токенов (--color-*),
// light/dark закрыты data-theme в globals.css, dark:-варианты тут не нужны.

export const builderRoot = cva('text-sm text-foreground')

// Панель группы. Глубину читаем через реальный цвет границы и конкретный левый
// отступ (не бледную alpha), чтобы вложенность проверялась computed-paint'ом в обеих
// темах. Корень — bg-card, вложенные чуть утоплены плюс отступ от родителя.
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

// Конкретный отступ для детей группы, чтобы глубина ≥2 читалась геометрически.
export const groupChildren = cva('flex flex-col gap-2 border-l border-border pl-4')

export const combinatorToggle = cva(
  'inline-flex overflow-hidden rounded-md border border-border',
)

// Сегмент AND/OR-переключателя. Состояние сигналится и заливкой, и весом шрифта —
// не только цветом (WCAG 1.4.1). Базовый ring-ring читается на неактивном (bg-muted)
// сегменте; активный залит bg-primary, а --color-ring == --color-primary, так что там
// тот же ринг был бы невидим (контраст 1:1) — вариант active override'ит его на
// ring-primary-foreground (цвет активной метки, гарантированно контрастен к bg-primary).
// tailwind-merge схлопывает два ring-цвета, на активном побеждает вариант. ring-inset
// оставлен: инсетный ринг внутри бокса кнопки, overflow-hidden переключателя его не режет.
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

// Деструктивная кнопка удаления (правило или не-корневая группа). Доступное имя —
// через aria-label на месте вызова; hover поднимает её на destructive-поверхность.
export const removeButton = cva(
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

export const ruleRow = cva(
  'flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2',
)

export const ruleControl = cva(
  'h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

// Обёртка двух контролов range-оператора (between). Flex (намеренно не two-column
// grid, запрещённый dist-гардом), чтобы пара делила ширину строки и переносилась в узком.
export const ruleRangeGroup = cva('flex min-w-0 flex-1 items-center gap-2')

export const ruleRangeSeparator = cva('shrink-0 text-xs text-muted-foreground')

export const ruleMultiControl = cva(
  'min-h-16 min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

// Read-only компактное summary. Чипы переносятся, длинные значения ломаются, чтобы
// узкий контейнер (≈360px) не переполнялся по горизонтали — тот самый провал
// редактируемых контролов на этой ширине, который compact и заменяет.
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

// Read-only чип правила. min-w-0 даёт чипу ужаться ниже интринсивной ширины контента
// в flex-строке (иначе длинный неразрывный токен вызвал бы горизонтальное
// переполнение); break-words переносит обычный длинный текст, а не режет/скроллит.
export const summaryChip = cva(
  'inline-flex min-w-0 max-w-full items-baseline gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs break-words text-foreground',
)

export const summaryChipField = cva('font-medium text-foreground')

export const summaryChipOperator = cva('text-muted-foreground')

// Часть-значение чипа. min-w-0 + wrap-anywhere (overflow-wrap:anywhere) ломают
// неразрывный ран — URL, hash, id без пробелов — внутри чипа, а не выталкивают summary
// в горизонтальный скролл. В отличие от break-words, anywhere ещё и уменьшает
// min-content ширину элемента — это и позволяет flex-чипу ужаться.
export const summaryChipValue = cva('min-w-0 wrap-anywhere font-medium text-foreground')
