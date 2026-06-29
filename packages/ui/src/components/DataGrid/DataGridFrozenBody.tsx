import { type Virtualizer } from '@tanstack/react-virtual'

import { cn } from '../../utils/cn'
import { DataGridCell } from './DataGridCell'
import { rowBase } from './styles'
import type { DataGridModel } from './types'

interface DataGridFrozenBodyProps<TRow> {
  model: DataGridModel<TRow>
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  rowHeight: number
  /** Current vertical scroll offset of the main viewport, in px. */
  scrollTop: number
  selectable: boolean
  onRowActivate: (key: string | number) => void
  /**
   * Canonical address of the cell currently focused via the keyboard, or `null`.
   * The matching overlay cell mirrors a focus ring because the real frozen
   * gridcell that holds focus is clipped off-screen and cannot show its own.
   */
  focusedCell: { rowIndex: number; colIndex: number } | null
}

/**
 * Frozen (left-pinned) body quadrant. Rendered as a separate, horizontally
 * static overlay rather than a `position: sticky` column, because sticky breaks
 * once virtualized cells live in a positioned/transformed container. It shares
 * the row virtualizer with the scroll body and is offset vertically by
 * `-scrollTop` to mirror the main viewport (ADR-003).
 */
export function DataGridFrozenBody<TRow>({
  model,
  rowVirtualizer,
  rowHeight,
  scrollTop,
  selectable,
  onRowActivate,
  focusedCell,
}: DataGridFrozenBodyProps<TRow>) {
  if (model.frozenColumns.length === 0) return null
  const virtualRows = rowVirtualizer.getVirtualItems()

  // Precompute each frozen column's x-offset (sum of preceding widths) so cells
  // are positioned absolutely left-to-right, just like the scroll body. Flex
  // flow is intentionally avoided: a shrinking flex item would collapse onto its
  // neighbour and stack columns at the same x.
  const columnOffsets: number[] = []
  let runningLeft = 0
  for (const column of model.frozenColumns) {
    columnOffsets.push(runningLeft)
    runningLeft += column.width
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: model.frozenWidth,
        height: rowVirtualizer.getTotalSize(),
        transform: `translateY(${-scrollTop}px)`,
      }}
    >
      {virtualRows.map((virtualRow) => {
        const row = model.rows[virtualRow.index]
        if (row === undefined) return null
        const key = model.getRowKey(row, virtualRow.index)
        const selected = model.selection.isSelected(key)

        return (
          <div
            key={key}
            onClick={selectable ? () => onRowActivate(key) : undefined}
            className={cn(rowBase({ selected }))}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              left: 0,
              width: model.frozenWidth,
              height: rowHeight,
            }}
          >
            {model.frozenColumns.map((column, columnIndex) => (
              <DataGridCell
                key={column.id}
                column={column}
                row={row}
                rowIndex={virtualRow.index}
                presentational
                focused={
                  focusedCell !== null &&
                  focusedCell.rowIndex === virtualRow.index &&
                  focusedCell.colIndex === column.colIndex
                }
                style={{
                  position: 'absolute',
                  top: 0,
                  left: columnOffsets[columnIndex],
                  width: column.width,
                  height: rowHeight,
                }}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
