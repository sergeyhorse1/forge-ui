import { useCallback, useSyncExternalStore } from 'react'

function getServerSnapshot(): boolean {
  // В SSR нет matchMedia — отдаём "не совпадает", чтобы первый клиентский paint
  // гидрировался, не угадывая вьюпорт.
  return false
}

/**
 * Track whether a CSS media query currently matches, tearing-free under
 * concurrent rendering and across multiple subscribers to the same query.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {}
      }
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => {
        list.removeEventListener('change', onChange)
      }
    },
    [query],
  )

  const getSnapshot = useCallback((): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia(query).matches
  }, [query])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
