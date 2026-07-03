import { type Virtualizer } from '@tanstack/react-virtual'
import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type KeyboardEvent,
  type RefObject,
  type SetStateAction,
} from 'react'

/** Active cell address. `colIndex` is the canonical 1-based column position. */
export interface ActiveCell {
  rowIndex: number
  colIndex: number
}

interface UseGridNavigationParams {
  scrollRef: RefObject<HTMLDivElement | null>
  rowCount: number
  // Канонические 1-based индексы скроллируемых (виртуализированных) столбцов.
  scrollColIndices: number[]
  // Канонические 1-based индексы frozen-столбцов.
  frozenColIndices: number[]
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  columnVirtualizer: Virtualizer<HTMLDivElement, Element>
  // Тогглит выделение строки по rowIndex (0-based).
  onActivateRow: (rowIndex: number) => void
  // Активная ячейка поднята в родителя: виртуализаторы держат её смонтированной,
  // а frozen-оверлей зеркалит её фокус-ринг.
  active: ActiveCell
  setActive: Dispatch<SetStateAction<ActiveCell>>
  // Включено ли выделение (управляет обработкой Space).
  selectable: boolean
}

interface UseGridNavigationResult {
  active: ActiveCell
  // 0 — активная ячейка (roving), -1 — остальные.
  tabIndexFor: (rowIndex: number, colIndex: number) => 0 | -1
  // Фиксирует фокус при клике/табе в ячейку, чтобы roving не рассинхронился.
  onCellFocus: (cell: ActiveCell) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

const FIRST_DATA_ROW = 0

// Сколько строк перепрыгивает один PageUp/PageDown.
const PAGE_STEP = 10

// Ретраи отложенного фокуса, чтобы фокус не завис.
const MAX_FOCUS_ATTEMPTS = 3

// Чистый переход от навигационной клавиши к следующей активной ячейке в границах
// сетки; null — если клавиша не двигает фокус.
function nextCell(
  key: string,
  active: ActiveCell,
  colIndices: number[],
  rowCount: number,
): ActiveCell | null {
  const lastRow = rowCount - 1
  const colPos = colIndices.indexOf(active.colIndex)
  const lastColPos = colIndices.length - 1
  const rowAt = (row: number) => ({
    ...active,
    rowIndex: Math.min(Math.max(row, FIRST_DATA_ROW), lastRow),
  })
  const colAt = (pos: number) => ({
    ...active,
    colIndex: colIndices[Math.min(Math.max(pos, 0), lastColPos)]!,
  })

  switch (key) {
    case 'ArrowDown':
      return rowAt(active.rowIndex + 1)
    case 'ArrowUp':
      return rowAt(active.rowIndex - 1)
    case 'PageDown':
      return rowAt(active.rowIndex + PAGE_STEP)
    case 'PageUp':
      return rowAt(active.rowIndex - PAGE_STEP)
    case 'ArrowRight':
      return colAt(colPos + 1)
    case 'ArrowLeft':
      return colAt(colPos - 1)
    case 'Home':
      return colAt(0)
    case 'End':
      return colAt(lastColPos)
    default:
      return null
  }
}

// Клавиатурная навигация с roving-tabindex по виртуализированному телу (WAI-ARIA
// grid): одна ячейка — таб-стоп, стрелки двигают активную и доскролливают
// виртуализаторы, чтобы ячейка вне окна успела смонтироваться до фокуса;
// Enter/Space тогглит выделение строки. Ходим по канонической сетке (frozen
// раньше scroll) — по семантическим ячейкам скролл-тела, не по визуальному
// aria-hidden оверлею.
export function useGridNavigation({
  scrollRef,
  rowCount,
  scrollColIndices,
  frozenColIndices,
  rowVirtualizer,
  columnVirtualizer,
  onActivateRow,
  active,
  setActive,
  selectable,
}: UseGridNavigationParams): UseGridNavigationResult {
  const colIndices = [...frozenColIndices, ...scrollColIndices]

  // Если ход требует доскроллить ячейку вне окна, фокус откладываем до её
  // монтирования. Цель держим в ref, чтобы layout-эффект подхватил её, не
  // перезапускаясь на посторонних рендерах; attempts ограничивает ретраи, чтобы
  // так и не смонтированная цель не заперла фокус на устаревшей pending-ячейке.
  const pendingFocus = useRef<{ cell: ActiveCell; attempts: number } | null>(
    null,
  )

  const focusCell = useCallback(
    (cell: ActiveCell) => {
      const node = scrollRef.current
      if (!node) return false
      const target = node.querySelector<HTMLElement>(
        `[role="gridcell"][aria-rowindex="${cell.rowIndex + 2}"][aria-colindex="${cell.colIndex}"]`,
      )
      if (!target) return false
      target.focus()
      return true
    },
    [scrollRef],
  )

  // Frozen-столбец лежит за кадром внутри скролл-строки (обрезан), поэтому всегда
  // смонтирован с ней; горизонтальный скролл нужен только scroll-столбцам.
  const ensureColumnVisible = useCallback(
    (colIndex: number) => {
      const scrollPos = scrollColIndices.indexOf(colIndex)
      if (scrollPos >= 0) columnVirtualizer.scrollToIndex(scrollPos)
    },
    [scrollColIndices, columnVirtualizer],
  )

  const moveTo = useCallback(
    (cell: ActiveCell) => {
      setActive(cell)
      rowVirtualizer.scrollToIndex(cell.rowIndex)
      ensureColumnVisible(cell.colIndex)
      // Пробуем сфокусировать сразу; если цель ещё не смонтирована (была вне
      // окна), layout-эффект повторит, когда скролл её отрендерит.
      if (!focusCell(cell)) pendingFocus.current = { cell, attempts: 0 }
    },
    [rowVirtualizer, ensureColumnVisible, focusCell, setActive],
  )

  useEffect(() => {
    const pending = pendingFocus.current
    if (!pending) return
    if (focusCell(pending.cell)) {
      pendingFocus.current = null
      return
    }
    // Сдаёмся через несколько рендеров, чтобы так и не смонтированная цель не
    // заперла pending (активная ячейка приколота смонтированной — это подстраховка).
    pending.attempts += 1
    if (pending.attempts >= MAX_FOCUS_ATTEMPTS) pendingFocus.current = null
  })

  const onCellFocus = useCallback(
    (cell: ActiveCell) => {
      setActive(cell)
    },
    [setActive],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement
      const role = target.getAttribute('role')

      // У header-ячеек и resize-сепаратора свои обработчики клавиш — не перехватываем.
      if (role === 'columnheader' || role === 'separator') return

      // Обычный путь: фокус на body-ячейке. Восстановление: фокус упал на корень
      // сетки (target === currentTarget), потому что активную ячейку виртуализация
      // сняла при скролле колёсиком. В обоих случаях правим активную ячейку;
      // восстановление ещё и ремонтирует и рефокусит её.
      const fromCell = role === 'gridcell'
      const fromRoot = target === event.currentTarget
      if (!fromCell && !fromRoot) return

      if (event.key === 'Enter' || event.key === ' ') {
        // Без выделения Space ничего не делает — пусть скроллит вьюпорт, а не
        // проглатывается.
        if (!selectable && event.key === ' ') return
        event.preventDefault()
        if (fromRoot) focusCell(active)
        onActivateRow(active.rowIndex)
        return
      }

      const next = nextCell(event.key, active, colIndices, rowCount)
      if (!next) return
      event.preventDefault()
      moveTo(next)
    },
    [
      active,
      colIndices,
      rowCount,
      moveTo,
      onActivateRow,
      selectable,
      focusCell,
    ],
  )

  const tabIndexFor = useCallback(
    (rowIndex: number, colIndex: number): 0 | -1 =>
      rowIndex === active.rowIndex && colIndex === active.colIndex ? 0 : -1,
    [active],
  )

  return { active, tabIndexFor, onCellFocus, onKeyDown }
}
