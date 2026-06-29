import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFocusVisible } from './useFocusVisible'

function pressKey(init?: KeyboardEventInit): void {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }))
  })
}

function pointerDown(): void {
  act(() => {
    document.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  })
}

describe('useFocusVisible', () => {
  it('switches to false after pointer interaction', () => {
    const { result } = renderHook(() => useFocusVisible())

    pointerDown()
    expect(result.current).toBe(false)
  })

  it('switches back to true after keyboard interaction', () => {
    const { result } = renderHook(() => useFocusVisible())

    pointerDown()
    expect(result.current).toBe(false)

    pressKey({ key: 'Tab' })
    expect(result.current).toBe(true)
  })

  it('ignores modifier-only key presses', () => {
    const { result } = renderHook(() => useFocusVisible())

    pointerDown()
    expect(result.current).toBe(false)

    pressKey({ key: 'Control', ctrlKey: true })
    expect(result.current).toBe(false)
  })

  it('shares modality across simultaneous subscribers', () => {
    const first = renderHook(() => useFocusVisible())
    const second = renderHook(() => useFocusVisible())

    pointerDown()
    expect(first.result.current).toBe(false)
    expect(second.result.current).toBe(false)

    pressKey({ key: 'Enter' })
    expect(first.result.current).toBe(true)
    expect(second.result.current).toBe(true)
  })
})
