import { useCallback, useRef, useState } from 'react'

export interface UseControllableStateParams<T> {
  /** Controlled value. When provided (not `undefined`), the hook is controlled. */
  value?: T | undefined
  /** Initial value used while uncontrolled. */
  defaultValue?: T | undefined
  /** Called whenever the value should change, in both modes. */
  onChange?: ((value: T) => void) | undefined
}

type SetStateAction<T> = T | ((prev: T) => T)

function isUpdater<T>(value: SetStateAction<T>): value is (prev: T) => T {
  return typeof value === 'function'
}

/**
 * Mirror React's controlled/uncontrolled component pattern.
 *
 * If `value` is supplied the component is controlled and the hook never holds
 * internal state; otherwise it manages its own state seeded by `defaultValue`.
 * In both cases `onChange` is invoked with the next value, so a parent can stay
 * in sync regardless of mode.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateParams<T>): [T, (next: SetStateAction<T>) => void] {
  const [uncontrolled, setUncontrolled] = useState<T | undefined>(defaultValue)
  const isControlled = value !== undefined
  const current = (isControlled ? value : uncontrolled) as T

  // Keep the latest value in a ref so the setter stays referentially stable even
  // when functional updaters need to read the controlled value.
  const currentRef = useRef(current)
  currentRef.current = current

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const setValue = useCallback(
    (next: SetStateAction<T>) => {
      const resolved = isUpdater(next) ? next(currentRef.current) : next
      if (!isControlled) {
        setUncontrolled(resolved)
      }
      onChangeRef.current?.(resolved)
    },
    [isControlled],
  )

  return [current, setValue]
}
