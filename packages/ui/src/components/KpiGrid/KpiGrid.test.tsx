import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { KpiGrid } from './KpiGrid'

describe('KpiGrid', () => {
  it('renders children', () => {
    render(
      <KpiGrid>
        <div>one</div>
        <div>two</div>
      </KpiGrid>,
    )
    expect(screen.getByText('one')).toBeInTheDocument()
    expect(screen.getByText('two')).toBeInTheDocument()
  })

  it('applies the default auto-fit template', () => {
    const { container } = render(<KpiGrid />)
    const grid = container.firstElementChild as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(200px, 1fr))')
  })

  it('honours a custom minColWidth', () => {
    const { container } = render(<KpiGrid minColWidth={320} />)
    const grid = container.firstElementChild as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(320px, 1fr))')
  })

  it('merges caller styles', () => {
    const { container } = render(<KpiGrid style={{ padding: 8 }} />)
    const grid = container.firstElementChild as HTMLElement
    expect(grid.style.padding).toBe('8px')
  })
})
