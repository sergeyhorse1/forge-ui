import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { cn } from '../../utils/cn'
import { DataGridFrozenBody } from './DataGridFrozenBody'
import { DataGridHeader } from './DataGridHeader'
import { DataGridScrollBody } from './DataGridScrollBody'
import { gridRoot } from './styles'
import {
  DEFAULT_ROW_HEIGHT,
  type ColumnDef,
  type RowKey,
  type SelectionOptions,
  type SortOptions,
} from './types'
import { useDataGrid } from './useDataGrid'
import { useGridNavigation } from './useGridNavigation'
import { useGridVirtualizers } from './useGridVirtualizers'

export interface DataGridProps<TRow> {
  rows: readonly TRow[]
  columns: readonly ColumnDef<TRow>[]
  getRowKey: RowKey<TRow>
  /** Total grid height in px (the viewport scrolls within it). */
  height?: number
  rowHeight?: number
  headerHeight?: number
  overscanRows?: number
  overscanColumns?: number
  sort?: SortOptions<TRow>
  selection?: SelectionOptions
  columnWidths?: Record<string, number>
  defaultColumnWidths?: Record<string, number>
  onColumnWidthsChange?: (next: Record<string, number>) => void
  className?: string
  'aria-label'?: string
}

interface ScrollOffset {
  top: number
  left: number
}

/**
 * Virtualized, headless-backed data grid with frozen columns, a sticky header,
 * multi-sort, selection and column resize.
 *
 * Layout is split into four quadrants that share virtualizer-derived geometry:
 * a static frozen corner/body and a scroll header/body. The frozen quadrants
 * are plain overlays kept in sync with the viewport's scroll offset rather than
 * `position: sticky` cells, which fail inside virtualized positioned content
 * (ADR-003). The single scroll viewport drives both row and column virtualizers.
 */
export function DataGrid<TRow>({
  rows,
  columns,
  getRowKey,
  height = 480,
  rowHeight = DEFAULT_ROW_HEIGHT,
  headerHeight = DEFAULT_ROW_HEIGHT,
  overscanRows = 8,
  overscanColumns = 2,
  sort,
  selection,
  columnWidths,
  defaultColumnWidths,
  onColumnWidthsChange,
  className,
  'aria-label': ariaLabel = 'Data grid',
}: DataGridProps<TRow>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState<ScrollOffset>({ top: 0, left: 0 })

  // An explicit body height (rather than `flex: 1` / `height: 100%`) guarantees
  // the scroll viewport has a definite px height when the virtualizer measures
  // it; a percentage that fails to resolve makes it render most of the dataset.
  const bodyHeight = Math.max(0, height - headerHeight)

  const model = useDataGrid({
    rows,
    columns,
    getRowKey,
    sort,
    selection,
    columnWidths,
    defaultColumnWidths,
    onColumnWidthsChange,
  })

  const { rowVirtualizer, columnVirtualizer } = useGridVirtualizers({
    scrollRef,
    rowCount: model.rows.length,
    rowHeight,
    overscanRows,
    scrollColumns: model.scrollColumns,
    overscanColumns,
  })

  // Re-measure the column virtualizer when widths change (resize) so the
  // horizontal offsets and total size track the new layout.
  const widthSignature = useMemo(
    () => model.scrollColumns.map((column) => column.width).join(','),
    [model.scrollColumns],
  )
  useLayoutEffect(() => {
    columnVirtualizer.measure()
  }, [widthSignature, columnVirtualizer])

  const handleScroll = useCallback(() => {
    const node = scrollRef.current
    if (!node) return
    setOffset({ top: node.scrollTop, left: node.scrollLeft })
  }, [])

  const selectable = model.selection.mode !== 'none'

  const activateRow = useCallback(
    (dataIndex: number) => {
      if (!selectable) return
      const row = model.rows[dataIndex]
      if (row === undefined) return
      model.selection.toggle(model.getRowKey(row, dataIndex))
    },
    [selectable, model],
  )

  const frozenColIndices = useMemo(
    () => model.frozenColumns.map((column) => column.colIndex),
    [model.frozenColumns],
  )
  const scrollColIndices = useMemo(
    () => model.scrollColumns.map((column) => column.colIndex),
    [model.scrollColumns],
  )

  const navigation = useGridNavigation({
    scrollRef,
    rowCount: model.rows.length,
    frozenColIndices,
    scrollColIndices,
    rowVirtualizer,
    columnVirtualizer,
    onActivateRow: activateRow,
  })

  // Keep the frozen body vertically aligned even when the scroll element resets
  // (e.g. after a sort that shortens content) without waiting for a scroll event.
  useEffect(() => {
    const node = scrollRef.current
    if (node && node.scrollTop === 0 && offset.top !== 0) {
      setOffset((prev) => ({ ...prev, top: 0 }))
    }
  }, [model.rows, offset.top])

  return (
    <div
      role="grid"
      aria-label={ariaLabel}
      aria-rowcount={model.rows.length + 1}
      aria-colcount={model.columns.length}
      aria-multiselectable={model.selection.mode === 'multi' || undefined}
      className={cn(gridRoot(), className)}
      style={{ height, display: 'flex', flexDirection: 'column' }}
      onKeyDown={navigation.onKeyDown}
    >
      <DataGridHeader
        model={model}
        columnVirtualizer={columnVirtualizer}
        headerHeight={headerHeight}
        scrollLeft={offset.left}
      />

      <div style={{ position: 'relative', height: bodyHeight }}>
        {model.frozenColumns.length > 0 ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: 1,
              width: model.frozenWidth,
              overflow: 'hidden',
              borderRight: '1px solid var(--color-border)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <DataGridFrozenBody
                model={model}
                rowVirtualizer={rowVirtualizer}
                rowHeight={rowHeight}
                scrollTop={offset.top}
                selectable={selectable}
                onRowActivate={model.selection.toggle}
              />
            </div>
          </div>
        ) : null}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          // The class is kept as a stable hook for selectors, but `overflow` is
          // also set inline because it is load-bearing: it clips the
          // virtualizer's overscan rows to the body box. The utility class can
          // fail to emit in some Tailwind build contexts, which silently leaves
          // `overflow: visible` and lets off-window rows paint past the grid's
          // bottom edge.
          className="overflow-auto"
          style={{
            height: bodyHeight,
            overflow: 'auto',
            paddingLeft: model.frozenWidth,
          }}
        >
          <DataGridScrollBody
            model={model}
            rowVirtualizer={rowVirtualizer}
            columnVirtualizer={columnVirtualizer}
            rowHeight={rowHeight}
            selectable={selectable}
            onRowActivate={model.selection.toggle}
            tabIndexFor={navigation.tabIndexFor}
            onCellFocus={navigation.onCellFocus}
          />
        </div>
      </div>
    </div>
  )
}
