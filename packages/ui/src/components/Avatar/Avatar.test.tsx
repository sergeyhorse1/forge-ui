import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('renders fallback when no src provided', () => {
    render(<Avatar alt="John Doe" fallback="JD" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders image when src is provided', () => {
    render(<Avatar src="/photo.jpg" alt="User" fallback="U" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/photo.jpg')
  })

  it('shows fallback on image error', () => {
    render(<Avatar src="/broken.jpg" alt="User" fallback="U" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('applies size variant', () => {
    const { container } = render(<Avatar size="lg" alt="Big" fallback="B" />)
    expect(container.firstChild).toHaveClass('size-14')
  })

  it('fallback has accessible label', () => {
    render(<Avatar alt="Jane Smith" fallback="JS" />)
    expect(screen.getByLabelText('Jane Smith')).toBeInTheDocument()
  })
})
