import { type Virtualizer } from '@tanstack/react-virtual'

import { cn } from '../../utils/cn'
import { DataGridCell } from './DataGridCell'
import { rowBase } from './styles'
import type { DataGridModel, ResolvedColumn } from './types'

interface DataGridScrollBodyProps<TRow> {
  model: DataGridModel<TRow>
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  columnVirtualizer: Virtualizer<HTMLDivElement, Element>
  rowHeight: number
  selectable: boolean
  onRowActivate: (key: string | number) => void
  /** Roving-tabindex value for the cell at `(dataRowIndex, colIndex)`. */
  tabIndexFor: (rowIndex: number, colIndex: number) => 0 | -1
  /** Sync navigation's active cell when a body cell receives focus. */
  onCellFocus: (cell: { rowIndex: number; colIndex: number }) => void
}

/**
 * The scrollable (non-frozen) body quadrant: rows virtualized vertically,
 * columns virtualized horizontally. Both axes use absolute `top`/`left` (no
 * transform) so the frozen overlay can stay aligned via plain scroll sync.
 */
export function DataGridScrollBody<TRow>({
  model,
  rowVirtualizer,
  columnVirtualizer,
  rowHeight,
  selectable,
  onRowActivate,
  tabIndexFor,
  onCellFocus,
}: DataGridScrollBodyProps<TRow>) {
  const virtualRows = rowVirtualizer.getVirtualItems()
  const virtualColumns = columnVirtualizer.getVirtualItems()
  const totalWidth = columnVirtualizer.getTotalSize()

  return (
    <div
      role="rowgroup"
      style={{
        position: 'relative',
        width: totalWidth,
        height: rowVirtualizer.getTotalSize(),
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
            role="row"
            aria-rowindex={virtualRow.index + 2}
            aria-selected={selectable ? selected : undefined}
            onClick={selectable ? () => onRowActivate(key) : undefined}
            className={cn(rowBase({ selected }))}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              left: 0,
              width: totalWidth,
              height: rowHeight,
            }}
          >
            {/*
             * The frozen columns are painted by a separate visual overlay, but
             * they must still belong to this row in the accessibility tree.
             * Render them here as off-screen gridcells so each semantic row owns
             * all of its cells in column order; the visible overlay is
             * aria-hidden.
             */}
            {model.frozenColumns.map((column) => (
              <DataGridCell
                key={column.id}
                column={column}
                row={row}
                rowIndex={virtualRow.index}
                tabIndex={tabIndexFor(virtualRow.index, column.colIndex)}
                onCellFocus={() =>
                  onCellFocus({
                    rowIndex: virtualRow.index,
                    colIndex: column.colIndex,
                  })
                }
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  overflow: 'hidden',
                  clipPath: 'inset(50%)',
                  whiteSpace: 'nowrap',
                }}
              />
            ))}
            {virtualColumns.map((virtualColumn) => {
              const column = model.scrollColumns[
                virtualColumn.index
              ] as ResolvedColumn<TRow>
              return (
                <DataGridCell
                  key={column.id}
                  column={column}
                  row={row}
                  rowIndex={virtualRow.index}
                  tabIndex={tabIndexFor(virtualRow.index, column.colIndex)}
                  onCellFocus={() =>
                    onCellFocus({
                      rowIndex: virtualRow.index,
                      colIndex: column.colIndex,
                    })
                  }
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: virtualColumn.start,
                    width: column.width,
                    height: rowHeight,
                  }}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
