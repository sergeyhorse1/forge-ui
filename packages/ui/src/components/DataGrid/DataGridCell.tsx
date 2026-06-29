import { type CSSProperties, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import { ALIGN_CLASS, bodyCell } from './styles'
import type { ResolvedColumn } from './types'

interface DataGridCellProps<TRow> {
  column: ResolvedColumn<TRow>
  row: TRow
  rowIndex: number
  style: CSSProperties
  /**
   * When `true` the cell is a purely visual duplicate (e.g. the frozen-column
   * overlay) and carries no `gridcell` role, so the accessibility tree sees the
   * canonical cell rendered inside the scroll body instead.
   */
  presentational?: boolean
  /**
   * Roving-tabindex value (`0` for the single active cell, `-1` otherwise).
   * Omitted/`undefined` for presentational cells, which are not focusable.
   */
  tabIndex?: 0 | -1
  /** Called when this cell gains focus, so navigation can track the active cell. */
  onCellFocus?: () => void
}

/** Resolve the rendered content of a single cell from its column definition. */
function renderCellContent<TRow>(
  column: ResolvedColumn<TRow>,
  row: TRow,
  rowIndex: number,
): ReactNode {
  const { def } = column
  if (def.cell) return def.cell(row, rowIndex)
  const value = def.accessor
    ? def.accessor(row)
    : (row as Record<string, unknown>)[column.id]
  return value == null ? '' : String(value)
}

export function DataGridCell<TRow>({
  column,
  row,
  rowIndex,
  style,
  presentational = false,
  tabIndex,
  onCellFocus,
}: DataGridCellProps<TRow>) {
  return (
    <div
      role={presentational ? 'presentation' : 'gridcell'}
      // Header occupies row 1, so the first data row is aria-rowindex 2. Mirroring
      // the row's index onto the cell (spec-valid) lets navigation target a cell
      // by its (row, column) address even across virtualized windows.
      aria-rowindex={presentational ? undefined : rowIndex + 2}
      aria-colindex={presentational ? undefined : column.colIndex}
      tabIndex={presentational ? undefined : tabIndex}
      onFocus={presentational ? undefined : onCellFocus}
      className={cn(bodyCell(), ALIGN_CLASS[column.align])}
      style={style}
    >
      {renderCellContent(column, row, rowIndex)}
    </div>
  )
}
