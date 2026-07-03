import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'

describe('Button', () => {
  it('renders as a button element', () => {
    render(<Button>Click</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click')
  })

  it('applies solid variant by default', () => {
    render(<Button>Go</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })

  it('applies destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('handles click', () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Press</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>No</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled and busy when loading', () => {
    render(<Button loading>Saving</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })

  it('shows spinner when loading', () => {
    render(<Button loading>Wait</Button>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders as child element with asChild', () => {
    render(
      <Button asChild>
        <a href="/home">Home</a>
      </Button>,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/home')
    expect(link).toHaveClass('bg-primary')
  })

  it('merges custom className', () => {
    render(<Button className="mt-4">Styled</Button>)
    expect(screen.getByRole('button')).toHaveClass('mt-4')
  })
})
