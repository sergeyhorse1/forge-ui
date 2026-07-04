import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MetricCard } from './MetricCard'

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(<MetricCard title="Revenue" value="$12.4k" />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$12.4k')).toBeInTheDocument()
  })

  it('shows a positive delta with the success colour', () => {
    render(<MetricCard title="Users" value={120} delta={12} />)
    const delta = screen.getByText('12').parentElement
    expect(delta).toHaveClass('text-success')
  })

  it('shows a negative delta with the destructive colour and absolute value', () => {
    render(<MetricCard title="Churn" value={5} delta={-3} />)
    const delta = screen.getByText('3').parentElement
    expect(delta).toHaveClass('text-destructive')
  })

  it('shows a zero delta as muted', () => {
    render(<MetricCard title="Flat" value="99%" delta={0} />)
    const delta = screen.getByText('0').parentElement
    expect(delta).toHaveClass('text-muted-foreground')
  })

  it('renders a delta label', () => {
    render(<MetricCard title="Sales" value={9} delta={{ value: 8, label: 'vs last week' }} />)
    expect(screen.getByText('vs last week')).toBeInTheDocument()
  })

  it('renders a decorative sparkline without crashing on a flat series', () => {
    const { container } = render(
      <MetricCard title="Steady" value={7} sparkline={[5, 5, 5, 5]} />,
    )
    const svg = container.querySelector('svg[aria-hidden="true"] polyline')
    expect(svg).toBeInTheDocument()
  })

  it('does not crash on empty or single-point sparklines', () => {
    expect(() =>
      render(<MetricCard title="Empty" value={0} sparkline={[]} />),
    ).not.toThrow()
    expect(() =>
      render(<MetricCard title="Single" value={1} sparkline={[42]} />),
    ).not.toThrow()
  })

  it('exposes the sparkline as an image when labelled', () => {
    render(
      <MetricCard title="Trend" value={7} sparkline={[1, 2, 3]} sparklineLabel="7 day trend" />,
    )
    expect(screen.getByRole('img', { name: '7 day trend' })).toBeInTheDocument()
  })
})
