import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMediaQuery } from './useMediaQuery'

interface FakeMediaQueryList {
  matches: boolean
  media: string
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  dispatch(matches: boolean): void
}

function installMatchMedia(initialMatches: boolean): FakeMediaQueryList {
  const changeListeners = new Set<(event: { matches: boolean }) => void>()
  const list: FakeMediaQueryList = {
    matches: initialMatches,
    media: '',
    addEventListener: vi.fn((_type: string, listener: (event: { matches: boolean }) => void) => {
      changeListeners.add(listener)
    }),
    removeEventListener: vi.fn(
      (_type: string, listener: (event: { matches: boolean }) => void) => {
        changeListeners.delete(listener)
      },
    ),
    dispatch(matches: boolean) {
      list.matches = matches
      for (const listener of changeListeners) listener({ matches })
    },
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      list.media = query
      return list
    }),
  )

  return list
}

describe('useMediaQuery', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports the current match state on first render', () => {
    installMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('reacts when the query starts matching', () => {
    const list = installMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)

    act(() => list.dispatch(true))
    expect(result.current).toBe(true)
  })

  it('removes its change listener on unmount', () => {
    const list = installMatchMedia(false)
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(list.addEventListener).toHaveBeenCalledTimes(1)

    unmount()
    expect(list.removeEventListener).toHaveBeenCalledTimes(1)
  })

  it('falls back to false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)
  })
})
