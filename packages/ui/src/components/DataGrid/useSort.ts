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

/**
 * Type rank used to give mixed-type columns a *total* order. A comparator that
 * falls back to `String(a).localeCompare(String(b))` only when both operands are
 * the same type is not transitive across mixed types (e.g. number vs string vs
 * Date), which yields a non-deterministic sort. Ranking by type first guarantees
 * transitivity; values within a rank compare naturally. Nullish values rank
 * lowest so they sink to the start of an ascending sort.
 */
function typeRank(value: unknown): number {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : 1
  if (value instanceof Date) return 2
  if (typeof value === 'boolean') return 3
  return 4 // strings and everything else, compared via String()
}

/**
 * Total-order comparator. Values are first ordered by {@link typeRank}; within a
 * rank, numbers compare numerically, dates by timestamp, booleans false<true and
 * the rest lexicographically. This keeps the sort deterministic and transitive
 * even when a column mixes value types.
 */
function compareValues(a: unknown, b: unknown): number {
  const rankA = typeRank(a)
  const rankB = typeRank(b)
  if (rankA !== rankB) return rankA - rankB
  if (rankA === 0) return 0 // both nullish/NaN — equal
  if (rankA === 1) return (a as number) - (b as number)
  if (rankA === 2) return (a as Date).getTime() - (b as Date).getTime()
  if (rankA === 3) return Number(a as boolean) - Number(b as boolean)
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
      // Ignore toggles for columns that do not exist: appending a phantom entry
      // would leave stale state and needlessly break referential equality of the
      // derived rows.
      if (!columnsById.has(columnId)) return

      setState((prev) => {
        const existing = prev.find((entry) => entry.columnId === columnId)
        const nextDirection = cycleDirection(existing)

        if (!multiSort || !additive) {
          if (nextDirection === null) return []
          return [{ columnId, direction: nextDirection }]
        }

        if (nextDirection === null) {
          return prev.filter((entry) => entry.columnId !== columnId)
        }

        // Replace an existing entry *in place* so changing the direction of a
        // non-last column keeps its multi-sort priority; only a brand-new column
        // is appended to the end.
        if (existing) {
          return prev.map((entry) =>
            entry.columnId === columnId
              ? { columnId, direction: nextDirection }
              : entry,
          )
        }
        return [...prev, { columnId, direction: nextDirection }]
      })
    },
    [multiSort, setState, columnsById],
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
