import { useSyncExternalStore } from 'react'

function getServerSnapshot(): boolean {
  // No `matchMedia` during SSR; default to "does not match" so the first client
  // paint can hydrate without assuming a viewport.
  return false
}

/**
 * Track whether a CSS media query currently matches.
 *
 * Built on `useSyncExternalStore` so it stays consistent under concurrent
 * rendering and tearing-free across multiple subscribers to the same query.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onChange: () => void): (() => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return () => {}
    }
    const list = window.matchMedia(query)
    list.addEventListener('change', onChange)
    return () => {
      list.removeEventListener('change', onChange)
    }
  }

  const getSnapshot = (): boolean => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia(query).matches
  }

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
