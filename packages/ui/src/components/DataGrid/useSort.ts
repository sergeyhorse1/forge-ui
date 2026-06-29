import { useCallback, useMemo } from 'react'

import { useControllableState } from '../../hooks'
import type {
  ColumnDef,
  ColumnSortInfo,
  SortOptions,
  SortState,
} from './types'

interface UseSortResult<TRow> {
  state: SortState<TRow>[]
  sortedRows: readonly TRow[]
  toggle: (columnId: string, additive: boolean) => void
  infoFor: (columnId: string) => ColumnSortInfo
}

/** Cycle a single column through asc -> desc -> none. */
function cycleDirection<TRow>(
  current: SortState<TRow> | undefined,
): 'asc' | 'desc' | null {
  if (!current) return 'asc'
  if (current.direction === 'asc') return 'desc'
  return null
}

/** Default comparison: numbers compare numerically, everything else by locale. */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  return String(a).localeCompare(String(b))
}

/**
 * Headless sort engine. Owns the (optionally controlled) ordered list of sort
 * criteria and derives the sorted rows with a stable, multi-key comparator.
 */
export function useSort<TRow>(
  rows: readonly TRow[],
  columns: readonly ColumnDef<TRow>[],
  options: SortOptions<TRow> | undefined,
): UseSortResult<TRow> {
  const multiSort = options?.multiSort ?? false

  const [state, setState] = useControllableState<SortState<TRow>[]>({
    value: options?.value,
    defaultValue: options?.defaultValue ?? [],
    onChange: options?.onChange,
  })

  const columnsById = useMemo(() => {
    const map = new Map<string, ColumnDef<TRow>>()
    for (const column of columns) map.set(String(column.id), column)
    return map
  }, [columns])

  const toggle = useCallback(
    (columnId: string, additive: boolean) => {
      setState((prev) => {
        const existing = prev.find((entry) => entry.columnId === columnId)
        const nextDirection = cycleDirection(existing)

        if (!multiSort || !additive) {
          if (nextDirection === null) return []
          return [{ columnId, direction: nextDirection }]
        }

        const withoutColumn = prev.filter(
          (entry) => entry.columnId !== columnId,
        )
        if (nextDirection === null) return withoutColumn
        return [...withoutColumn, { columnId, direction: nextDirection }]
      })
    },
    [multiSort, setState],
  )

  const sortedRows = useMemo(() => {
    if (state.length === 0) return rows

    // Decorate-sort-undecorate keeps the sort stable (ties retain input order).
    const decorated = rows.map((row, index) => ({ row, index }))

    decorated.sort((left, right) => {
      for (const { columnId, direction } of state) {
        const column = columnsById.get(columnId)
        if (!column) continue

        const factor = direction === 'asc' ? 1 : -1
        const result = column.compare
          ? column.compare(left.row, right.row)
          : compareValues(
              readValue(column, left.row),
              readValue(column, right.row),
            )
        if (result !== 0) return result * factor
      }
      return left.index - right.index
    })

    return decorated.map((entry) => entry.row)
  }, [rows, state, columnsById])

  const infoFor = useCallback(
    (columnId: string): ColumnSortInfo => {
      const index = state.findIndex((entry) => entry.columnId === columnId)
      if (index === -1) return { direction: null, priority: null }
      return {
        direction: state[index]!.direction,
        priority: state.length > 1 ? index + 1 : null,
      }
    },
    [state],
  )

  return { state, sortedRows, toggle, infoFor }
}

function readValue<TRow>(column: ColumnDef<TRow>, row: TRow): unknown {
  if (column.accessor) return column.accessor(row)
  return (row as Record<string, unknown>)[String(column.id)]
}
