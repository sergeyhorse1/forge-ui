import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders with status role', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has default aria-label', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading')
  })

  it('accepts custom aria-label', () => {
    render(<Spinner aria-label="Please wait" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Please wait')
  })

  it('applies size variant classes', () => {
    const { container } = render(<Spinner size="lg" />)
    expect(container.querySelector('svg')).toHaveClass('size-8')
  })

  it('merges custom className', () => {
    const { container } = render(<Spinner className="text-red-500" />)
    expect(container.querySelector('svg')).toHaveClass('text-red-500')
  })
})
