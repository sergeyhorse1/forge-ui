import { useEffect, useMemo, useRef, useState } from 'react'

import { useDebouncedValue } from '../../hooks'
import { filterGroups, normalizeGroups } from './helpers'
import type { ComboboxGroup, ComboboxItems, ComboboxLoader } from './types'

interface UseComboboxItemsParams {
  items?: ComboboxItems
  loadItems?: ComboboxLoader
  query: string
  debounceMs: number
  /** Fetch only while the listbox is open. */
  open: boolean
}

interface ComboboxItemsState {
  groups: ComboboxGroup[]
  loading: boolean
}

const EMPTY: ComboboxItems = []

/**
 * Resolve the options to render. In sync mode the static `items` are filtered
 * client-side by the query. In async mode the debounced query drives `loadItems`
 * and stale responses are discarded so the latest request always wins.
 */
export function useComboboxItems({
  items,
  loadItems,
  query,
  debounceMs,
  open,
}: UseComboboxItemsParams): ComboboxItemsState {
  const isAsync = loadItems !== undefined

  const syncGroups = useMemo(
    () => filterGroups(normalizeGroups(items ?? EMPTY), query),
    [items, query],
  )

  const debouncedQuery = useDebouncedValue(query, debounceMs)
  const [asyncGroups, setAsyncGroups] = useState<ComboboxGroup[]>([])
  const [loading, setLoading] = useState(false)

  // Монотонный счётчик: ответ применяется, только если он от последнего запроса —
  // иначе медленный старый ответ перезатёр бы свежий (load-bearing, есть тест).
  const requestIdRef = useRef(0)
  const loadRef = useRef(loadItems)
  loadRef.current = loadItems

  useEffect(() => {
    const loader = loadRef.current
    if (loader === undefined || !open) return

    const requestId = (requestIdRef.current += 1)
    setLoading(true)

    // cancelled гасит setState после размонтирования/смены эффекта (в дополнение к
    // requestId-гарду, отсеивающему устаревшие ответы).
    let cancelled = false
    loader(debouncedQuery)
      .then((result) => {
        if (cancelled || requestId !== requestIdRef.current) return
        setAsyncGroups(normalizeGroups(result))
        setLoading(false)
      })
      .catch(() => {
        if (cancelled || requestId !== requestIdRef.current) return
        setAsyncGroups([])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, open])

  if (!isAsync) {
    return { groups: syncGroups, loading: false }
  }
  return { groups: asyncGroups, loading }
}
