import { useEffect, useMemo, useRef, useState } from 'react'

import { useDebouncedValue } from '../../hooks'
import { filterGroups, normalizeGroups } from './helpers'
import type { ComboboxGroup, ComboboxItems, ComboboxLoader } from './types'

interface UseComboboxItemsParams {
  items?: ComboboxItems
  loadItems?: ComboboxLoader
  query: string
  debounceMs: number
  open: boolean
}

interface ComboboxItemsState {
  groups: ComboboxGroup[]
  loading: boolean
}

const EMPTY: ComboboxItems = []

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
  // Запрос, для которого asyncGroups уже актуальны. null = ни один ещё не резолвился.
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null)

  // Монотонный счётчик отсеивает устаревшие ответы — если старый (медленный) запрос
  // резолвится после нового, он игнорируется. cancelled-флаг ниже — defense-in-depth
  // на размонтирование/смену эффекта (не отдельный тест, дублирует гард).
  const requestIdRef = useRef(0)
  const loadRef = useRef(loadItems)
  loadRef.current = loadItems

  useEffect(() => {
    const loader = loadRef.current
    if (loader === undefined || !open) return

    const requestId = (requestIdRef.current += 1)
    setLoading(true)

    let cancelled = false
    loader(debouncedQuery)
      .then((result) => {
        if (cancelled || requestId !== requestIdRef.current) return
        setAsyncGroups(normalizeGroups(result))
        setResolvedQuery(debouncedQuery)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled || requestId !== requestIdRef.current) return
        setAsyncGroups([])
        setResolvedQuery(debouncedQuery)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, open])

  if (!isAsync) {
    return { groups: syncGroups, loading: false }
  }
  // Пока текущий debounced-запрос не резолвился — считаем loading, даже до того как
  // эффект успел выставить флаг. Инвариант: нет кадра «No results» до первого ответа.
  const effectiveLoading = open && (loading || resolvedQuery !== debouncedQuery)
  return { groups: asyncGroups, loading: effectiveLoading }
}
