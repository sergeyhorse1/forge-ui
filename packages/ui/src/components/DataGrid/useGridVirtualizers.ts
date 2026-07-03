import {
  defaultRangeExtractor,
  useVirtualizer,
  type Range,
  type Virtualizer,
} from '@tanstack/react-virtual'
import { type RefObject, useCallback, useMemo } from 'react'

import type { ResolvedColumn } from './types'

interface UseGridVirtualizersParams<TRow> {
  scrollRef: RefObject<HTMLDivElement | null>
  rowCount: number
  rowHeight: number
  overscanRows: number
  scrollColumns: ResolvedColumn<TRow>[]
  overscanColumns: number
  // Индекс строки, что остаётся смонтированной даже за окном, чтобы сфокусированная
  // с клавиатуры ячейка не размонтировалась (иначе фокус слетит и стрелки сломаются).
  // null — ничего не пинним.
  pinnedRowIndex: number | null
  // Позиция scroll-столбца (0-based внутри scrollColumns), которую держим смонтированной.
  pinnedColumnPos: number | null
}

// Range-extractor, всегда включающий pinned в смонтированный диапазон: держит
// сфокусированную ячейку живой при скролле колёсиком, который иначе её
// виртуализировал бы.
function pinnedRangeExtractor(
  pinned: number | null,
): (range: Range) => number[] {
  return (range) => {
    const base = defaultRangeExtractor(range)
    if (pinned === null || pinned < 0 || base.includes(pinned)) return base
    // После добавления пересортируем по возрастанию: виртуализатор ждёт
    // упорядоченный список индексов.
    const next = [...base, pinned].sort((a, b) => a - b)
    return next
  }
}

interface GridVirtualizers {
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  columnVirtualizer: Virtualizer<HTMLDivElement, Element>
}

// Оба виртуализатора в режиме 'position' (top/left), НЕ 'transform': transform на
// внутреннем контейнере создаёт containing block и ломает position-синхронизацию
// frozen-слоя по вертикали, поэтому контент скролла держим без transform (ADR-003).
export function useGridVirtualizers<TRow>({
  scrollRef,
  rowCount,
  rowHeight,
  overscanRows,
  scrollColumns,
  overscanColumns,
  pinnedRowIndex,
  pinnedColumnPos,
}: UseGridVirtualizersParams<TRow>): GridVirtualizers {
  const getScrollElement = useCallback(() => scrollRef.current, [scrollRef])

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan: overscanRows,
    rangeExtractor: useMemo(
      () => pinnedRangeExtractor(pinnedRowIndex),
      [pinnedRowIndex],
    ),
  })

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: scrollColumns.length,
    getScrollElement,
    estimateSize: useCallback(
      (index: number) => scrollColumns[index]?.width ?? 0,
      [scrollColumns],
    ),
    overscan: overscanColumns,
    rangeExtractor: useMemo(
      () => pinnedRangeExtractor(pinnedColumnPos),
      [pinnedColumnPos],
    ),
  })

  return { rowVirtualizer, columnVirtualizer }
}
