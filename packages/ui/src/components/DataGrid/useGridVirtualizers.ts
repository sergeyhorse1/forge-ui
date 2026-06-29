import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual'
import { type RefObject, useCallback } from 'react'

import type { ResolvedColumn } from './types'

interface UseGridVirtualizersParams<TRow> {
  scrollRef: RefObject<HTMLDivElement | null>
  rowCount: number
  rowHeight: number
  overscanRows: number
  scrollColumns: ResolvedColumn<TRow>[]
  overscanColumns: number
}

interface GridVirtualizers {
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  columnVirtualizer: Virtualizer<HTMLDivElement, Element>
}

/**
 * Wire up both axes of {@link useVirtualizer} against a single scroll element.
 *
 * Both run in `'position'` mode (top/left), NOT `'transform'`. A transform on
 * the inner container establishes a containing block that breaks the frozen
 * layer's `position`-based vertical sync, so we keep the scroll content
 * transform-free (see ADR-003).
 */
export function useGridVirtualizers<TRow>({
  scrollRef,
  rowCount,
  rowHeight,
  overscanRows,
  scrollColumns,
  overscanColumns,
}: UseGridVirtualizersParams<TRow>): GridVirtualizers {
  const getScrollElement = useCallback(() => scrollRef.current, [scrollRef])

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement,
    estimateSize: useCallback(() => rowHeight, [rowHeight]),
    overscan: overscanRows,
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
  })

  return { rowVirtualizer, columnVirtualizer }
}
