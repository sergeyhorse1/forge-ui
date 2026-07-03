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

  // pendingRef аккумулирует значение между синхронными updater'ами в одном тике
  // (до коммита), чтобы цепочка функциональных апдейтов вела себя как useState.
  // В controlled-режиме тут лежит лишь предложенное через onChange значение —
  // сброс ниже realign'ит его с закоммиченным value, расхождение живёт не дольше тика.
  const currentRef = useRef(current)
  currentRef.current = current
  const pendingRef = useRef(current)

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const setValue = useCallback(
    (next: SetStateAction<T>) => {
      // Резолвим от самого свежего значения: pending, если апдейт в этом же тике
      // ещё не закоммичен, иначе committed.
      const base = isUpdater(next) ? pendingRef.current : currentRef.current
      const resolved = isUpdater(next) ? next(base) : next
      pendingRef.current = resolved
      if (!isControlled) {
        setUncontrolled(resolved)
      }
      onChangeRef.current?.(resolved)
    },
    [isControlled],
  )

  // После коммита pending снова равен закоммиченному значению.
  pendingRef.current = current

  return [current, setValue]
}
