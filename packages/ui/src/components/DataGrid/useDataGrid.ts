import { useMemo } from 'react'

import {
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  type DataGridModel,
  type ResolvedColumn,
  type UseDataGridOptions,
} from './types'
import { useColumnResize } from './useColumnResize'
import { useSelection } from './useSelection'
import { useSort } from './useSort'

/**
 * Headless DataGrid controller.
 *
 * Composes the sort, selection and resize engines and resolves column layout
 * (frozen split + effective widths), returning a normalised {@link DataGridModel}
 * that a thin presentation layer renders. No DOM, no virtualization here — that
 * keeps the logic unit-testable and the rendering swappable.
 */
export function useDataGrid<TRow>(
  options: UseDataGridOptions<TRow>,
): DataGridModel<TRow> {
  const { rows, columns, getRowKey } = options

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

  const { frozenColumns, scrollColumns, resolvedColumns, frozenWidth } =
    useMemo(() => {
      const resolved = columns.map((def) => ({
        def,
        id: String(def.id),
        width: resize.widthOf(String(def.id)),
        minWidth: def.minWidth ?? MIN_COLUMN_WIDTH,
        align: def.align ?? 'left',
        frozen: def.frozen ?? false,
        sortable: def.sortable ?? true,
        resizable: def.resizable ?? true,
      }))

      const frozen = resolved.filter((column) => column.frozen)
      const scroll = resolved.filter((column) => !column.frozen)

      // Frozen columns always render first, regardless of declaration order.
      // Assign each its canonical 1-based aria-colindex in that combined order
      // so horizontal virtualization (which mounts only a window) never skews it.
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
    }, [columns, resize])

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
