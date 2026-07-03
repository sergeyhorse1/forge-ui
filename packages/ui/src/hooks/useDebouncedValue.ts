import { useEffect, useState } from 'react'

/**
 * Return a copy of `value` that only updates after it has stayed unchanged for
 * `delayMs` — e.g. to debounce a search input before triggering expensive work.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => {
      window.clearTimeout(id)
    }
  }, [value, delayMs])

  return debounced
}
