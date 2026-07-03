import { useEffect, useMemo } from 'react'

import {
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  type ColumnDef,
  type DataGridModel,
  type ResolvedColumn,
  type UseDataGridOptions,
} from './types'
import { useColumnResize } from './useColumnResize'
import { useSelection } from './useSelection'
import { useSort } from './useSort'

// Читаем NODE_ENV с globalThis, чтобы не зависеть от типа/наличия process;
// бандлеры со статической подстановкой всё равно вытрясут dev-ветку из прода.
function isProduction(): boolean {
  const env = (
    globalThis as { process?: { env?: { NODE_ENV?: string } } }
  ).process?.env
  return env?.NODE_ENV === 'production'
}

// Дев-предупреждение о дублях id: layout берёт first-wins, а сортировка — первый
// объявленный столбец, так что коллизия молча разводит поведение. В проде вырезается.
function useDuplicateColumnIdWarning<TRow>(
  columns: readonly ColumnDef<TRow>[],
): void {
  useEffect(() => {
    if (isProduction()) return
    const seen = new Set<string>()
    const duplicates = new Set<string>()
    for (const column of columns) {
      const id = String(column.id)
      if (seen.has(id)) duplicates.add(id)
      seen.add(id)
    }
    if (duplicates.size > 0) {
      console.warn(
        `[DataGrid] Duplicate column id(s): ${[...duplicates].join(', ')}. ` +
          'Column ids must be unique; layout and sorting may disagree otherwise.',
      )
    }
  }, [columns])
}

/**
 * Headless DataGrid controller: composes the sort, selection and resize engines
 * and resolves column layout (frozen split + widths) into a normalised
 * {@link DataGridModel} for a thin, swappable presentation layer. No DOM here.
 */
export function useDataGrid<TRow>(
  options: UseDataGridOptions<TRow>,
): DataGridModel<TRow> {
  const { rows, columns, getRowKey } = options

  useDuplicateColumnIdWarning(columns)

  const resize = useColumnResize(
    useMemo(
      () => ({
        minWidthOf: (columnId: string) =>
          columns.find((column) => String(column.id) === columnId)?.minWidth ??
          MIN_COLUMN_WIDTH,
        baseWidthOf: (columnId: string) =>
          columns.find((column) => String(column.id) === columnId)?.width ??
          DEFAULT_COLUMN_WIDTH,
      }),
      [columns],
    ),
    options.columnWidths,
    options.defaultColumnWidths,
    options.onColumnWidthsChange,
  )

  const sort = useSort(rows, columns, options.sort)
  const selection = useSelection(sort.sortedRows, getRowKey, options.selection)

  // Зависим от стабильного widthOf (ключ — карта ширин), а не от resize: тот —
  // новая ссылка каждый рендер и убил бы memo.
  const { widthOf } = resize
  const { frozenColumns, scrollColumns, resolvedColumns, frozenWidth } =
    useMemo(() => {
      const resolved = columns.map((def) => ({
        def,
        id: String(def.id),
        width: widthOf(String(def.id)),
        minWidth: def.minWidth ?? MIN_COLUMN_WIDTH,
        align: def.align ?? 'left',
        frozen: def.frozen ?? false,
        sortable: def.sortable ?? true,
        resizable: def.resizable ?? true,
      }))

      const frozen = resolved.filter((column) => column.frozen)
      const scroll = resolved.filter((column) => !column.frozen)

      // Frozen всегда первыми, независимо от порядка объявления; каждому — свой
      // канонический 1-based aria-colindex в этом общем порядке, чтобы окно
      // горизонтальной виртуализации его не перекосило.
      const ordered: ResolvedColumn<TRow>[] = [...frozen, ...scroll].map(
        (column, index) => ({ ...column, colIndex: index + 1 }),
      )
      const width = frozen.reduce((total, column) => total + column.width, 0)

      return {
        frozenColumns: ordered.filter((column) => column.frozen),
        scrollColumns: ordered.filter((column) => !column.frozen),
        resolvedColumns: ordered,
        frozenWidth: width,
      }
    }, [columns, widthOf])

  return useMemo<DataGridModel<TRow>>(
    () => ({
      rows: sort.sortedRows,
      frozenColumns,
      scrollColumns,
      columns: resolvedColumns,
      frozenWidth,
      sort: {
        state: sort.state,
        toggle: sort.toggle,
        infoFor: sort.infoFor,
      },
      selection: {
        mode: selection.mode,
        selectedKeys: selection.selectedKeys,
        isSelected: selection.isSelected,
        toggle: selection.toggle,
        toggleAll: selection.toggleAll,
        allSelected: selection.allSelected,
        someSelected: selection.someSelected,
        clear: selection.clear,
      },
      resize: {
        start: resize.start,
        nudge: resize.nudge,
        activeColumnId: resize.activeColumnId,
      },
      getRowKey,
    }),
    [
      sort.sortedRows,
      sort.state,
      sort.toggle,
      sort.infoFor,
      frozenColumns,
      scrollColumns,
      resolvedColumns,
      frozenWidth,
      selection.mode,
      selection.selectedKeys,
      selection.isSelected,
      selection.toggle,
      selection.toggleAll,
      selection.allSelected,
      selection.someSelected,
      selection.clear,
      resize.start,
      resize.nudge,
      resize.activeColumnId,
      getRowKey,
    ],
  )
}
