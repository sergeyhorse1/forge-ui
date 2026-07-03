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
  tabIndexFor: (rowIndex: number, colIndex: number) => 0 | -1
  // Синхронизирует активную ячейку навигации при фокусе body-ячейки.
  onCellFocus: (cell: { rowIndex: number; colIndex: number }) => void
}

// Скроллируемый (не-frozen) квадрант тела: строки виртуализированы по вертикали,
// столбцы — по горизонтали. Обе оси на absolute top/left (без transform), чтобы
// frozen-оверлей держался выровненным простым scroll-sync.
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
             * Frozen-столбцы рисует отдельный визуальный оверлей, но в дереве
             * доступности они должны принадлежать этой строке. Рендерим их здесь
             * как off-screen gridcell'ы, чтобы семантическая строка владела всеми
             * ячейками по порядку; видимый оверлей — aria-hidden.
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
