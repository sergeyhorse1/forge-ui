import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('collapses conflicting Tailwind utilities so the last one wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('keeps non-conflicting utilities', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('flattens conditional and array inputs', () => {
    const isHidden = false
    expect(
      cn('flex', ['items-center', isHidden && 'hidden'], { 'gap-2': true, 'gap-4': false }),
    ).toBe('flex items-center gap-2')
  })

  it('returns an empty string for no truthy inputs', () => {
    expect(cn(undefined, null, false)).toBe('')
  })
})
