import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useFocusVisible } from '../../hooks'
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
import { useGridNavigation, type ActiveCell } from './useGridNavigation'
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
  const [hasFocus, setHasFocus] = useState(false)
  const keyboardModality = useFocusVisible()

  // Явная px-высота тела (а не flex:1 / height:100%): виртуализатор при замере
  // должен видеть определённую высоту, иначе неразрешившийся процент заставит его
  // отрендерить почти весь датасет.
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

  const frozenColIndices = useMemo(
    () => model.frozenColumns.map((column) => column.colIndex),
    [model.frozenColumns],
  )
  const scrollColIndices = useMemo(
    () => model.scrollColumns.map((column) => column.colIndex),
    [model.scrollColumns],
  )

  // Активную (сфокусированную) ячейку держим здесь, чтобы виртуализаторы пинили
  // её смонтированной, а frozen-оверлей зеркалил её ring. Ленивый инициализатор
  // отрабатывает лишь на маунте и не переучитывается при смене столбцов — это ок:
  // навигация зажимает активную ячейку в живые границы на каждом ходе, так что
  // устаревший дефолт чинится первым взаимодействием, а не эффектом-сбросом.
  const [active, setActive] = useState<ActiveCell>(() => ({
    rowIndex: 0,
    colIndex: frozenColIndices[0] ?? scrollColIndices[0] ?? 1,
  }))

  // Пиним активную строку/столбец, чтобы скролл колёсиком не выкинул
  // сфокусированную ячейку из DOM (слетел бы фокус и стрелки).
  const pinnedColumnPos = scrollColIndices.indexOf(active.colIndex)

  const { rowVirtualizer, columnVirtualizer } = useGridVirtualizers({
    scrollRef,
    rowCount: model.rows.length,
    rowHeight,
    overscanRows,
    scrollColumns: model.scrollColumns,
    overscanColumns,
    pinnedRowIndex: active.rowIndex,
    pinnedColumnPos: pinnedColumnPos >= 0 ? pinnedColumnPos : null,
  })

  // Перезамеряем колоночный виртуализатор при смене ширин (resize), чтобы
  // горизонтальные офсеты и общий размер шли за новой раскладкой.
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

  const navigation = useGridNavigation({
    scrollRef,
    rowCount: model.rows.length,
    frozenColIndices,
    scrollColIndices,
    rowVirtualizer,
    columnVirtualizer,
    onActivateRow: activateRow,
    active,
    setActive,
    selectable,
  })

  // Держим frozen-тело выровненным по вертикали, даже когда скролл сбрасывается
  // (напр. после сортировки, укоротившей контент), не дожидаясь scroll-события.
  useEffect(() => {
    const node = scrollRef.current
    if (node && node.scrollTop === 0 && offset.top !== 0) {
      setOffset((prev) => ({ ...prev, top: 0 }))
    }
  }, [model.rows, offset.top])

  // Настоящая frozen-ячейка с фокусом обрезана за кадром, её ring не виден. Когда
  // активна frozen-ячейка и сетка реально держит клавиатурный фокус — рисуем
  // зеркальный ring на соответствующей видимой ячейке оверлея.
  const focusedFrozenCell = useMemo(() => {
    if (!hasFocus || !keyboardModality) return null
    if (!frozenColIndices.includes(active.colIndex)) return null
    return active
  }, [hasFocus, keyboardModality, frozenColIndices, active])

  return (
    <div
      role="grid"
      aria-label={ariaLabel}
      aria-rowcount={model.rows.length + 1}
      aria-colcount={model.columns.length}
      aria-multiselectable={model.selection.mode === 'multi' || undefined}
      // -1: единственный таб-стоп — roving-ячейка, но корень может принять фокус
      // как recovery-цель, если активная ячейка потеряется.
      tabIndex={-1}
      className={cn(gridRoot(), className)}
      style={{ height, display: 'flex', flexDirection: 'column' }}
      onKeyDown={navigation.onKeyDown}
      onFocus={() => setHasFocus(true)}
      // focusout всплывает; relatedTarget всё ещё внутри сетки — значит фокус
      // лишь перешёл между ячейками, состояние focused сохраняем.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHasFocus(false)
        }
      }}
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
                focusedCell={focusedFrozenCell}
              />
            </div>
          </div>
        ) : null}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          // Класс — стабильный хук для селекторов, но overflow ещё и инлайном, т.к.
          // он load-bearing: обрезает overscan-строки виртуализатора по боксу тела.
          // Утилити-класс в некоторых Tailwind-сборках может не выпуститься, и тогда
          // overflow:visible молча даст строкам вне окна вылезти за нижний край.
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
