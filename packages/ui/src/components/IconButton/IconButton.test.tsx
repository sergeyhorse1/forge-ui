import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { IconButton } from './IconButton'

const TestIcon = () => <span data-testid="test-icon">★</span>

describe('IconButton', () => {
  it('renders as a button with accessible label', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Star" />)
    expect(screen.getByRole('button', { name: 'Star' })).toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Star" />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('handles click', () => {
    const handler = vi.fn()
    render(<IconButton icon={<TestIcon />} aria-label="Star" onClick={handler} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('hides icon when loading', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Star" loading />)
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('applies square aspect-ratio class', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Star" />)
    expect(screen.getByRole('button')).toHaveClass('aspect-square')
  })

  it('applies variant from Button', () => {
    render(<IconButton icon={<TestIcon />} aria-label="Star" variant="ghost" />)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')
  })
})
