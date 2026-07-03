import '@testing-library/jest-dom/vitest'

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies pulse animation class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('sets width and height via style', () => {
    const { container } = render(<Skeleton width={100} height={20} />)
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe('100px')
    expect(el.style.height).toBe('20px')
  })

  it('merges custom className', () => {
    const { container } = render(<Skeleton className="rounded-full" />)
    expect(container.firstChild).toHaveClass('rounded-full')
  })
})
