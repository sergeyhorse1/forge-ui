import { useCallback, useMemo } from 'react'

import { useControllableState } from '../../hooks'
import type { RowKey, SelectionMode, SelectionOptions } from './types'

type Key = string | number

interface UseSelectionResult {
  mode: SelectionMode
  selectedKeys: ReadonlySet<Key>
  isSelected: (key: Key) => boolean
  toggle: (key: Key) => void
  toggleAll: () => void
  clear: () => void
  allSelected: boolean
  someSelected: boolean
}

/**
 * Headless row-selection engine. Supports `none`, `single` and `multi` modes
 * with an (optionally controlled) `Set` of row keys. `toggleAll` is a no-op
 * outside `multi` mode.
 */
export function useSelection<TRow>(
  rows: readonly TRow[],
  getRowKey: RowKey<TRow>,
  options: SelectionOptions | undefined,
): UseSelectionResult {
  const mode = options?.mode ?? 'none'

  const [selectedKeys, setSelectedKeys] = useControllableState<ReadonlySet<Key>>(
    {
      value: options?.value,
      defaultValue: options?.defaultValue ?? new Set<Key>(),
      onChange: options?.onChange
        ? (next) => options.onChange!(new Set(next))
        : undefined,
    },
  )

  const allKeys = useMemo(
    () => rows.map((row, index) => getRowKey(row, index)),
    [rows, getRowKey],
  )

  const isSelected = useCallback(
    (key: Key) => selectedKeys.has(key),
    [selectedKeys],
  )

  const toggle = useCallback(
    (key: Key) => {
      if (mode === 'none') return
      setSelectedKeys((prev) => {
        if (mode === 'single') {
          return prev.has(key) ? new Set<Key>() : new Set<Key>([key])
        }
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
    [mode, setSelectedKeys],
  )

  const toggleAll = useCallback(() => {
    if (mode !== 'multi' || allKeys.length === 0) return
    setSelectedKeys((prev) => {
      const everySelected = allKeys.every((key) => prev.has(key))
      return everySelected ? new Set<Key>() : new Set<Key>(allKeys)
    })
  }, [mode, allKeys, setSelectedKeys])

  const clear = useCallback(() => {
    setSelectedKeys(new Set<Key>())
  }, [setSelectedKeys])

  const allSelected =
    allKeys.length > 0 && allKeys.every((key) => selectedKeys.has(key))
  // Compute "some selected" against the *visible* rows, not the raw set size, so
  // a header tristate checkbox is not stuck indeterminate when every still-
  // selected key belongs to rows that are no longer present (e.g. after a filter
  // or dataset change left stale keys in the controlled set).
  const someSelected =
    !allSelected && allKeys.some((key) => selectedKeys.has(key))

  return {
    mode,
    selectedKeys,
    isSelected,
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
  }
}
