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

function cycleDirection<TRow>(
  current: SortState<TRow> | undefined,
): 'asc' | 'desc' | null {
  if (!current) return 'asc'
  if (current.direction === 'asc') return 'desc'
  return null
}

// Ранг по типу даёт смешанным столбцам тотальный порядок: fallback на
// String().localeCompare только при совпадении типов не транзитивен (number vs
// string vs Date) и даёт недетерминированную сортировку. Ранжируем по типу,
// внутри ранга сравниваем нативно; nullish — ниже всех, тонут в начало asc.
function typeRank(value: unknown): number {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : 1
  if (value instanceof Date) return 2
  if (typeof value === 'boolean') return 3
  return 4 // строки и прочее — через String()
}

function compareValues(a: unknown, b: unknown): number {
  const rankA = typeRank(a)
  const rankB = typeRank(b)
  if (rankA !== rankB) return rankA - rankB
  if (rankA === 0) return 0 // оба nullish/NaN — равны
  if (rankA === 1) return (a as number) - (b as number)
  if (rankA === 2) return (a as Date).getTime() - (b as Date).getTime()
  if (rankA === 3) return Number(a as boolean) - Number(b as boolean)
  return String(a).localeCompare(String(b))
}

// Headless-движок сортировки: держит (опц. controlled) упорядоченный список
// критериев и выводит отсортированные строки стабильным multi-key компаратором.
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
      // Игнорируем тогглы несуществующих столбцов: фантомная запись оставила бы
      // мусор в state и зря ломала referential equality выводимых строк.
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

        // Меняем запись на месте, чтобы смена направления не-последнего столбца
        // сохранила его multi-sort приоритет; в конец добавляется только новый.
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

    // Decorate-sort-undecorate держит сортировку стабильной (равные — в исходном порядке).
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
