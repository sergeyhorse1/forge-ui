import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useControllableState } from './useControllableState'

describe('useControllableState', () => {
  it('seeds uncontrolled state from the default value', () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 'open' }))
    expect(result.current[0]).toBe('open')
  })

  it('updates its own state and reports changes while uncontrolled', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useControllableState({ defaultValue: 1, onChange }))

    act(() => result.current[1](2))

    expect(result.current[0]).toBe(2)
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('resolves functional updaters against the current value', () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 10 }))

    act(() => result.current[1]((prev) => prev + 5))

    expect(result.current[0]).toBe(15)
  })

  it('reflects the controlled value and never holds internal state', () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ value, onChange }),
      { initialProps: { value: 'a' } },
    )

    expect(result.current[0]).toBe('a')

    act(() => result.current[1]('b'))

    // Setter must not mutate internal state in controlled mode...
    expect(result.current[0]).toBe('a')
    // ...but still notifies the parent so it can update the prop.
    expect(onChange).toHaveBeenCalledWith('b')

    rerender({ value: 'b' })
    expect(result.current[0]).toBe('b')
  })

  it('passes a functional updater the controlled value', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useControllableState({ value: 3, onChange }))

    act(() => result.current[1]((prev) => prev * 2))

    expect(onChange).toHaveBeenLastCalledWith(6)
  })

  it('keeps the setter referentially stable across renders', () => {
    const { result, rerender } = renderHook(
      ({ defaultValue }) => useControllableState({ defaultValue }),
      { initialProps: { defaultValue: 0 } },
    )

    const first = result.current[1]
    rerender({ defaultValue: 0 })
    expect(result.current[1]).toBe(first)
  })
})
