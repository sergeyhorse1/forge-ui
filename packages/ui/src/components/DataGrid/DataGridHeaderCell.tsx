import { type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'

import { cn } from '../../utils/cn'
import {
  ALIGN_CLASS,
  headerCell,
  resizeBar,
  resizeHandle,
  sortIndicator,
} from './styles'
import {
  MAX_COLUMN_WIDTH,
  RESIZE_KEYBOARD_STEP,
  type ColumnSortInfo,
  type ResolvedColumn,
} from './types'

interface DataGridHeaderCellProps<TRow> {
  column: ResolvedColumn<TRow>
  style: CSSProperties
  sortInfo: ColumnSortInfo
  resizeActive: boolean
  onToggleSort: (columnId: string, additive: boolean) => void
  onResizeStart: (columnId: string, startClientX: number) => void
  onResizeNudge: (columnId: string, deltaPx: number) => void
}

const DIRECTION_GLYPH = { asc: '↑', desc: '↓' } as const

export function DataGridHeaderCell<TRow>({
  column,
  style,
  sortInfo,
  resizeActive,
  onToggleSort,
  onResizeStart,
  onResizeNudge,
}: DataGridHeaderCellProps<TRow>) {
  const { def, id, align, sortable, resizable } = column
  const headerContent =
    typeof def.header === 'function' ? def.header(def) : def.header

  const handleSortKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!sortable) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggleSort(id, event.shiftKey)
    }
  }

  const handleHandlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    onResizeStart(id, event.clientX)
  }

  const handleHandleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onResizeNudge(id, -RESIZE_KEYBOARD_STEP)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      onResizeNudge(id, RESIZE_KEYBOARD_STEP)
    }
  }

  return (
    <div
      role="columnheader"
      aria-colindex={column.colIndex}
      aria-sort={
        sortInfo.direction === 'asc'
          ? 'ascending'
          : sortInfo.direction === 'desc'
            ? 'descending'
            : sortable
              ? 'none'
              : undefined
      }
      tabIndex={sortable ? 0 : -1}
      onClick={sortable ? (e) => onToggleSort(id, e.shiftKey) : undefined}
      onKeyDown={handleSortKeyDown}
      className={cn(headerCell({ sortable }), ALIGN_CLASS[align])}
      style={style}
    >
      <span className="truncate">{headerContent}</span>
      <span
        aria-hidden
        className={sortIndicator({ active: sortInfo.direction !== null })}
      >
        {sortInfo.direction ? DIRECTION_GLYPH[sortInfo.direction] : '↕'}
        {sortInfo.priority !== null ? sortInfo.priority : ''}
      </span>
      {resizable ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize column ${id}`}
          // A focusable separator behaves as a slider: expose the current width
          // within a finite [min, max] range so assistive tech can announce and
          // step it.
          aria-valuenow={column.width}
          aria-valuemin={column.minWidth}
          aria-valuemax={MAX_COLUMN_WIDTH}
          tabIndex={0}
          className={cn(resizeHandle())}
          onPointerDown={handleHandlePointerDown}
          onKeyDown={handleHandleKeyDown}
          onClick={(e) => e.stopPropagation()}
        >
          <span className={resizeBar({ active: resizeActive })} />
        </div>
      ) : null}
    </div>
  )
}
