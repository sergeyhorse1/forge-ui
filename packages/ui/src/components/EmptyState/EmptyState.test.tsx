import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No results" />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('renders description and action', () => {
    render(
      <EmptyState
        title="Nothing here"
        description="Try a different filter"
        action={<button>Reset</button>}
      />,
    )
    expect(screen.getByText('Try a different filter')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
  })

  it('hides the icon from assistive tech', () => {
    const { container } = render(
      <EmptyState title="Empty" icon={<svg data-testid="glyph" />} />,
    )
    const wrapper = container.querySelector('[aria-hidden="true"]')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper?.querySelector('svg')).toBeInTheDocument()
  })

  it('omits optional slots when not provided', () => {
    const { container } = render(<EmptyState title="Only title" />)
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
  })
})
