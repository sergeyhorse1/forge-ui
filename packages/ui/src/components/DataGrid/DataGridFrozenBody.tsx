import { type Virtualizer } from '@tanstack/react-virtual'

import { cn } from '../../utils/cn'
import { DataGridCell } from './DataGridCell'
import { rowBase } from './styles'
import type { DataGridModel } from './types'

interface DataGridFrozenBodyProps<TRow> {
  model: DataGridModel<TRow>
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  rowHeight: number
  // Текущий вертикальный офсет скролла главного вьюпорта, px.
  scrollTop: number
  selectable: boolean
  onRowActivate: (key: string | number) => void
  // Канонический адрес ячейки с клавиатурным фокусом или null. Ячейка оверлея
  // зеркалит фокус-ринг, т.к. настоящая frozen-ячейка с фокусом обрезана за
  // кадром и своего показать не может.
  focusedCell: { rowIndex: number; colIndex: number } | null
}

// Frozen (левый пин) квадрант тела. Отдельный горизонтально-статичный оверлей, а
// не position:sticky столбец: sticky ломается, когда виртуализированные ячейки
// живут в positioned/transformed контейнере. Делит row-виртуализатор со скролл-
// телом и сдвинут по вертикали на -scrollTop, зеркаля главный вьюпорт (ADR-003).
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

  // Заранее считаем x-офсет каждого frozen-столбца (сумма предыдущих ширин), чтобы
  // ставить ячейки абсолютно слева направо, как в скролл-теле. Flex намеренно не
  // берём: сжимающийся flex-элемент схлопнулся бы на соседа и столбцы легли бы на один x.
  const columnOffsets: number[] = []
  let runningLeft = 0
  for (const column of model.frozenColumns) {
    columnOffsets.push(runningLeft)
    runningLeft += column.width
  }

  return (
    <div
      aria-hidden
      // Непрозрачный фон здесь load-bearing, а не косметика: оверлей висит над
      // горизонтально скроллящимся телом, а его строки по умолчанию прозрачны. Без
      // сплошной заливки ячейки скролл-тела (напр. Email) просвечивают сквозь
      // frozen-столбцы при скролле вправо. Тинт выделения и зеркальный ring — сверху.
      className={cn('bg-background')}
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
