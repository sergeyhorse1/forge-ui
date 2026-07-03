import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('applies default variant classes', () => {
    render(<Badge>Tag</Badge>)
    expect(screen.getByText('Tag')).toHaveClass('bg-primary')
  })

  it('applies destructive variant', () => {
    render(<Badge variant="destructive">Error</Badge>)
    expect(screen.getByText('Error')).toHaveClass('bg-destructive')
  })

  it('applies size variant', () => {
    render(<Badge size="sm">Sm</Badge>)
    expect(screen.getByText('Sm')).toHaveClass('text-xs')
  })

  it('merges custom className', () => {
    render(<Badge className="ml-2">X</Badge>)
    expect(screen.getByText('X')).toHaveClass('ml-2')
  })
})
