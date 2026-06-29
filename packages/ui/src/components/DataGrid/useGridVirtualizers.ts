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
  /**
   * Row index that must stay mounted even when scrolled out of the window, so
   * the keyboard-focused cell never unmounts (which would drop focus and break
   * arrow navigation). `null` pins nothing.
   */
  pinnedRowIndex: number | null
  /** Scroll-column position (0-based within `scrollColumns`) to keep mounted. */
  pinnedColumnPos: number | null
}

/**
 * Build a range extractor that always includes `pinned` in the mounted range.
 * Keeping the focused cell mounted preserves focus through mouse-wheel scrolling
 * that would otherwise virtualize it away.
 */
function pinnedRangeExtractor(
  pinned: number | null,
): (range: Range) => number[] {
  return (range) => {
    const base = defaultRangeExtractor(range)
    if (pinned === null || pinned < 0 || base.includes(pinned)) return base
    // Re-sort ascending after appending: the virtualizer relies on the index
    // list being ordered.
    const next = [...base, pinned].sort((a, b) => a - b)
    return next
  }
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
