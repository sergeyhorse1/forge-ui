import { type CSSProperties, type ReactNode } from 'react'

import { cn } from '../../utils/cn'
import { ALIGN_CLASS, bodyCell } from './styles'
import type { ResolvedColumn } from './types'

interface DataGridCellProps<TRow> {
  column: ResolvedColumn<TRow>
  row: TRow
  rowIndex: number
  style: CSSProperties
  // Чисто визуальный дубль (напр. оверлей frozen-столбцов): без роли gridcell,
  // чтобы дерево доступности видело каноническую ячейку внутри скролл-тела.
  presentational?: boolean
  // Roving-tabindex (0 — единственная активная ячейка, иначе -1); undefined для
  // presentational-ячеек, они не фокусируются.
  tabIndex?: 0 | -1
  onCellFocus?: () => void
  // Рисует ячейку с фокус-рингом, хотя сама она не в фокусе: оверлей frozen так
  // зеркалит ring своей обрезанной настоящей gridcell.
  focused?: boolean
}

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
  // truncate + min-w-0: дефолтный текст обрезается многоточием (как в шапке), а не
  // жёстко режется на середине символа; min-w-0 даёт спану ужаться внутри flex-ячейки.
  return <span className="min-w-0 truncate">{value == null ? '' : String(value)}</span>
}

export function DataGridCell<TRow>({
  column,
  row,
  rowIndex,
  style,
  presentational = false,
  tabIndex,
  onCellFocus,
  focused = false,
}: DataGridCellProps<TRow>) {
  return (
    <div
      role={presentational ? 'presentation' : 'gridcell'}
      // Шапка занимает строку 1, поэтому первая строка данных — aria-rowindex 2.
      // Дублируя индекс строки на ячейку (валидно по спеке), даём навигации
      // адресовать ячейку по (row, column) даже сквозь окна виртуализации.
      aria-rowindex={presentational ? undefined : rowIndex + 2}
      aria-colindex={presentational ? undefined : column.colIndex}
      tabIndex={presentational ? undefined : tabIndex}
      onFocus={presentational ? undefined : onCellFocus}
      className={cn(bodyCell({ focused }), ALIGN_CLASS[column.align])}
      style={style}
    >
      {renderCellContent(column, row, rowIndex)}
    </div>
  )
}
